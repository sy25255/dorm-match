package com.dormmatch.service;

import com.dormmatch.dto.MatchRecommendation;

import java.util.List;
import java.util.Map;

public interface MatchingService {
    void calculateMatches(Long studentId);
    List<MatchRecommendation> getRecommendations(Long studentId);
    Map<String, Object> getMatchDetail(Long studentId, Long targetId);
    List<MatchRecommendation> searchRoommates(Long studentId, String keyword, Long collegeId, Long majorId, String hobby);
}
