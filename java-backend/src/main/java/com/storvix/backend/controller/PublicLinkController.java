package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.PublicLink;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.PublicLinkRepository;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public-links")
@RequiredArgsConstructor
public class PublicLinkController {

    private final PublicLinkRepository publicLinkRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final EmailService emailService;
    private final com.storvix.backend.service.PermissionService permissionService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPublicLink(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        
        String userId = userDetails.getUser().getId();
        String fileId = (String) request.get("fileId");
        String folderId = (String) request.get("folderId");
        String password = (String) request.get("password");
        String recipientEmail = (String) request.get("recipientEmail");
        
        PublicLink link = new PublicLink();
        link.setCreatedBy(userDetails.getUser());
        link.setToken(UUID.randomUUID().toString());
        link.setIsActive(true);
        link.setCreatedAt(LocalDateTime.now());
        link.setUpdatedAt(LocalDateTime.now());
        
        if (password != null && !password.trim().isEmpty()) {
            link.setPasswordHash(password.trim());
        }

        String expiresAtStr = (String) request.get("expiresAt");
        if (expiresAtStr != null && !expiresAtStr.trim().isEmpty()) {
            link.setExpiresAt(LocalDateTime.parse(expiresAtStr.trim()));
        }
        
        String resourceName = "";
        String resourceType = "";
        
        if (fileId != null && !fileId.trim().isEmpty()) {
            File file = fileRepository.findById(fileId.trim()).orElseThrow();
            permissionService.validateFileOwner(userId, file);
            link.setFile(file);
            resourceName = file.getName();
            resourceType = "file";
        } else if (folderId != null && !folderId.trim().isEmpty()) {
            Folder folder = folderRepository.findById(folderId.trim()).orElseThrow();
            permissionService.validateFolderOwner(userId, folder);
            link.setFolder(folder);
            resourceName = folder.getName();
            resourceType = "folder";
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("Must provide fileId or folderId", "BAD_REQUEST"));
        }
        
        PublicLink saved = publicLinkRepository.save(link);
        
        boolean emailSent = false;
        if (recipientEmail != null && !recipientEmail.trim().isEmpty()) {
            try {
                emailSent = emailService.sendPublicLinkEmail(
                        recipientEmail.trim(),
                        null,
                        userDetails.getUser().getName(),
                        resourceName,
                        resourceType,
                        saved.getToken()
                );
            } catch (Exception e) {
                // Log email error gracefully
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", saved.getId());
        data.put("token", saved.getToken());
        data.put("url", "/share/" + saved.getToken());
        data.put("expiresAt", saved.getExpiresAt());
        data.put("isActive", saved.getIsActive());
        data.put("hasPassword", saved.getPasswordHash() != null && !saved.getPasswordHash().isEmpty());
        data.put("emailSent", emailSent);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Public link created", data));
    }

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPublicLinkByToken(
            @PathVariable String token,
            @RequestHeader(name = "X-Public-Link-Password", required = false) String password) {
        
        PublicLink link = publicLinkRepository.findAll().stream()
                .filter(l -> l.getToken().equals(token))
                .findFirst()
                .orElse(null);

        if (link == null || !link.getIsActive()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("Public link not found or inactive", "NOT_FOUND"));
        }

        if (link.isExpired()) {
            return ResponseEntity.status(HttpStatus.GONE).body(ApiResponse.fail("Public link has expired", "LINK_EXPIRED"));
        }

        if (link.getPasswordHash() != null && !link.getPasswordHash().isEmpty()) {
            if (password == null || !link.getPasswordHash().equals(password.trim())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail("Password required or invalid", "PASSWORD_REQUIRED"));
            }
        }

        Map<String, Object> resourceData = new HashMap<>();
        if (link.getFile() != null) {
            File f = link.getFile();
            resourceData.put("id", f.getId());
            resourceData.put("_id", f.getId());
            resourceData.put("name", f.getName());
            resourceData.put("type", "file");
            resourceData.put("mimeType", f.getMimeType());
            resourceData.put("size", f.getSize());
        } else if (link.getFolder() != null) {
            Folder f = link.getFolder();
            resourceData.put("id", f.getId());
            resourceData.put("_id", f.getId());
            resourceData.put("name", f.getName());
            resourceData.put("type", "folder");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", link.getId());
        data.put("token", link.getToken());
        data.put("resource", resourceData);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/manage/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePublicLink(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        
        String userId = userDetails.getUser().getId();
        PublicLink link = publicLinkRepository.findById(id).orElse(null);
        if (link == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("Link not found", "NOT_FOUND"));
        }
        if (link.getFile() != null) permissionService.validateFileOwner(userId, link.getFile());
        if (link.getFolder() != null) permissionService.validateFolderOwner(userId, link.getFolder());

        if (body.containsKey("isActive")) {
            link.setIsActive((Boolean) body.get("isActive"));
        }

        PublicLink saved = publicLinkRepository.save(link);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", saved.getId());
        data.put("isActive", saved.getIsActive());

        return ResponseEntity.ok(ApiResponse.success("Public link updated", data));
    }

    @PostMapping("/manage/{id}/email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> emailPublicLink(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        
        String userId = userDetails.getUser().getId();
        String recipientEmail = body.get("email");
        PublicLink link = publicLinkRepository.findById(id).orElse(null);
        if (link == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("Link not found", "NOT_FOUND"));
        }
        if (link.getFile() != null) permissionService.validateFileOwner(userId, link.getFile());
        if (link.getFolder() != null) permissionService.validateFolderOwner(userId, link.getFolder());

        String resourceName = link.getFile() != null ? link.getFile().getName() : (link.getFolder() != null ? link.getFolder().getName() : "");
        String resourceType = link.getFile() != null ? "file" : "folder";

        boolean emailSent = false;
        if (recipientEmail != null && !recipientEmail.trim().isEmpty()) {
            try {
                emailSent = emailService.sendPublicLinkEmail(
                        recipientEmail.trim(),
                        null,
                        userDetails.getUser().getName(),
                        resourceName,
                        resourceType,
                        link.getToken()
                );
            } catch (Exception e) {
                // Log email error
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("emailSent", emailSent);
        return ResponseEntity.ok(ApiResponse.success("Email process completed", data));
    }

    @DeleteMapping("/manage/{id}")
    public ResponseEntity<ApiResponse<Object>> removePublicLink(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String id) {
        
        String userId = userDetails.getUser().getId();
        PublicLink link = publicLinkRepository.findById(id).orElse(null);
        if (link != null) {
            if (link.getFile() != null) permissionService.validateFileOwner(userId, link.getFile());
            if (link.getFolder() != null) permissionService.validateFolderOwner(userId, link.getFolder());
            publicLinkRepository.delete(link);
        }
        return ResponseEntity.ok(ApiResponse.success("Public link deleted", null));
    }
}
