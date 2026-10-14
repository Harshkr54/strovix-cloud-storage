package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.CreateOrderRequest;
import com.storvix.backend.dto.VerifyPaymentRequest;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateOrderRequest request) {
        Map<String, Object> data = paymentService.createOrder(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerifyPaymentRequest request) {
        Map<String, Object> data = paymentService.verifyPayment(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", data));
    }

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        Map<String, Object> data = paymentService.processWebhook(rawPayload, signature);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
