package com.storvix.backend.repository;

import com.storvix.backend.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface AiConversationRepository extends JpaRepository<AiConversation, String> {
    @Query("SELECT c FROM AiConversation c WHERE c.user.id = :userId AND c.file.id = :fileId")
    Optional<AiConversation> findByUserIdAndFileId(@Param("userId") String userId, @Param("fileId") String fileId);
}
