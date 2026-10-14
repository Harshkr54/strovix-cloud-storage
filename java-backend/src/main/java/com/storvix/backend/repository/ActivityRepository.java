package com.storvix.backend.repository;

import com.storvix.backend.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String> {
    List<Activity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Activity> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
}
