package com.storvix.backend.dto;

import com.storvix.backend.entity.Activity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ActivityResponse {
    private String id;
    private String action;
    private String resourceType;
    private String resourceId;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public static ActivityResponse from(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .action(activity.getAction())
                .resourceType(activity.getResourceType())
                .resourceId(activity.getResourceId())
                .metadata(activity.getMetadata())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
