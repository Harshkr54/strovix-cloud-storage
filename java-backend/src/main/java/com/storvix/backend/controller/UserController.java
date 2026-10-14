package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.entity.User;
import com.storvix.backend.repository.UserRepository;
import com.storvix.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.storvix.backend.dto.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me/storage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStorageInfo(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        User user = userDetails.getUser();
        
        Map<String, Object> storageData = new HashMap<>();
        // AppShell expects these
        storageData.put("storageUsed", user.getStorageUsed());
        storageData.put("storageQuota", user.getStorageQuota());
        // User prompt explicitly asked for these
        storageData.put("used", user.getStorageUsed());
        storageData.put("total", user.getStorageQuota());
        
        double percentage = 0.0;
        if (user.getStorageQuota() != null && user.getStorageQuota() > 0) {
            percentage = ((double) user.getStorageUsed() / user.getStorageQuota()) * 100;
        }
        storageData.put("percentage", percentage);

        return ResponseEntity.ok(ApiResponse.success(storageData));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(UserResponse.from(userDetails.getUser())));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userDetails.getUser().getId()).orElseThrow();
        if (payload.containsKey("name") && payload.get("name") != null && !payload.get("name").trim().isEmpty()) {
            user.setName(payload.get("name").trim());
            user = userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.success("Profile updated", UserResponse.from(user)));
    }
}
