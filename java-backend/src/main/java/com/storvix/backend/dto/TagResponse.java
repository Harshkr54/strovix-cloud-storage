package com.storvix.backend.dto;

import com.storvix.backend.entity.Tag;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TagResponse {
    private String id;
    private String name;
    private String colorHex;
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public static TagResponse from(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .colorHex(tag.getColorHex())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
