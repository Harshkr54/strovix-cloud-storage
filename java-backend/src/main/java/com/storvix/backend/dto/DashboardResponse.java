package com.storvix.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private Map<String, Object> storage;
    private Map<String, Object> totals;
    private List<FileResponse> recentFiles;
    private List<StarResponse> starred;
    private List<ActivityResponse> recentActivity;
}
