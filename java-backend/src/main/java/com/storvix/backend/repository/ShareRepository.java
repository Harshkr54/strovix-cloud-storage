package com.storvix.backend.repository;

import com.storvix.backend.entity.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShareRepository extends JpaRepository<Share, String> {
    List<Share> findBySharedWithId(String sharedWithId);
    Optional<Share> findByFileIdAndSharedWithId(String fileId, String sharedWithId);
    Optional<Share> findByFolderIdAndSharedWithId(String folderId, String sharedWithId);
    List<Share> findByFileId(String fileId);
    List<Share> findByFolderId(String folderId);
}
