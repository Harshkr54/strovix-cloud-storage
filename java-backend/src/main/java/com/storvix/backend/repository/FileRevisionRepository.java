package com.storvix.backend.repository;

import com.storvix.backend.entity.FileRevision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileRevisionRepository extends JpaRepository<FileRevision, String> {
    List<FileRevision> findByFileIdOrderByVersionNumberDesc(String fileId);
    Optional<FileRevision> findByFileIdAndId(String fileId, String id);
}
