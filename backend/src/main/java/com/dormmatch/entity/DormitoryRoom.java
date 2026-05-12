package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
@Data
@TableName("dormitory_room")
public class DormitoryRoom {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long buildingId;
    private String roomNumber;
    private Integer floor;
    private Integer capacity;
    private Integer occupied;
    private String roomType;
    private Integer status;
}
