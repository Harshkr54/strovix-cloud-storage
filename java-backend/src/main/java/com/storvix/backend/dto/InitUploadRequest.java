package com.storvix.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InitUploadRequest {
    @NotBlank(message = "File name is required")
    private String name;
    
    @NotBlank(message = "Original name is required")
    private String originalName;
    
    @NotBlank(message = "MIME type is required")
    private String mimeType;
    
    @NotNull(message = "Size is required")
    private Long size;
    
    private String folderId;
}
