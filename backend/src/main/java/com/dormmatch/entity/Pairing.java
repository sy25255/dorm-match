package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pairing")
public class Pairing {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String pairingCode;
    private Integer groupSize;
    private Integer status;
    private LocalDateTime lockedAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
