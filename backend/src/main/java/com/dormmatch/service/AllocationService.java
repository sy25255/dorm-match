package com.dormmatch.service;

import com.dormmatch.entity.Allocation;
import com.dormmatch.entity.Objection;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AllocationService {
    Map<String, Object> getMyAllocation(Long studentId);
    void confirmAllocation(Long studentId);
    Objection submitObjection(Long studentId, String reason, String attachmentUrls);
    List<Objection> getMyObjections(Long studentId);
    Objection getObjectionDetail(Long studentId, Long objectionId);

    void executeBatchAllocation(String batchCode);
    List<Map<String, Object>> getAllocationResults(String batchCode);
    void publishResults(Long adminId, String batchCode);
    void finalizeResults(Long adminId, String batchCode);
    void updateAllocationDeadline(Long adminId, LocalDateTime deadline);
    List<Objection> getPendingObjections(Long handlerId);
    void reviewObjection(Long handlerId, Long objectionId, String comment, String status);
}
