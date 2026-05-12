package com.dormmatch.controller;
import com.dormmatch.common.Result;
import com.dormmatch.dto.InviteRequest;
import com.dormmatch.entity.Invite;
import com.dormmatch.entity.Pairing;
import com.dormmatch.service.InviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/invite")
@RequiredArgsConstructor
public class InviteController {
    private final InviteService inviteService;

    @PostMapping("/send")
    public Result<Invite> send(Authentication auth, @Valid @RequestBody InviteRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.sendInvite(userId, request.getTargetId(), request.getMessage()));
    }

    @PutMapping("/{inviteId}/accept")
    public Result<?> accept(Authentication auth, @PathVariable Long inviteId) {
        Long userId = (Long) auth.getPrincipal();
        inviteService.acceptInvite(userId, inviteId);
        return Result.success("已接受邀请，配对成功");
    }

    @PutMapping("/{inviteId}/reject")
    public Result<?> reject(Authentication auth, @PathVariable Long inviteId) {
        Long userId = (Long) auth.getPrincipal();
        inviteService.rejectInvite(userId, inviteId);
        return Result.success();
    }

    @PutMapping("/{inviteId}/withdraw")
    public Result<?> withdraw(Authentication auth, @PathVariable Long inviteId) {
        Long userId = (Long) auth.getPrincipal();
        inviteService.withdrawInvite(userId, inviteId);
        return Result.success();
    }

    @GetMapping("/received")
    public Result<List<Invite>> getReceived(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.getReceivedInvites(userId));
    }

    @GetMapping("/sent")
    public Result<List<Invite>> getSent(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.getSentInvites(userId));
    }

    @GetMapping("/quota")
    public Result<Map<String, Integer>> getQuota(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.getQuota(userId));
    }

    @GetMapping("/pairing")
    public Result<Pairing> getPairing(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.getCurrentPairing(userId));
    }

    @GetMapping("/pairing/members")
    public Result<List<Map<String, Object>>> getPairingMembers(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(inviteService.getPairingMembers(userId));
    }
}
