package com.storvix.backend.repository;

import com.storvix.backend.entity.File;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<File, String> {
    @EntityGraph(attributePaths = {"tags"})
    List<File> findByFolderIdAndIsDeletedFalseAndUploadStatusOrderByName(String folderId, String uploadStatus);

    @EntityGraph(attributePaths = {"tags"})
    List<File> findByOwnerIdAndFolderIsNullAndIsDeletedFalseAndUploadStatusOrderByName(String ownerId, String uploadStatus);

    @EntityGraph(attributePaths = {"tags"})
    List<File> findByOwnerIdAndIsDeletedTrue(String ownerId);

    @EntityGraph(attributePaths = {"tags"})
    List<File> findByOwnerIdAndIsDeletedFalseAndUploadStatus(String ownerId, String uploadStatus);

    long countByOwnerIdAndIsDeletedFalse(String ownerId);
    long countByOwnerIdAndIsDeletedFalseAndUploadStatus(String ownerId, String uploadStatus);

    @EntityGraph(attributePaths = {"tags"})
    List<File> findTop5ByOwnerIdAndIsDeletedFalseOrderByCreatedAtDesc(String ownerId);
}
