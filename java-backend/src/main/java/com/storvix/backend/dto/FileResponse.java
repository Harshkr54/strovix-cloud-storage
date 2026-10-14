package com.storvix.backend.dto;

import com.storvix.backend.entity.File;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FileResponse {
    private String id;
    private String name;
    private String originalName;
    private String ownerId;
    private String folderId;
    private String storageKey;
    private String mimeType;
    private String extension;
    private Long size;
    private String storageProvider;
    private String uploadStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private Boolean isStarred;
    private Integer versionNumber;
    private java.util.List<TagResponse> tags;

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public static FileResponse from(File file) {
        return FileResponse.builder()
                .id(file.getId())
                .name(file.getName())
                .originalName(file.getOriginalName())
                .ownerId(file.getOwner() != null ? file.getOwner().getId() : null)
                .folderId(file.getFolder() != null ? file.getFolder().getId() : null)
                .storageKey(file.getStorageKey())
                .mimeType(file.getMimeType())
                .extension(file.getExtension())
                .size(file.getSize())
                .storageProvider(file.getStorageProvider())
                .uploadStatus(file.getUploadStatus())
                .createdAt(file.getCreatedAt())
                .updatedAt(file.getUpdatedAt())
                .isDeleted(file.getIsDeleted())
                .versionNumber(file.getVersionNumber() != null ? file.getVersionNumber() : 1)
                .tags(file.getTags() != null ? file.getTags().stream().map(TagResponse::from).toList() : java.util.Collections.emptyList())
                .build();
    }
}
