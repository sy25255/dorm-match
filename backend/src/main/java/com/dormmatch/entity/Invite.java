package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("invite")
public class Invite {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long fromStudentId;
    private Long toStudentId;
    private String message;
    private Integer status;
    private LocalDateTime processedAt;
    private LocalDateTime expiresAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
