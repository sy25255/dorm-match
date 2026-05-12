package com.dormmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dormmatch.common.BusinessException;
import com.dormmatch.config.JwtUtil;
import com.dormmatch.dto.LoginRequest;
import com.dormmatch.dto.LoginResponse;
import com.dormmatch.entity.Student;
import com.dormmatch.mapper.StudentMapper;
import com.dormmatch.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final StudentMapper studentMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public LoginResponse login(LoginRequest request) {
        Student student = studentMapper.selectOne(
                new LambdaQueryWrapper<Student>()
                        .eq(Student::getStudentNo, request.getStudentNo())
                        .eq(Student::getStatus, 1)
        );

        if (student == null) {
            throw new BusinessException(401, "学号或密码错误");
        }

        if (!passwordEncoder.matches(request.getPassword(), student.getPasswordHash())) {
            throw new BusinessException(401, "学号或密码错误");
        }

        String role = "STUDENT";
        String token = jwtUtil.createToken(student.getId(), student.getRealName(), role);
        String refreshToken = jwtUtil.createRefreshToken(student.getId());

        return new LoginResponse(token, refreshToken, student.getId(), student.getRealName(), role);
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BusinessException(401, "refresh token已过期，请重新登录");
        }

        Long userId = jwtUtil.getUserIdFromToken(refreshToken);
        Student student = studentMapper.selectById(userId);
        if (student == null || student.getStatus() != 1) {
            throw new BusinessException(401, "用户不存在或已禁用");
        }

        String role = "STUDENT";
        String newToken = jwtUtil.createToken(student.getId(), student.getRealName(), role);
        String newRefreshToken = jwtUtil.createRefreshToken(student.getId());

        return new LoginResponse(newToken, newRefreshToken, student.getId(), student.getRealName(), role);
    }
}
