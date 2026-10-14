package com.storvix.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateShareRequest {
    @NotBlank(message = "Role is required")
    private String role;
}
