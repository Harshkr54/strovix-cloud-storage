package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.CreateTagRequest;
import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.FolderResponse;
import com.storvix.backend.dto.TagResponse;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateTagRequest request) {
        TagResponse tag = tagService.createTag(userDetails.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tag created successfully", tag));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getUserTags(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TagResponse> tags = tagService.getUserTags(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> updateTag(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody CreateTagRequest request) {
        TagResponse tag = tagService.updateTag(userDetails.getUser().getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Tag updated successfully", tag));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteTag(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {
        Map<String, Boolean> result = tagService.deleteTag(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Tag deleted successfully", result));
    }

    @PostMapping("/{tagId}/files/{fileId}")
    public ResponseEntity<ApiResponse<FileResponse>> assignTagToFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String tagId,
            @PathVariable String fileId) {
        FileResponse file = tagService.assignTagToFile(userDetails.getUser().getId(), tagId, fileId);
        return ResponseEntity.ok(ApiResponse.success("Tag assigned to file", file));
    }

    @DeleteMapping("/{tagId}/files/{fileId}")
    public ResponseEntity<ApiResponse<FileResponse>> removeTagFromFile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String tagId,
            @PathVariable String fileId) {
        FileResponse file = tagService.removeTagFromFile(userDetails.getUser().getId(), tagId, fileId);
        return ResponseEntity.ok(ApiResponse.success("Tag removed from file", file));
    }

    @PostMapping("/{tagId}/folders/{folderId}")
    public ResponseEntity<ApiResponse<FolderResponse>> assignTagToFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String tagId,
            @PathVariable String folderId) {
        FolderResponse folder = tagService.assignTagToFolder(userDetails.getUser().getId(), tagId, folderId);
        return ResponseEntity.ok(ApiResponse.success("Tag assigned to folder", folder));
    }

    @DeleteMapping("/{tagId}/folders/{folderId}")
    public ResponseEntity<ApiResponse<FolderResponse>> removeTagFromFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String tagId,
            @PathVariable String folderId) {
        FolderResponse folder = tagService.removeTagFromFolder(userDetails.getUser().getId(), tagId, folderId);
        return ResponseEntity.ok(ApiResponse.success("Tag removed from folder", folder));
    }

    @GetMapping("/{tagId}/resources")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTagResources(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String tagId) {
        Map<String, Object> data = tagService.getTagResources(userDetails.getUser().getId(), tagId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
