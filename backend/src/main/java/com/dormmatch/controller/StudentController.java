package com.dormmatch.controller;

import com.dormmatch.common.Result;
import com.dormmatch.entity.Student;
import com.dormmatch.mapper.StudentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentMapper studentMapper;

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getStudent(@PathVariable Long id) {
        Student s = studentMapper.selectById(id);
        if (s == null) {
            return Result.error(404, "学生不存在");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("id", s.getId());
        data.put("name", s.getRealName());
        data.put("studentNo", s.getStudentNo());
        data.put("gender", s.getGender());
        data.put("collegeId", s.getCollegeId());
        data.put("majorId", s.getMajorId());
        data.put("className", s.getClassName());
        data.put("hometown", s.getHometown());
        data.put("avatarUrl", s.getAvatarUrl());
        data.put("bio", s.getBio());
        return Result.success(data);
    }
}
