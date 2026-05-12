package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("allocation")
public class Allocation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long studentId;
    private Long roomId;
    private Integer bedNo;
    private String allocationType;
    private String allocationBatch;
    private String status;
    private Integer confirmedByStudent;
    private LocalDateTime confirmedAt;
    private LocalDateTime createdAt;
}
