package com.storvix.backend.service;

import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.Share;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final ShareRepository shareRepository;

    public void validateFileReadAccess(String userId, File file) {
        if (file == null) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (file.getOwner().getId().equals(userId)) {
            return;
        }

        Optional<Share> shareOpt = shareRepository.findByFileIdAndSharedWithId(file.getId(), userId);
        if (shareOpt.isPresent()) {
            return;
        }

        if (file.getFolder() != null && isFolderReadable(userId, file.getFolder())) {
            return;
        }

        throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public void validateFileWriteAccess(String userId, File file) {
        if (file == null) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (file.getOwner().getId().equals(userId)) {
            return;
        }

        Optional<Share> shareOpt = shareRepository.findByFileIdAndSharedWithId(file.getId(), userId);
        if (shareOpt.isPresent() && "editor".equalsIgnoreCase(shareOpt.get().getRole())) {
            return;
        }

        if (file.getFolder() != null && isFolderWritable(userId, file.getFolder())) {
            return;
        }

        throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public void validateFileOwner(String userId, File file) {
        if (file == null) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (!file.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden: Only the file owner can perform this action", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
    }

    public void validateFolderReadAccess(String userId, Folder folder) {
        if (folder == null) {
            throw new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (isFolderReadable(userId, folder)) {
            return;
        }
        throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public void validateFolderWriteAccess(String userId, Folder folder) {
        if (folder == null) {
            throw new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (isFolderWritable(userId, folder)) {
            return;
        }
        throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public void validateFolderOwner(String userId, Folder folder) {
        if (folder == null) {
            throw new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        if (!folder.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden: Only the folder owner can perform this action", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
    }

    private boolean isFolderReadable(String userId, Folder folder) {
        Folder current = folder;
        while (current != null) {
            if (current.getOwner().getId().equals(userId)) {
                return true;
            }
            Optional<Share> shareOpt = shareRepository.findByFolderIdAndSharedWithId(current.getId(), userId);
            if (shareOpt.isPresent()) {
                return true;
            }
            current = current.getParentFolder();
        }
        return false;
    }

    private boolean isFolderWritable(String userId, Folder folder) {
        Folder current = folder;
        while (current != null) {
            if (current.getOwner().getId().equals(userId)) {
                return true;
            }
            Optional<Share> shareOpt = shareRepository.findByFolderIdAndSharedWithId(current.getId(), userId);
            if (shareOpt.isPresent() && "editor".equalsIgnoreCase(shareOpt.get().getRole())) {
                return true;
            }
            current = current.getParentFolder();
        }
        return false;
    }
}
