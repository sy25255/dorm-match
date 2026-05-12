package com.dormmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dormmatch.common.BusinessException;
import com.dormmatch.entity.*;
import com.dormmatch.mapper.*;
import com.dormmatch.service.InviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InviteServiceImpl implements InviteService {

    private final InviteMapper inviteMapper;
    private final StudentMapper studentMapper;
    private final PairingMapper pairingMapper;
    private final PairingMemberMapper pairingMemberMapper;
    private final MatchResultMapper matchResultMapper;

    @Value("${app.invite.max-pending-sent}")
    private int maxPendingSent;
    @Value("${app.invite.max-pending-received}")
    private int maxPendingReceived;
    @Value("${app.invite.expire-hours}")
    private int expireHours;

    @Override
    @Transactional
    public Invite sendInvite(Long fromStudentId, Long toStudentId, String message) {
        Student from = checkStudent(fromStudentId);
        Student to = checkStudent(toStudentId);

        if (from.getMatchStatus() == 2 || from.getMatchStatus() == 3) {
            throw BusinessException.badRequest("您已完成配对，无法发送邀请");
        }
        if (to.getMatchStatus() == 2 || to.getMatchStatus() == 3) {
            throw BusinessException.badRequest("对方已完成配对");
        }

        long pendingSent = inviteMapper.selectCount(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getFromStudentId, fromStudentId)
                        .eq(Invite::getStatus, 0)
        );
        if (pendingSent >= maxPendingSent) {
            throw BusinessException.badRequest("待处理邀请已达上限(" + maxPendingSent + "个)");
        }

        long pendingReceived = inviteMapper.selectCount(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getToStudentId, fromStudentId)
                        .eq(Invite::getStatus, 0)
        );
        if (pendingReceived >= maxPendingReceived) {
            throw BusinessException.badRequest("您收到的待处理邀请已达上限，请先处理现有邀请");
        }

        long peerPendingReceived = inviteMapper.selectCount(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getToStudentId, toStudentId)
                        .eq(Invite::getStatus, 0)
        );
        if (peerPendingReceived >= maxPendingReceived) {
            throw BusinessException.badRequest("对方收到的待处理邀请已达上限，暂时无法发送");
        }

        Invite existing = inviteMapper.selectOne(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getFromStudentId, fromStudentId)
                        .eq(Invite::getToStudentId, toStudentId)
                        .eq(Invite::getStatus, 0)
        );
        if (existing != null) {
            throw BusinessException.badRequest("已向该同学发送过邀请，请等待对方处理");
        }

        Invite invite = new Invite();
        invite.setFromStudentId(fromStudentId);
        invite.setToStudentId(toStudentId);
        invite.setMessage(message);
        invite.setStatus(0);
        invite.setExpiresAt(LocalDateTime.now().plusHours(expireHours));
        inviteMapper.insert(invite);

        if (from.getMatchStatus() == 0) {
            from.setMatchStatus(1);
            studentMapper.updateById(from);
        }

        if (to.getMatchStatus() == 0) {
            to.setMatchStatus(1);
            studentMapper.updateById(to);
        }

        return invite;
    }

    @Override
    @Transactional
    public void acceptInvite(Long studentId, Long inviteId) {
        Invite invite = inviteMapper.selectById(inviteId);
        if (invite == null) {
            throw BusinessException.notFound("邀请不存在");
        }
        if (!invite.getToStudentId().equals(studentId)) {
            throw BusinessException.badRequest("无权处理此邀请");
        }
        if (invite.getStatus() != 0) {
            throw BusinessException.badRequest("邀请已过期或已处理");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            invite.setStatus(3);
            inviteMapper.updateById(invite);
            throw BusinessException.badRequest("邀请已过期");
        }

        invite.setStatus(1);
        invite.setProcessedAt(LocalDateTime.now());
        inviteMapper.updateById(invite);

        lockPairing(studentId, invite.getFromStudentId());
    }

    @Override
    public void rejectInvite(Long studentId, Long inviteId) {
        Invite invite = inviteMapper.selectById(inviteId);
        if (invite == null || !invite.getToStudentId().equals(studentId)) {
            throw BusinessException.badRequest("邀请不存在或无权处理");
        }
        if (invite.getStatus() != 0) {
            throw BusinessException.badRequest("邀请已处理");
        }

        invite.setStatus(2);
        invite.setProcessedAt(LocalDateTime.now());
        inviteMapper.updateById(invite);
    }

    @Override
    public void withdrawInvite(Long studentId, Long inviteId) {
        Invite invite = inviteMapper.selectById(inviteId);
        if (invite == null || !invite.getFromStudentId().equals(studentId)) {
            throw BusinessException.badRequest("邀请不存在或无权撤回");
        }
        if (invite.getStatus() != 0) {
            throw BusinessException.badRequest("邀请已被处理，无法撤回");
        }

        invite.setStatus(4);
        invite.setProcessedAt(LocalDateTime.now());
        inviteMapper.updateById(invite);
    }

    @Override
    public List<Invite> getReceivedInvites(Long studentId) {
        expireInvites();
        return inviteMapper.selectList(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getToStudentId, studentId)
                        .orderByDesc(Invite::getCreatedAt)
        );
    }

    @Override
    public List<Invite> getSentInvites(Long studentId) {
        expireInvites();
        return inviteMapper.selectList(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getFromStudentId, studentId)
                        .orderByDesc(Invite::getCreatedAt)
        );
    }

    @Override
    public Map<String, Integer> getQuota(Long studentId) {
        expireInvites();
        long pendingSent = inviteMapper.selectCount(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getFromStudentId, studentId)
                        .eq(Invite::getStatus, 0)
        );
        long pendingReceived = inviteMapper.selectCount(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getToStudentId, studentId)
                        .eq(Invite::getStatus, 0)
        );

        Map<String, Integer> quota = new HashMap<>();
        quota.put("maxSent", maxPendingSent);
        quota.put("usedSent", (int) pendingSent);
        quota.put("remainingSent", maxPendingSent - (int) pendingSent);
        quota.put("maxReceived", maxPendingReceived);
        quota.put("usedReceived", (int) pendingReceived);
        quota.put("remainingReceived", maxPendingReceived - (int) pendingReceived);
        return quota;
    }

    @Override
    public Pairing getCurrentPairing(Long studentId) {
        PairingMember member = pairingMemberMapper.selectOne(
                new LambdaQueryWrapper<PairingMember>()
                        .eq(PairingMember::getStudentId, studentId)
        );
        if (member == null) return null;
        return pairingMapper.selectById(member.getPairingId());
    }

    @Override
    public List<Map<String, Object>> getPairingMembers(Long studentId) {
        PairingMember myMembership = pairingMemberMapper.selectOne(
                new LambdaQueryWrapper<PairingMember>()
                        .eq(PairingMember::getStudentId, studentId)
        );
        if (myMembership == null) return Collections.emptyList();

        List<PairingMember> allMembers = pairingMemberMapper.selectList(
                new LambdaQueryWrapper<PairingMember>()
                        .eq(PairingMember::getPairingId, myMembership.getPairingId())
        );

        return allMembers.stream().map(m -> {
            Student s = studentMapper.selectById(m.getStudentId());
            Map<String, Object> map = new HashMap<>();
            map.put("studentId", m.getStudentId());
            map.put("name", s != null ? s.getRealName() : "未知");
            map.put("avatarUrl", s != null ? s.getAvatarUrl() : null);
            map.put("isInitiator", m.getIsInitiator());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    void lockPairing(Long studentA, Long studentB) {
        Student a = studentMapper.selectById(studentA);
        Student b = studentMapper.selectById(studentB);

        a.setMatchStatus(2);
        b.setMatchStatus(2);
        studentMapper.updateById(a);
        studentMapper.updateById(b);

        String pairingCode = UUID.randomUUID().toString();
        Pairing pairing = new Pairing();
        pairing.setPairingCode(pairingCode);
        pairing.setGroupSize(2);
        pairing.setStatus(1);
        pairing.setLockedAt(LocalDateTime.now());
        pairingMapper.insert(pairing);

        PairingMember memberA = new PairingMember();
        memberA.setPairingId(pairing.getId());
        memberA.setStudentId(studentA);
        memberA.setIsInitiator(0);
        pairingMemberMapper.insert(memberA);

        PairingMember memberB = new PairingMember();
        memberB.setPairingId(pairing.getId());
        memberB.setStudentId(studentB);
        memberB.setIsInitiator(0);
        pairingMemberMapper.insert(memberB);

        cancelOtherPendingInvites(studentA);
        cancelOtherPendingInvites(studentB);
    }

    private void cancelOtherPendingInvites(Long studentId) {
        List<Invite> pendingInvites = inviteMapper.selectList(
                new LambdaQueryWrapper<Invite>()
                        .and(w -> w.eq(Invite::getFromStudentId, studentId)
                                .or().eq(Invite::getToStudentId, studentId))
                        .eq(Invite::getStatus, 0)
        );

        for (Invite invite : pendingInvites) {
            invite.setStatus(3);
            invite.setProcessedAt(LocalDateTime.now());
            inviteMapper.updateById(invite);
        }
    }

    private void expireInvites() {
        List<Invite> expired = inviteMapper.selectList(
                new LambdaQueryWrapper<Invite>()
                        .eq(Invite::getStatus, 0)
                        .lt(Invite::getExpiresAt, LocalDateTime.now())
        );

        for (Invite invite : expired) {
            invite.setStatus(3);
            invite.setProcessedAt(LocalDateTime.now());
            inviteMapper.updateById(invite);
        }
    }

    private Student checkStudent(Long id) {
        Student s = studentMapper.selectById(id);
        if (s == null || s.getStatus() != 1) {
            throw BusinessException.notFound("学生不存在");
        }
        if (s.getSurveyStatus() != 2) {
            throw BusinessException.badRequest("请先完成偏好问卷");
        }
        return s;
    }
}
