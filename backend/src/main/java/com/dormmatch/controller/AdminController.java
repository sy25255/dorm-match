package com.dormmatch.controller;

import com.dormmatch.common.Result;
import com.dormmatch.entity.Objection;
import com.dormmatch.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AllocationService allocationService;

    @PostMapping("/allocation/execute")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> executeAllocation(Authentication auth, @RequestParam String batchCode) {
        allocationService.executeBatchAllocation(batchCode);
        return Result.success("批量分配完成");
    }

    @GetMapping("/allocation/results")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELOR')")
    public Result<List<Map<String, Object>>> getAllocationResults(@RequestParam String batchCode) {
        return Result.success(allocationService.getAllocationResults(batchCode));
    }

    @PostMapping("/allocation/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> publishResults(Authentication auth, @RequestParam String batchCode) {
        Long adminId = (Long) auth.getPrincipal();
        allocationService.publishResults(adminId, batchCode);
        return Result.success("预分配结果已发布公示");
    }

    @PostMapping("/allocation/finalize")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<?> finalizeResults(Authentication auth, @RequestParam String batchCode) {
        Long adminId = (Long) auth.getPrincipal();
        allocationService.finalizeResults(adminId, batchCode);
        return Result.success("正式分配结果已确认");
    }

    @GetMapping("/objections")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELOR')")
    public Result<List<Objection>> getPendingObjections(Authentication auth) {
        Long handlerId = (Long) auth.getPrincipal();
        return Result.success(allocationService.getPendingObjections(handlerId));
    }

    @PutMapping("/objection/{objectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELOR')")
    public Result<?> reviewObjection(Authentication auth, @PathVariable Long objectionId,
                                     @RequestParam String comment, @RequestParam String status) {
        Long handlerId = (Long) auth.getPrincipal();
        allocationService.reviewObjection(handlerId, objectionId, comment, status);
        return Result.success("申诉已处理");
    }
}
