package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("objection")
public class Objection {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long allocationId;
    private Long studentId;
    private String reason;
    private String attachmentUrls;
    private String status;
    private Long currentHandler;
    private String reviewComment;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
