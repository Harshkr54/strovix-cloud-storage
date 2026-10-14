package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.CreateFolderRequest;
import com.storvix.backend.dto.FolderContentsResponse;
import com.storvix.backend.dto.FolderResponse;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> createFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateFolderRequest request) {
        Folder folder = folderService.createFolder(userDetails.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Folder created", FolderResponse.from(folder)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> getFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {
        FolderResponse folder = folderService.getFolder(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success(folder));
    }

    @GetMapping({"", "/{id}/contents"})
    public ResponseEntity<ApiResponse<FolderContentsResponse>> getFolderContents(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable(required = false) String id) {
        FolderContentsResponse contents = folderService.getFolderContents(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success(contents));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> renameFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        FolderResponse folder = folderService.renameFolder(userDetails.getUser().getId(), id, name);
        return ResponseEntity.ok(ApiResponse.success("Folder renamed", folder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> deleteFolder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {

        FolderResponse folder =
                folderService.softDeleteFolder(
                        userDetails.getUser().getId(),
                        id
                );

        return ResponseEntity.ok(
                ApiResponse.success("Folder moved to trash", folder)
        );
    }
}
