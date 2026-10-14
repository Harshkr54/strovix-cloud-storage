package com.storvix.backend.dto;

import com.storvix.backend.entity.Star;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StarResponse {
    private String id;
    private FileResponse file;
    private FolderResponse folder;
    private java.time.LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public static StarResponse from(Star star) {
        return StarResponse.builder()
                .id(star.getId())
                .file(star.getFile() != null ? FileResponse.from(star.getFile()) : null)
                .folder(star.getFolder() != null ? FolderResponse.from(star.getFolder()) : null)
                .createdAt(star.getCreatedAt())
                .build();
    }
}
