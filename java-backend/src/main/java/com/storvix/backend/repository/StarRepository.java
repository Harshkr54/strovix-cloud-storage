package com.storvix.backend.repository;

import com.storvix.backend.entity.Star;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface StarRepository extends JpaRepository<Star, String> {
    List<Star> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Star> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);

    @Query("SELECT s.folder.id FROM Star s WHERE s.user.id = :userId AND s.folder IS NOT NULL")
    Set<String> findStarredFolderIdsByUserId(@Param("userId") String userId);

    @Query("SELECT s.file.id FROM Star s WHERE s.user.id = :userId AND s.file IS NOT NULL")
    Set<String> findStarredFileIdsByUserId(@Param("userId") String userId);
}
