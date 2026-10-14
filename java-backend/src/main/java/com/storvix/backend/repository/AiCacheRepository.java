package com.storvix.backend.repository;

import com.storvix.backend.entity.AiCache;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiCacheRepository extends JpaRepository<AiCache, String> {
    AiCache findByFileIdAndAction(String fileId, String action);
}
