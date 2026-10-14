package com.storvix.backend.repository;

import com.storvix.backend.entity.Folder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, String> {
    @EntityGraph(attributePaths = {"tags"})
    List<Folder> findByOwnerIdAndParentFolderIdAndIsDeletedFalseOrderByName(String ownerId, String parentFolderId);

    @EntityGraph(attributePaths = {"tags"})
    List<Folder> findByParentFolderIdAndIsDeletedFalseOrderByName(String parentFolderId);

    @EntityGraph(attributePaths = {"tags"})
    List<Folder> findByOwnerIdAndParentFolderIsNullAndIsDeletedFalseOrderByName(String ownerId);

    boolean existsByOwnerIdAndParentFolderIdAndNameAndIsDeletedFalse(String ownerId, String parentFolderId, String name);
    boolean existsByOwnerIdAndParentFolderIsNullAndNameAndIsDeletedFalse(String ownerId, String name);

    @EntityGraph(attributePaths = {"tags"})
    List<Folder> findByOwnerIdAndIsDeletedTrue(String ownerId);

    @EntityGraph(attributePaths = {"tags"})
    List<Folder> findByOwnerIdAndIsDeletedFalse(String ownerId);

    long countByOwnerIdAndIsDeletedFalse(String ownerId);
}
