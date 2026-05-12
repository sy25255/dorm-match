package com.dormmatch.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dormmatch.entity.Student;
import org.apache.ibatis.annotations.Mapper;
@Mapper
public interface StudentMapper extends BaseMapper<Student> {}
