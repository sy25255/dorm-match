package com.dormmatch.controller;
import com.dormmatch.common.Result;
import com.dormmatch.entity.Objection;
import com.dormmatch.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/allocation")
@RequiredArgsConstructor
public class AllocationController {
    private final AllocationService allocationService;

    @GetMapping("/my")
    public Result<Map<String, Object>> getMyAllocation(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Map<String, Object> result = allocationService.getMyAllocation(userId);
        return result != null ? Result.success(result) : Result.success("暂无分配结果", null);
    }

    @PutMapping("/confirm")
    public Result<?> confirm(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        allocationService.confirmAllocation(userId);
        return Result.success("已确认分配结果");
    }

    @PostMapping("/objection")
    public Result<Objection> submitObjection(Authentication auth,
            @RequestParam String reason, @RequestParam(required = false) String attachmentUrls) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(allocationService.submitObjection(userId, reason, attachmentUrls));
    }

    @GetMapping("/objections")
    public Result<List<Objection>> getMyObjections(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(allocationService.getMyObjections(userId));
    }

    @GetMapping("/objection/{objectionId}")
    public Result<Objection> getObjectionDetail(Authentication auth, @PathVariable Long objectionId) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(allocationService.getObjectionDetail(userId, objectionId));
    }
}
