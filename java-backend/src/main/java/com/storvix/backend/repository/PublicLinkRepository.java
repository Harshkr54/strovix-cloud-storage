package com.storvix.backend.repository;

import com.storvix.backend.entity.PublicLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PublicLinkRepository extends JpaRepository<PublicLink, String> {
}
