package com.storvix.backend.service;

import com.storvix.backend.dto.AuthResponse;
import com.storvix.backend.dto.LoginRequest;
import com.storvix.backend.dto.RegisterRequest;
import com.storvix.backend.dto.UserResponse;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.UserRepository;
import com.storvix.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final com.storvix.backend.repository.OAuthCodeRepository oAuthCodeRepository;

    private AuthResponse buildTokens(User user) {
        String accessToken = jwtUtil.generateToken(user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        user.setRefreshTokenHash(passwordEncoder.encode(refreshToken));
        userRepository.save(user);

        return AuthResponse.builder()
                .user(UserResponse.from(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.matches("^[0-9\\s]+$") || name.matches("^[!@#$%^&*()_+=\\-\\[\\]{};:'\",.<>/?\\\\]+$") || !name.matches(".*[A-Za-z].*")) {
            throw new AppException("Please enter a valid full name.", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        if (request.getConfirmPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException("Passwords do not match.", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException("An account with this email already exists.", HttpStatus.CONFLICT, "DUPLICATE_EMAIL");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider("LOCAL");
        userRepository.save(user);
        
        return buildTokens(user);
    }

    public AuthResponse exchangeOAuthCode(String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            throw new AppException("Invalid OAuth code", HttpStatus.BAD_REQUEST, "INVALID_CODE");
        }
        String codeHash = hashOAuthCode(rawCode.trim());
        com.storvix.backend.entity.OAuthCode oauthCode = oAuthCodeRepository.findByCodeHashAndIsUsedFalse(codeHash)
                .orElseThrow(() -> new AppException("Invalid or expired OAuth code", HttpStatus.BAD_REQUEST, "INVALID_CODE"));

        if (oauthCode.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            oauthCode.setIsUsed(true);
            oAuthCodeRepository.save(oauthCode);
            throw new AppException("OAuth code has expired", HttpStatus.BAD_REQUEST, "EXPIRED_CODE");
        }

        oauthCode.setIsUsed(true);
        oAuthCodeRepository.save(oauthCode);

        User user = userRepository.findById(oauthCode.getUserId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        return buildTokens(user);
    }

    private String hashOAuthCode(String code) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 missing", e);
        }
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));
        
        if (!user.getIsActive()) {
            throw new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }
        if (!"LOCAL".equals(user.getProvider()) || user.getPassword() == null) {
            throw new AppException("Please use social login for this account", HttpStatus.BAD_REQUEST, "OAUTH_ACCOUNT");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        return buildTokens(user);
    }

    public User getMe(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
    }

    public void logout(String userId) {
        User user = getMe(userId);
        user.setRefreshTokenHash(null);
        userRepository.save(user);
    }

    public AuthResponse refreshTokens(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken) || !"refresh".equals(jwtUtil.extractType(refreshToken))) {
            throw new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        String userId = jwtUtil.extractUserId(refreshToken);
        User user = getMe(userId);

        if (!user.getIsActive() || user.getRefreshTokenHash() == null) {
            throw new AppException("User not found or inactive", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (!passwordEncoder.matches(refreshToken, user.getRefreshTokenHash())) {
            throw new AppException("Refresh token revoked", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        return buildTokens(user);
    }
}
