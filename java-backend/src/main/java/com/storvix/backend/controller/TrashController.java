package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.TrashItemResponse;
import com.storvix.backend.dto.TrashRestoreRequest;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.FileService;
import com.storvix.backend.service.FolderService;
import com.storvix.backend.service.TrashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trash")
@RequiredArgsConstructor
public class TrashController {

    private final TrashService trashService;
    private final FileService fileService;
    private final FolderService folderService;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TrashItemResponse>>> listTrash(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TrashItemResponse> items = trashService.listTrash(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Object>> restore(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody(required = false) TrashRestoreRequest request) {
        
        String userId = userDetails.getUser().getId();
        String type = request != null ? request.getType() : null;

        if ("folder".equals(type)) {
            return ResponseEntity.ok(ApiResponse.success("Restored", folderService.restoreFolder(userId, id)));
        }

        if ("file".equals(type)) {
            return ResponseEntity.ok(ApiResponse.success("Restored", fileService.restoreFile(userId, id)));
        }

        File file = fileRepository.findById(id).orElse(null);
        if (file != null && file.getOwner().getId().equals(userId) && file.getIsDeleted()) {
            return ResponseEntity.ok(ApiResponse.success("Restored", fileService.restoreFile(userId, id)));
        }

        Folder folder = folderRepository.findById(id).orElse(null);
        if (folder != null && folder.getOwner().getId().equals(userId) && folder.getIsDeleted()) {
            return ResponseEntity.ok(ApiResponse.success("Restored", folderService.restoreFolder(userId, id)));
        }

        throw new AppException("Item not found in trash", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> permanentDelete(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody(required = false) TrashRestoreRequest request) {
        
        String userId = userDetails.getUser().getId();
        String type = request != null ? request.getType() : null;

        if ("folder".equals(type)) {
            return ResponseEntity.ok(ApiResponse.success("Permanently deleted", folderService.permanentDeleteFolder(userId, id)));
        }

        if ("file".equals(type)) {
            return ResponseEntity.ok(ApiResponse.success("Permanently deleted", fileService.permanentDeleteFile(userId, id)));
        }

        File file = fileRepository.findById(id).orElse(null);
        if (file != null && file.getOwner().getId().equals(userId)) {
            return ResponseEntity.ok(ApiResponse.success("Permanently deleted", fileService.permanentDeleteFile(userId, id)));
        }

        Folder folder = folderRepository.findById(id).orElse(null);
        if (folder != null && folder.getOwner().getId().equals(userId)) {
            return ResponseEntity.ok(ApiResponse.success("Permanently deleted", folderService.permanentDeleteFolder(userId, id)));
        }

        throw new AppException("Item not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }
}
