package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pairing_member")
public class PairingMember {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long pairingId;
    private Long studentId;
    private Integer isInitiator;
    private LocalDateTime joinedAt;
}
