package com.storvix.backend.service;

import com.storvix.backend.dto.CreateFolderRequest;
import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.FolderContentsResponse;
import com.storvix.backend.dto.FolderResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.StarRepository;
import com.storvix.backend.entity.Star;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;
    private final com.storvix.backend.repository.UserRepository userRepository;
    private final ActivityService activityService;
    private final StarRepository starRepository;
    private final PermissionService permissionService;

    public List<Map<String, String>> buildBreadcrumb(String folderId, String ownerId) {
        List<Map<String, String>> crumbs = new ArrayList<>();
        Map<String, String> root = new HashMap<>();
        root.put("id", null);
        root.put("name", "My Drive");
        crumbs.add(root);

        if (folderId == null || folderId.isEmpty() || folderId.equals("root")) return crumbs;

        Folder current = folderRepository.findById(folderId).orElse(null);
        List<Map<String, String>> stack = new ArrayList<>();

        while (current != null && !current.getIsDeleted()) {
            Map<String, String> crumb = new HashMap<>();
            crumb.put("id", current.getId());
            crumb.put("name", current.getName());
            stack.add(0, crumb);

            if (current.getParentFolder() == null) break;
            current = folderRepository.findById(current.getParentFolder().getId()).orElse(null);
        }

        crumbs.addAll(stack);
        return crumbs;
    }

    private String buildPath(String parentFolderId) {
        if (parentFolderId == null || parentFolderId.isEmpty()) return "/";
        Folder parent = folderRepository.findById(parentFolderId).orElse(null);
        if (parent == null) return "/";
        return (parent.getPath() + parent.getName() + "/").replaceAll("/+", "/");
    }

    public Folder createFolder(String userId, CreateFolderRequest request) {
        String parentId = request.getParentFolderId();

        // The new folder always belongs to the requesting user (userId).
        // Only use the parent's owner when checking for duplicate names within that parent.
        if (parentId != null && !parentId.isEmpty()) {
            Folder parent = folderRepository.findById(parentId)
                    .orElseThrow(() -> new AppException("Parent folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            // Duplicate check scoped to the parent folder owner's namespace
            String parentOwnerId = parent.getOwner().getId();
            if (folderRepository.existsByOwnerIdAndParentFolderIdAndNameAndIsDeletedFalse(parentOwnerId, parentId, request.getName().trim())) {
                throw new AppException("Folder already exists", HttpStatus.CONFLICT, "DUPLICATE");
            }
        } else {
            if (folderRepository.existsByOwnerIdAndParentFolderIsNullAndNameAndIsDeletedFalse(userId, request.getName().trim())) {
                throw new AppException("Folder already exists", HttpStatus.CONFLICT, "DUPLICATE");
            }
        }

        Folder folder = new Folder();
        folder.setName(request.getName().trim());
        folder.setOwner(userRepository.findById(userId).orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND")));
        
        if (parentId != null && !parentId.isEmpty()) {
            folder.setParentFolder(folderRepository.findById(parentId).orElse(null));
        }
        folder.setPath(buildPath(parentId));
        
        folder = folderRepository.save(folder);
        activityService.logActivity(folder.getOwner(), "FOLDER_CREATED", "FOLDER", folder.getId());
        
        return folder;
    }

    public FolderContentsResponse getFolderContents(String userId, String folderId) {
        List<Folder> folders;
        List<File> files;

        if (folderId != null && !folderId.isEmpty() && !folderId.equals("root")) {
            Folder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            if (folder.getIsDeleted()) {
                throw new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
            }
            permissionService.validateFolderReadAccess(userId, folder);

            folders = folderRepository.findByParentFolderIdAndIsDeletedFalseOrderByName(folderId);
            files = fileRepository.findByFolderIdAndIsDeletedFalseAndUploadStatusOrderByName(folderId, "completed");
        } else {
            folders = folderRepository.findByOwnerIdAndParentFolderIsNullAndIsDeletedFalseOrderByName(userId);
            files = fileRepository.findByOwnerIdAndFolderIsNullAndIsDeletedFalseAndUploadStatusOrderByName(userId, "completed");
        }

        List<Map<String, String>> breadcrumb = buildBreadcrumb(folderId, userId);

        Set<String> starredFolderIds = starRepository.findStarredFolderIdsByUserId(userId);
        Set<String> starredFileIds = starRepository.findStarredFileIdsByUserId(userId);

        return FolderContentsResponse.builder()
                .folders(folders.stream().map(f -> {
                    FolderResponse fr = FolderResponse.from(f);
                    fr.setIsStarred(starredFolderIds.contains(f.getId()));
                    return fr;
                }).collect(Collectors.toList()))
                .files(files.stream().map(f -> {
                    com.storvix.backend.dto.FileResponse fr = com.storvix.backend.dto.FileResponse.from(f);
                    fr.setIsStarred(starredFileIds.contains(f.getId()));
                    return fr;
                }).collect(Collectors.toList()))
                .breadcrumb(breadcrumb)
                .folderId(folderId)
                .build();
    }

    public FolderResponse getFolder(String userId, String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
        if (folder.getIsDeleted()) {
            throw new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        permissionService.validateFolderReadAccess(userId, folder);
        return FolderResponse.from(folder);
    }

    private List<String> collectDescendantFolderIds(String rootId) {
        List<String> ids = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(rootId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            List<Folder> children = folderRepository.findByParentFolderIdAndIsDeletedFalseOrderByName(current);
            for (Folder child : children) {
                ids.add(child.getId());
                queue.add(child.getId());
            }
        }
        return ids;
    }

    public FolderResponse softDeleteFolder(String userId, String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFolderWriteAccess(userId, folder);

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        folder.setIsDeleted(true);
        folder.setDeletedAt(now);
        folder = folderRepository.save(folder);
        activityService.logActivity(folder.getOwner(), "FOLDER_MOVED_TO_TRASH", "FOLDER", folder.getId());

        List<String> descendants = collectDescendantFolderIds(folderId);
        List<String> allIds = new ArrayList<>();
        allIds.add(folderId);
        allIds.addAll(descendants);

        // This is a naive implementation without @Modifying @Query for brevity, pulling all entities to memory.
        for (String id : descendants) {
            Folder child = folderRepository.findById(id).orElse(null);
            if (child != null && !child.getIsDeleted()) {
                child.setIsDeleted(true);
                child.setDeletedAt(now);
                folderRepository.save(child);
            }
        }
        
        for (String fId : allIds) {
            // we should pull files by folder ID and update them
            List<File> files = fileRepository.findByFolderIdAndIsDeletedFalseAndUploadStatusOrderByName(fId, "completed");
            for (File file : files) {
                file.setIsDeleted(true);
                file.setDeletedAt(now);
                fileRepository.save(file);
            }
        }

        return FolderResponse.from(folder);
    }

    public FolderResponse restoreFolder(String userId, String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found in trash", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFolderWriteAccess(userId, folder);

        if (folder.getParentFolder() != null) {
            Folder parent = folderRepository.findById(folder.getParentFolder().getId()).orElse(null);
            if (parent == null || parent.getIsDeleted()) {
                folder.setParentFolder(null);
                folder.setPath("/");
            }
        }

        folder.setIsDeleted(false);
        folder.setDeletedAt(null);
        folder = folderRepository.save(folder);
        activityService.logActivity(folder.getOwner(), "FOLDER_RESTORED", "FOLDER", folder.getId());
        
        return FolderResponse.from(folder);
    }

    public FolderResponse renameFolder(String userId, String folderId, String newName) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFolderWriteAccess(userId, folder);

        if (newName == null || newName.trim().isEmpty()) {
            throw new AppException("Folder name cannot be empty", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        folder.setName(newName.trim());
        folder = folderRepository.save(folder);

        activityService.logActivity(folder.getOwner(), "FOLDER_RENAMED", "FOLDER", folder.getId());

        return FolderResponse.from(folder);
    }

    public Map<String, Boolean> permanentDeleteFolder(String userId, String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        permissionService.validateFolderOwner(userId, folder);

        com.storvix.backend.entity.User owner = folder.getOwner();

        // Collect all descendant folder IDs (including soft-deleted) using BFS
        List<String> allFolderIds = new ArrayList<>();
        allFolderIds.add(folderId);
        Queue<String> queue = new LinkedList<>();
        queue.add(folderId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            List<Folder> children = folderRepository.findByParentFolderId(current);
            for (Folder child : children) {
                allFolderIds.add(child.getId());
                queue.add(child.getId());
            }
        }

        // Delete all files inside every folder in the tree and reclaim quota
        long reclaimedBytes = 0L;
        for (String fId : allFolderIds) {
            List<File> filesInFolder = fileRepository.findByFolderId(fId);
            for (File f : filesInFolder) {
                if (f.getSize() != null) reclaimedBytes += f.getSize();
                fileRepository.delete(f);
            }
        }

        // Delete root-level files (those directly inside the root folder being deleted)
        // already handled in loop above (allFolderIds includes folderId)

        // Delete all descendant folders except the root (delete in reverse order to avoid FK issues)
        for (int i = allFolderIds.size() - 1; i >= 1; i--) {
            folderRepository.findById(allFolderIds.get(i)).ifPresent(folderRepository::delete);
        }
        // Delete the root folder itself
        folderRepository.delete(folder);

        // Restore storage quota for the owner
        if (reclaimedBytes > 0) {
            owner = userRepository.findById(userId).orElse(owner);
            long newUsed = Math.max(0, owner.getStorageUsed() - reclaimedBytes);
            owner.setStorageUsed(newUsed);
            userRepository.save(owner);
        }

        activityService.logActivity(owner, "FOLDER_DELETED_PERMANENTLY", "FOLDER", folderId);
        return Map.of("deleted", true);
    }
}
