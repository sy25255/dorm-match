package com.dormmatch.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
@Data
@TableName("dormitory_building")
public class DormitoryBuilding {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String buildingName;
    private String buildingCode;
    private Integer gender;
    private Integer floors;
    private Integer status;
}
