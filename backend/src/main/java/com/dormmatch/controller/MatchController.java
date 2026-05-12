package com.dormmatch.controller;
import com.dormmatch.common.Result;
import com.dormmatch.dto.MatchRecommendation;
import com.dormmatch.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class MatchController {
    private final MatchingService matchingService;

    @PostMapping("/calculate")
    public Result<?> calculate(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        matchingService.calculateMatches(userId);
        return Result.success("匹配计算已触发");
    }

    @GetMapping("/recommendations")
    public Result<List<MatchRecommendation>> getRecommendations(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(matchingService.getRecommendations(userId));
    }

    @GetMapping("/detail/{targetId}")
    public Result<Map<String, Object>> getDetail(Authentication auth, @PathVariable Long targetId) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(matchingService.getMatchDetail(userId, targetId));
    }

    @GetMapping("/search")
    public Result<List<MatchRecommendation>> search(Authentication auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) String hobby) {
        Long userId = (Long) auth.getPrincipal();
        return Result.success(matchingService.searchRoommates(userId, keyword, collegeId, majorId, hobby));
    }
}
