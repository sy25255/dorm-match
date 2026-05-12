package com.dormmatch.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("survey_question")
public class SurveyQuestion {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String questionCode;
    private String dimension;
    private String subDimension;
    private String questionText;
    private String questionType;
    private String optionsJson;
    private Integer sortOrder;
    private Integer isRequired;
    private Integer isAttentionCheck;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
