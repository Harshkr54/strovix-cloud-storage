package com.storvix.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTagRequest {

    @NotBlank(message = "Tag name is required")
    @Size(max = 50, message = "Tag name must be 50 characters or less")
    private String name;

    private String colorHex = "#3B82F6";
}
