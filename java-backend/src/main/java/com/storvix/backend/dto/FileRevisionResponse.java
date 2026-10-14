package com.storvix.backend.dto;

import com.storvix.backend.entity.FileRevision;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FileRevisionResponse {
    private String id;
    private String fileId;
    private Integer versionNumber;
    private String originalName;
    private String mimeType;
    private Long size;
    private LocalDateTime createdAt;

    public static FileRevisionResponse from(FileRevision revision) {
        return FileRevisionResponse.builder()
                .id(revision.getId())
                .fileId(revision.getFile().getId())
                .versionNumber(revision.getVersionNumber())
                .originalName(revision.getOriginalName())
                .mimeType(revision.getMimeType())
                .size(revision.getSize())
                .createdAt(revision.getCreatedAt())
                .build();
    }
}
