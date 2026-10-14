package com.storvix.backend.repository;

import com.storvix.backend.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {
    List<SubscriptionPlan> findByActiveTrueOrderByPriceInPaiseAsc();
    Optional<SubscriptionPlan> findByNameIgnoreCase(String name);
}
