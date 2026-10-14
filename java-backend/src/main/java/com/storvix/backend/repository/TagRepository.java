package com.storvix.backend.repository;

import com.storvix.backend.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, String> {
    List<Tag> findByOwnerIdOrderByNameAsc(String ownerId);
    Optional<Tag> findByIdAndOwnerId(String id, String ownerId);
    Optional<Tag> findByNameIgnoreCaseAndOwnerId(String name, String ownerId);
    boolean existsByNameIgnoreCaseAndOwnerId(String name, String ownerId);
}
