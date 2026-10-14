package com.storvix.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class FolderContentsResponse {
    private List<FolderResponse> folders;
    private List<FileResponse> files;
    private List<Map<String, String>> breadcrumb;
    private String folderId;
}
