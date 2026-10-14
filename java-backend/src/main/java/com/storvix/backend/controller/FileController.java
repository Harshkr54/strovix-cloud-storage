package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.InitUploadRequest;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/init-upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InitUploadRequest request) {
        Map<String, Object> data = fileService.initUpload(userDetails.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Upload initialized", data));
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<ApiResponse<FileResponse>> completeUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String fileId = body.get("fileId");
        FileResponse file = fileService.completeUpload(userDetails.getUser().getId(), fileId);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", file));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "false") boolean preview) {
        Map<String, String> data = fileService.getDownloadUrl(userDetails.getUser().getId(), id, preview);
        Map<String, Object> response = new HashMap<>();
        response.put("downloadUrl", data.get("url"));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FileResponse>> renameFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        FileResponse file = fileService.renameFile(userDetails.getUser().getId(), id, name);
        return ResponseEntity.ok(ApiResponse.success("File renamed", file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<FileResponse>> deleteFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {
        FileResponse file = fileService.softDeleteFile(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("File deleted", file));
    }

    @GetMapping("/{id}/revisions")
    public ResponseEntity<ApiResponse<java.util.List<com.storvix.backend.dto.FileRevisionResponse>>> getFileRevisions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {
        java.util.List<com.storvix.backend.dto.FileRevisionResponse> revisions = fileService.getFileRevisions(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success(revisions));
    }

    @GetMapping("/{id}/revisions/{revisionId}/download")
    public ResponseEntity<ApiResponse<Map<String, String>>> getRevisionDownloadUrl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @PathVariable String revisionId) {
        Map<String, String> data = fileService.getRevisionDownloadUrl(userDetails.getUser().getId(), id, revisionId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{id}/revisions/{revisionId}/restore")
    public ResponseEntity<ApiResponse<FileResponse>> restoreFileRevision(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @PathVariable String revisionId) {
        FileResponse file = fileService.restoreFileRevision(userDetails.getUser().getId(), id, revisionId);
        return ResponseEntity.ok(ApiResponse.success("Version restored successfully", file));
    }
}
