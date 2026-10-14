package com.storvix.backend.repository;

import com.storvix.backend.entity.OAuthCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthCodeRepository extends JpaRepository<OAuthCode, String> {
    Optional<OAuthCode> findByCodeHashAndIsUsedFalse(String codeHash);
}
