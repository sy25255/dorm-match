package com.dormmatch.service;

import com.dormmatch.dto.LoginRequest;
import com.dormmatch.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(String refreshToken);
}
