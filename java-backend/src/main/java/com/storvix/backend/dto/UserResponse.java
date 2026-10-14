package com.storvix.backend.dto;

import com.storvix.backend.entity.User;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private String provider;
    private String role;
    private Long storageUsed;
    private Long storageQuota;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .provider(user.getProvider())
                .role(user.getRole())
                .storageUsed(user.getStorageUsed())
                .storageQuota(user.getStorageQuota())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
