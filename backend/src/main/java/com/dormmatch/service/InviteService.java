package com.dormmatch.service;

import com.dormmatch.entity.Invite;
import com.dormmatch.entity.Pairing;

import java.util.List;
import java.util.Map;

public interface InviteService {
    Invite sendInvite(Long fromStudentId, Long toStudentId, String message);
    void acceptInvite(Long studentId, Long inviteId);
    void rejectInvite(Long studentId, Long inviteId);
    void withdrawInvite(Long studentId, Long inviteId);
    List<Invite> getReceivedInvites(Long studentId);
    List<Invite> getSentInvites(Long studentId);
    Map<String, Integer> getQuota(Long studentId);
    Pairing getCurrentPairing(Long studentId);
    List<Map<String, Object>> getPairingMembers(Long studentId);
}
