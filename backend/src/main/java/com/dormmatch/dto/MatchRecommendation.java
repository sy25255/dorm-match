package com.dormmatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchRecommendation {
    private Long studentId;
    private String name;
    private String avatarUrl;
    private String collegeName;
    private String majorName;
    private String bio;
    private Double matchScore;
    private Map<String, Double> dimensionScores;
    private List<String> commonTags;
}
