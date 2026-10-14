package com.storvix.backend.dto;

import com.storvix.backend.entity.SubscriptionPlan;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubscriptionPlanResponse {
    private String id;
    private String name;
    private String description;
    private Long storageQuotaBytes;
    private Long priceInPaise;
    private String currency;
    private Boolean active;

    public static SubscriptionPlanResponse from(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .storageQuotaBytes(plan.getStorageQuotaBytes())
                .priceInPaise(plan.getPriceInPaise())
                .currency(plan.getCurrency())
                .active(plan.getActive())
                .build();
    }
}
