package com.storvix.backend.repository;

import com.storvix.backend.entity.ShareInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShareInviteRepository extends JpaRepository<ShareInvite, String> {
    List<ShareInvite> findByEmailAndStatus(String email, String status);
    List<ShareInvite> findByFileIdAndStatus(String fileId, String status);
    List<ShareInvite> findByFolderIdAndStatus(String folderId, String status);
    ShareInvite findByEmailAndStatusAndFileId(String email, String status, String fileId);
    ShareInvite findByEmailAndStatusAndFolderId(String email, String status, String folderId);
}
