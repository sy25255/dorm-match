package com.dormmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dormmatch.common.BusinessException;
import com.dormmatch.entity.*;
import com.dormmatch.mapper.*;
import com.dormmatch.service.AllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationServiceImpl implements AllocationService {

    private final AllocationMapper allocationMapper;
    private final StudentMapper studentMapper;
    private final ObjectionMapper objectionMapper;
    private final PairingMapper pairingMapper;
    private final PairingMemberMapper pairingMemberMapper;
    private final DormitoryRoomMapper roomMapper;

    @Override
    public Map<String, Object> getMyAllocation(Long studentId) {
        Allocation allocation = allocationMapper.selectOne(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getStudentId, studentId)
        );
        if (allocation == null) return null;

        DormitoryRoom room = roomMapper.selectById(allocation.getRoomId());

        Map<String, Object> result = new HashMap<>();
        result.put("allocationId", allocation.getId());
        result.put("roomId", room != null ? room.getId() : null);
        result.put("roomNumber", room != null ? room.getRoomNumber() : null);
        result.put("bedNo", allocation.getBedNo());
        result.put("allocationType", allocation.getAllocationType());
        result.put("status", allocation.getStatus());
        result.put("confirmedByStudent", allocation.getConfirmedByStudent());

        List<Allocation> roommates = allocationMapper.selectList(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getRoomId, allocation.getRoomId())
                        .ne(Allocation::getStudentId, studentId)
        );

        List<Map<String, Object>> roommateList = roommates.stream().map(a -> {
            Student s = studentMapper.selectById(a.getStudentId());
            Map<String, Object> m = new HashMap<>();
            m.put("studentId", a.getStudentId());
            m.put("name", s != null ? s.getRealName() : "未知");
            m.put("bedNo", a.getBedNo());
            return m;
        }).collect(Collectors.toList());

        result.put("roommates", roommateList);
        return result;
    }

    @Override
    public void confirmAllocation(Long studentId) {
        Allocation allocation = allocationMapper.selectOne(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getStudentId, studentId)
        );
        if (allocation == null) {
            throw BusinessException.notFound("暂无分配结果");
        }
        allocation.setConfirmedByStudent(1);
        allocation.setStatus("CONFIRMED");
        allocation.setConfirmedAt(LocalDateTime.now());
        allocationMapper.updateById(allocation);
    }

    @Override
    public Objection submitObjection(Long studentId, String reason, String attachmentUrls) {
        Allocation allocation = allocationMapper.selectOne(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getStudentId, studentId)
        );
        if (allocation == null) {
            throw BusinessException.notFound("暂无分配结果，无法申诉");
        }

        Objection existing = objectionMapper.selectOne(
                new LambdaQueryWrapper<Objection>()
                        .eq(Objection::getStudentId, studentId)
                        .eq(Objection::getStatus, "PENDING")
        );
        if (existing != null) {
            throw BusinessException.badRequest("已有在途申诉，请等待处理结果");
        }

        Objection objection = new Objection();
        objection.setAllocationId(allocation.getId());
        objection.setStudentId(studentId);
        objection.setReason(reason);
        objection.setAttachmentUrls(attachmentUrls);
        objection.setStatus("PENDING");
        objectionMapper.insert(objection);

        allocation.setStatus("OBJECTION");
        allocationMapper.updateById(allocation);

        return objection;
    }

    @Override
    public List<Objection> getMyObjections(Long studentId) {
        return objectionMapper.selectList(
                new LambdaQueryWrapper<Objection>()
                        .eq(Objection::getStudentId, studentId)
                        .orderByDesc(Objection::getCreatedAt)
        );
    }

    @Override
    public Objection getObjectionDetail(Long studentId, Long objectionId) {
        Objection objection = objectionMapper.selectById(objectionId);
        if (objection == null || !objection.getStudentId().equals(studentId)) {
            throw BusinessException.notFound("申诉不存在");
        }
        return objection;
    }

    @Override
    @Transactional
    public void executeBatchAllocation(String batchCode) {
        List<Pairing> lockedPairings = pairingMapper.selectList(
                new LambdaQueryWrapper<Pairing>().eq(Pairing::getStatus, 1)
        );

        List<DormitoryRoom> availableRooms = roomMapper.selectList(
                new LambdaQueryWrapper<DormitoryRoom>()
                        .lt(DormitoryRoom::getOccupied, DormitoryRoom::getCapacity)
                        .ne(DormitoryRoom::getStatus, 3)
                        .orderByAsc(DormitoryRoom::getBuildingId)
                        .orderByAsc(DormitoryRoom::getRoomNumber)
        );

        int roomIndex = 0;

        for (Pairing pairing : lockedPairings) {
            List<PairingMember> members = pairingMemberMapper.selectList(
                    new LambdaQueryWrapper<PairingMember>()
                            .eq(PairingMember::getPairingId, pairing.getId())
            );

            DormitoryRoom room = null;
            while (roomIndex < availableRooms.size()) {
                DormitoryRoom candidate = availableRooms.get(roomIndex);
                if (candidate.getCapacity() - candidate.getOccupied() >= members.size()) {
                    room = candidate;
                    break;
                }
                roomIndex++;
            }

            if (room == null) {
                log.warn("无可用房间容纳配对组: pairingId={}, size={}", pairing.getId(), members.size());
                continue;
            }

            int bedNo = room.getOccupied() + 1;
            for (PairingMember member : members) {
                Allocation allocation = new Allocation();
                allocation.setStudentId(member.getStudentId());
                allocation.setRoomId(room.getId());
                allocation.setBedNo(bedNo++);
                allocation.setAllocationType("SELF_SELECT");
                allocation.setAllocationBatch(batchCode);
                allocation.setStatus("PENDING");
                allocationMapper.insert(allocation);

                Student s = studentMapper.selectById(member.getStudentId());
                s.setMatchStatus(3);
                studentMapper.updateById(s);
            }

            room.setOccupied(room.getOccupied() + members.size());
            room.setStatus(room.getOccupied() >= room.getCapacity() ? 2 : 1);
            roomMapper.updateById(room);

            pairing.setStatus(2);
            pairingMapper.updateById(pairing);
        }

        roomIndex = 0;

        List<Student> unmatched = studentMapper.selectList(
                new LambdaQueryWrapper<Student>()
                        .eq(Student::getSurveyStatus, 2)
                        .lt(Student::getMatchStatus, 2)
                        .eq(Student::getStatus, 1)
        );

        for (Student student : unmatched) {
            DormitoryRoom room = null;
            while (roomIndex < availableRooms.size()) {
                DormitoryRoom candidate = availableRooms.get(roomIndex);
                if (candidate.getOccupied() < candidate.getCapacity()) {
                    room = candidate;
                    break;
                }
                roomIndex++;
            }

            if (room == null) break;

            int bedNo = room.getOccupied() + 1;
            Allocation allocation = new Allocation();
            allocation.setStudentId(student.getId());
            allocation.setRoomId(room.getId());
            allocation.setBedNo(bedNo);
            allocation.setAllocationType("ALGORITHM");
            allocation.setAllocationBatch(batchCode);
            allocation.setStatus("PENDING");
            allocationMapper.insert(allocation);

            student.setMatchStatus(3);
            studentMapper.updateById(student);

            room.setOccupied(room.getOccupied() + 1);
            room.setStatus(room.getOccupied() >= room.getCapacity() ? 2 : 1);
            roomMapper.updateById(room);
        }

        log.info("批量分配完成: batchCode={}, 已配对组={}, 未匹配学生={}", batchCode, lockedPairings.size(), unmatched.size());
    }

    @Override
    public List<Map<String, Object>> getAllocationResults(String batchCode) {
        List<Allocation> allocations = allocationMapper.selectList(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getAllocationBatch, batchCode)
        );
        return allocations.stream().map(a -> {
            Student s = studentMapper.selectById(a.getStudentId());
            DormitoryRoom r = roomMapper.selectById(a.getRoomId());
            Map<String, Object> m = new HashMap<>();
            m.put("allocationId", a.getId());
            m.put("studentId", a.getStudentId());
            m.put("studentName", s != null ? s.getRealName() : null);
            m.put("studentNo", s != null ? s.getStudentNo() : null);
            m.put("roomNumber", r != null ? r.getRoomNumber() : null);
            m.put("bedNo", a.getBedNo());
            m.put("allocationType", a.getAllocationType());
            m.put("status", a.getStatus());
            return m;
        }).collect(Collectors.toList());
    }

    @Override
    public void publishResults(Long adminId, String batchCode) {
        log.info("管理员{}发布分配结果公示: batchCode={}", adminId, batchCode);
    }

    @Override
    public void finalizeResults(Long adminId, String batchCode) {
        log.info("管理员{}确认正式分配结果: batchCode={}", adminId, batchCode);
        List<Allocation> allocations = allocationMapper.selectList(
                new LambdaQueryWrapper<Allocation>()
                        .eq(Allocation::getAllocationBatch, batchCode)
                        .eq(Allocation::getStatus, "PENDING")
        );
        for (Allocation a : allocations) {
            a.setStatus("CONFIRMED");
            allocationMapper.updateById(a);
        }
    }

    @Override
    public List<Objection> getPendingObjections(Long handlerId) {
        return objectionMapper.selectList(
                new LambdaQueryWrapper<Objection>()
                        .eq(Objection::getStatus, "PENDING")
                        .orderByAsc(Objection::getCreatedAt)
        );
    }

    @Override
    public void reviewObjection(Long handlerId, Long objectionId, String comment, String status) {
        Objection objection = objectionMapper.selectById(objectionId);
        if (objection == null) {
            throw BusinessException.notFound("申诉不存在");
        }
        objection.setStatus(status);
        objection.setCurrentHandler(handlerId);
        objection.setReviewComment(comment);
        if ("RESOLVED".equals(status) || "REJECTED".equals(status)) {
            objection.setResolvedAt(LocalDateTime.now());
        }
        objectionMapper.updateById(objection);
    }

    @Override
    public void updateAllocationDeadline(Long adminId, LocalDateTime deadline) {
        log.info("管理员{}更新分配截止时间: {}", adminId, deadline);
    }
}
