package com.storvix.backend.service;

import com.storvix.backend.dto.CreateShareRequest;
import com.storvix.backend.dto.ShareResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.Share;
import com.storvix.backend.entity.ShareInvite;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.ShareInviteRepository;
import com.storvix.backend.repository.ShareRepository;
import com.storvix.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final ShareInviteRepository shareInviteRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PermissionService permissionService;

    public Map<String, Object> createShare(String userId, CreateShareRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        File file = null;
        Folder folder = null;
        String resourceName = "";
        String resourceType = "";
        String ownerId = "";

        if (request.getFileId() != null && !request.getFileId().isEmpty()) {
            file = fileRepository.findById(request.getFileId())
                    .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            permissionService.validateFileOwner(userId, file);
            resourceName = file.getName();
            resourceType = "file";
            ownerId = file.getOwner().getId();
        } else if (request.getFolderId() != null && !request.getFolderId().isEmpty()) {
            folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            permissionService.validateFolderOwner(userId, folder);
            resourceName = folder.getName();
            resourceType = "folder";
            ownerId = folder.getOwner().getId();
        } else {
            throw new AppException("Provide exactly one of fileId or folderId", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        User sender = userRepository.findById(userId).orElseThrow();
        
        if (sender.getEmail().toLowerCase().equals(normalizedEmail)) {
            throw new AppException("Cannot share with yourself", HttpStatus.BAD_REQUEST, "INVALID_SHARE");
        }

        User target = userRepository.findByEmail(normalizedEmail).orElse(null);

        Map<String, Object> response = new HashMap<>();

        if (target == null) {
            ShareInvite invite = null;
            if (file != null) {
                invite = shareInviteRepository.findByEmailAndStatusAndFileId(normalizedEmail, "pending", file.getId());
            } else {
                invite = shareInviteRepository.findByEmailAndStatusAndFolderId(normalizedEmail, "pending", folder.getId());
            }

            if (invite == null) {
                invite = new ShareInvite();
                invite.setEmail(normalizedEmail);
                invite.setFile(file);
                invite.setFolder(folder);
                invite.setOwner(userRepository.findById(ownerId).orElse(null));
                invite.setRole(request.getRole());
                invite.setToken(UUID.randomUUID().toString());
                invite.setStatus("pending");
                invite = shareInviteRepository.save(invite);
            } else {
                invite.setRole(request.getRole());
                invite.setToken(UUID.randomUUID().toString());
                invite = shareInviteRepository.save(invite);
            }

            emailService.sendShareInviteEmail(normalizedEmail, sender.getName(), resourceName, resourceType, request.getRole(), invite.getToken());

            response.put("shared", true);
            response.put("invited", true);
            response.put("emailSent", true);
            response.put("invite", ShareResponse.from(invite));
            response.put("message", "Invitation sent. They can access it after creating a Nimbus account.");
        } else {
            if (target.getId().equals(ownerId)) {
                throw new AppException("Cannot share with the owner", HttpStatus.BAD_REQUEST, "INVALID_SHARE");
            }

            File finalFile = file;
            Folder finalFolder = folder;
            Share share = shareRepository.findAll().stream()
                .filter(s -> s.getSharedWith().getId().equals(target.getId()) &&
                        ((finalFile != null && s.getFile() != null && s.getFile().getId().equals(finalFile.getId())) ||
                         (finalFolder != null && s.getFolder() != null && s.getFolder().getId().equals(finalFolder.getId()))))
                .findFirst().orElse(null);

            if (share == null) {
                share = new Share();
                share.setFile(file);
                share.setFolder(folder);
                share.setOwner(userRepository.findById(ownerId).orElse(null));
                share.setSharedWith(target);
                share.setRole(request.getRole());
                share = shareRepository.save(share);
            } else {
                share.setRole(request.getRole());
                share = shareRepository.save(share);
            }

            List<ShareInvite> invites = new ArrayList<>();
            if (file != null) {
                invites = shareInviteRepository.findByFileIdAndStatus(file.getId(), "pending");
            } else {
                invites = shareInviteRepository.findByFolderIdAndStatus(folder.getId(), "pending");
            }

            for (ShareInvite inv : invites) {
                if (inv.getEmail().equals(normalizedEmail)) {
                    inv.setStatus("accepted");
                    shareInviteRepository.save(inv);
                }
            }

            if ("file".equals(resourceType)) {
                emailService.sendFileShareEmail(normalizedEmail, target.getName(), sender.getName(), resourceName, request.getRole(), file.getId());
            } else {
                emailService.sendFolderShareEmail(normalizedEmail, target.getName(), sender.getName(), resourceName, request.getRole(), folder.getId());
            }

            response.put("shared", true);
            response.put("invited", false);
            response.put("emailSent", true);
            response.put("share", ShareResponse.from(share));
            response.put("message", "Shared successfully.");
        }

        return response;
    }

    public List<ShareResponse> listShares(String userId, String resourceId) {
        File file = fileRepository.findById(resourceId).orElse(null);
        Folder folder = file == null ? folderRepository.findById(resourceId).orElse(null) : null;

        if (file == null && folder == null) {
            throw new AppException("Resource not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }

        if (file != null) {
            permissionService.validateFileOwner(userId, file);
        } else {
            permissionService.validateFolderOwner(userId, folder);
        }

        List<ShareResponse> result = new ArrayList<>();

        List<Share> shares = shareRepository.findAll().stream()
            .filter(s -> (file != null && s.getFile() != null && s.getFile().getId().equals(file.getId())) ||
                         (folder != null && s.getFolder() != null && s.getFolder().getId().equals(folder.getId())))
            .toList();

        shares.forEach(s -> result.add(ShareResponse.from(s)));

        List<ShareInvite> invites = new ArrayList<>();
        if (file != null) {
            invites = shareInviteRepository.findByFileIdAndStatus(file.getId(), "pending");
        } else {
            invites = shareInviteRepository.findByFolderIdAndStatus(folder.getId(), "pending");
        }

        invites.forEach(inv -> result.add(ShareResponse.from(inv)));

        return result;
    }

    public ShareResponse updateShare(String userId, String shareId, String role) {
        Share share = shareRepository.findById(shareId).orElse(null);
        if (share != null) {
            if (share.getFile() != null) permissionService.validateFileOwner(userId, share.getFile());
            if (share.getFolder() != null) permissionService.validateFolderOwner(userId, share.getFolder());
            share.setRole(role);
            return ShareResponse.from(shareRepository.save(share));
        }

        ShareInvite invite = shareInviteRepository.findById(shareId).orElse(null);
        if (invite != null && "pending".equals(invite.getStatus())) {
            if (invite.getFile() != null) permissionService.validateFileOwner(userId, invite.getFile());
            if (invite.getFolder() != null) permissionService.validateFolderOwner(userId, invite.getFolder());
            invite.setRole(role);
            return ShareResponse.from(shareInviteRepository.save(invite));
        }

        throw new AppException("Share not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public Map<String, Boolean> removeShare(String userId, String shareId) {
        Share share = shareRepository.findById(shareId).orElse(null);
        if (share != null) {
            if (share.getFile() != null) permissionService.validateFileOwner(userId, share.getFile());
            if (share.getFolder() != null) permissionService.validateFolderOwner(userId, share.getFolder());
            shareRepository.delete(share);
            return Map.of("deleted", true);
        }

        ShareInvite invite = shareInviteRepository.findById(shareId).orElse(null);
        if (invite != null) {
            if (invite.getFile() != null) permissionService.validateFileOwner(userId, invite.getFile());
            if (invite.getFolder() != null) permissionService.validateFolderOwner(userId, invite.getFolder());
            invite.setStatus("revoked");
            shareInviteRepository.save(invite);
            return Map.of("deleted", true);
        }

        throw new AppException("Share not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public List<ShareResponse> getSharedWithMe(String userId) {
        List<Share> shares = shareRepository.findBySharedWithId(userId);
        return shares.stream()
                .filter(s -> (s.getFile() != null && !s.getFile().getIsDeleted() && "completed".equals(s.getFile().getUploadStatus())) ||
                             (s.getFolder() != null && !s.getFolder().getIsDeleted()))
                .map(ShareResponse::from)
                .toList();
    }
}
