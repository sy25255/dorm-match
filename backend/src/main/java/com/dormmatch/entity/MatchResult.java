package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("match_result")
public class MatchResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long studentId;
    private Long targetId;
    private Double totalScore;
    private String scoreDetail;
    private Integer isRecommended;
    private LocalDateTime calculatedAt;
}
