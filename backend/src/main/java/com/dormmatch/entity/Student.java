package com.dormmatch.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("student")
public class Student {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String studentNo;
    private String realName;
    private Integer gender;
    private Long collegeId;
    private Long majorId;
    private String className;
    private String hometown;
    private String phone;
    private String email;
    private String avatarUrl;
    private String bio;
    private Integer surveyStatus;
    private LocalDateTime surveyCompletedAt;
    private Integer matchStatus;
    private String passwordHash;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
