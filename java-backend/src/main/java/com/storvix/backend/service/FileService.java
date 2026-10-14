package com.storvix.backend.service;

import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.FileRevisionResponse;
import com.storvix.backend.dto.InitUploadRequest;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.FileRevision;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FileRevisionRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FileRevisionRepository fileRevisionRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final ActivityService activityService;
    private final PermissionService permissionService;

    public Map<String, Object> initUpload(String userId, InitUploadRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (user.getStorageUsed() + request.getSize() > user.getStorageQuota()) {
            throw new AppException("Storage quota exceeded", HttpStatus.PAYLOAD_TOO_LARGE, "QUOTA_EXCEEDED");
        }

        Folder folder = null;
        if (request.getFolderId() != null && !request.getFolderId().isEmpty()) {
            folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            permissionService.validateFolderWriteAccess(userId, folder);
        }

        String extension = "";
        int dotIndex = request.getOriginalName().lastIndexOf('.');
        if (dotIndex > 0) {
            extension = request.getOriginalName().substring(dotIndex);
        }

        String storageKey = "uploads/" + userId + "/" + UUID.randomUUID().toString() + extension;
        
        File file = new File();
        file.setName(request.getName());
        file.setOriginalName(request.getOriginalName());
        file.setOwner(user);
        file.setFolder(folder);
        file.setStorageKey(storageKey);
        file.setMimeType(request.getMimeType());
        file.setExtension(extension);
        file.setSize(request.getSize());
        file.setStorageProvider("s3");
        file.setUploadStatus("pending");
        
        file = fileRepository.save(file);

        String uploadUrl = s3StorageService.generateUploadUrl(storageKey, request.getMimeType());

        Map<String, Object> result = new HashMap<>();
        result.put("fileId", file.getId());
        result.put("uploadUrl", uploadUrl);
        result.put("storageKey", storageKey);
        result.put("provider", file.getStorageProvider());
        return result;
    }

    public FileResponse completeUpload(String userId, String fileId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!file.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        file.setUploadStatus("completed");
        file = fileRepository.save(file);
        
        User user = file.getOwner();
        user.setStorageUsed(user.getStorageUsed() + file.getSize());
        userRepository.save(user);
        
        activityService.logActivity(user, "FILE_UPLOADED", "FILE", file.getId());
        
        return FileResponse.from(file);
    }
    
    public Map<String, String> getDownloadUrl(String userId, String fileId, boolean isPreview) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
        
        permissionService.validateFileReadAccess(userId, file);

        String dispositionType = isPreview ? "inline" : "attachment";
        String contentDisposition = dispositionType + "; filename=\"" + file.getOriginalName() + "\"";
        String downloadUrl = s3StorageService.generateDownloadUrl(file.getStorageKey(), file.getMimeType(), contentDisposition);
        
        Map<String, String> result = new HashMap<>();
        result.put("url", downloadUrl);
        return result;
    }

    public Map<String, String> getDownloadUrl(String userId, String fileId) {
        return getDownloadUrl(userId, fileId, false);
    }

    public FileResponse softDeleteFile(String userId, String fileId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileWriteAccess(userId, file);

        file.setIsDeleted(true);
        file.setDeletedAt(java.time.LocalDateTime.now());
        file = fileRepository.save(file);
        
        activityService.logActivity(file.getOwner(), "FILE_MOVED_TO_TRASH", "FILE", file.getId());
        
        return FileResponse.from(file);
    }

    public FileResponse restoreFile(String userId, String fileId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found in trash", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileWriteAccess(userId, file);

        if (file.getFolder() != null) {
            Folder folder = folderRepository.findById(file.getFolder().getId()).orElse(null);
            if (folder == null || folder.getIsDeleted()) {
                file.setFolder(null);
            }
        }

        file.setIsDeleted(false);
        file.setDeletedAt(null);
        file = fileRepository.save(file);
        
        activityService.logActivity(file.getOwner(), "FILE_RESTORED", "FILE", file.getId());
        
        return FileResponse.from(file);
    }

    public FileResponse renameFile(String userId, String fileId, String newName) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileWriteAccess(userId, file);

        if (newName == null || newName.trim().isEmpty()) {
            throw new AppException("File name cannot be empty", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        file.setName(newName.trim());
        file = fileRepository.save(file);

        activityService.logActivity(file.getOwner(), "FILE_RENAMED", "FILE", file.getId());

        return FileResponse.from(file);
    }

    public Map<String, Boolean> permanentDeleteFile(String userId, String fileId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileOwner(userId, file);

        Long size = file.getSize() != null ? file.getSize() : 0L;
        fileRepository.delete(file);
        
        User user = file.getOwner();
        user.setStorageUsed(user.getStorageUsed() - size);
        userRepository.save(user);

        activityService.logActivity(user, "FILE_DELETED_PERMANENTLY", "FILE", fileId);

        return Map.of("deleted", true);
    }

    public List<FileRevisionResponse> getFileRevisions(String userId, String fileId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileReadAccess(userId, file);

        List<FileRevision> revisions = fileRevisionRepository.findByFileIdOrderByVersionNumberDesc(fileId);
        return revisions.stream().map(FileRevisionResponse::from).toList();
    }

    public Map<String, String> getRevisionDownloadUrl(String userId, String fileId, String revisionId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileReadAccess(userId, file);

        FileRevision revision = fileRevisionRepository.findByFileIdAndId(fileId, revisionId)
                .orElseThrow(() -> new AppException("Revision not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        String contentDisposition = "attachment; filename=\"" + revision.getOriginalName() + "\"";
        String downloadUrl = s3StorageService.generateDownloadUrl(revision.getStorageKey(), revision.getMimeType(), contentDisposition);

        Map<String, String> result = new HashMap<>();
        result.put("url", downloadUrl);
        return result;
    }

    public FileResponse restoreFileRevision(String userId, String fileId, String revisionId) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFileWriteAccess(userId, file);

        FileRevision revision = fileRevisionRepository.findByFileIdAndId(fileId, revisionId)
                .orElseThrow(() -> new AppException("Revision not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        // Archive current active state
        FileRevision currentRevision = new FileRevision();
        currentRevision.setFile(file);
        currentRevision.setVersionNumber(file.getVersionNumber());
        currentRevision.setStorageKey(file.getStorageKey());
        currentRevision.setOriginalName(file.getOriginalName());
        currentRevision.setMimeType(file.getMimeType());
        currentRevision.setSize(file.getSize());
        fileRevisionRepository.save(currentRevision);

        // Restore old revision active properties
        file.setVersionNumber(file.getVersionNumber() + 1);
        file.setStorageKey(revision.getStorageKey());
        file.setSize(revision.getSize());
        file.setMimeType(revision.getMimeType());
        file.setOriginalName(revision.getOriginalName());
        file = fileRepository.save(file);

        activityService.logActivity(file.getOwner(), "FILE_REVISION_RESTORED", "FILE", file.getId());

        return FileResponse.from(file);
    }
}
