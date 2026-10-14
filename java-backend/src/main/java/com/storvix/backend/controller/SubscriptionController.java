package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.SubscriptionPlanResponse;
import com.storvix.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final PaymentService paymentService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlans() {
        List<SubscriptionPlanResponse> plans = paymentService.getActivePlans();
        Map<String, Object> data = new HashMap<>();
        data.put("plans", plans);
        data.put("keyId", paymentService.getKeyId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
