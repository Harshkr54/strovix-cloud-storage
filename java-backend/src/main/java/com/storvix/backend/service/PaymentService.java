package com.storvix.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.storvix.backend.dto.CreateOrderRequest;
import com.storvix.backend.dto.SubscriptionPlanResponse;
import com.storvix.backend.dto.VerifyPaymentRequest;
import com.storvix.backend.entity.PaymentOrder;
import com.storvix.backend.entity.SubscriptionPlan;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.PaymentOrderRepository;
import com.storvix.backend.repository.SubscriptionPlanRepository;
import com.storvix.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key.secret:secret_placeholder}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:webhook_secret_placeholder}")
    private String webhookSecret;

    @PostConstruct
    public void initSeedPlans() {
        try {
            if (subscriptionPlanRepository.findByNameIgnoreCase("Basic").isEmpty()) {
                SubscriptionPlan basic = new SubscriptionPlan();
                basic.setName("Basic");
                basic.setDescription("100 GB High-Speed Cloud Storage");
                basic.setStorageQuotaBytes(100L * 1024L * 1024L * 1024L); // 100 GB
                basic.setPriceInPaise(19900L); // ₹199
                basic.setCurrency("INR");
                basic.setActive(true);
                subscriptionPlanRepository.save(basic);
            }

            if (subscriptionPlanRepository.findByNameIgnoreCase("Premium").isEmpty()) {
                SubscriptionPlan premium = new SubscriptionPlan();
                premium.setName("Premium");
                premium.setDescription("1 TB High-Speed Cloud Storage");
                premium.setStorageQuotaBytes(1024L * 1024L * 1024L * 1024L); // 1 TB
                premium.setPriceInPaise(49900L); // ₹499
                premium.setCurrency("INR");
                premium.setActive(true);
                subscriptionPlanRepository.save(premium);
            }
        } catch (Exception e) {
            log.warn("Could not seed subscription plans: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getActivePlans() {
        return subscriptionPlanRepository.findByActiveTrueOrderByPriceInPaiseAsc()
                .stream().map(SubscriptionPlanResponse::from).toList();
    }

    public String getKeyId() {
        return keyId;
    }

    @Transactional
    public Map<String, Object> createOrder(String userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new AppException("Subscription plan not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!plan.getActive()) {
            throw new AppException("Plan is not currently active", HttpStatus.BAD_REQUEST, "PLAN_INACTIVE");
        }

        try {
            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", plan.getPriceInPaise());
            orderRequest.put("currency", plan.getCurrency());
            orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());

            Order rzpOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = rzpOrder.get("id");

            PaymentOrder paymentOrder = new PaymentOrder();
            paymentOrder.setUser(user);
            paymentOrder.setSubscriptionPlan(plan);
            paymentOrder.setRazorpayOrderId(razorpayOrderId);
            paymentOrder.setAmount(plan.getPriceInPaise());
            paymentOrder.setCurrency(plan.getCurrency());
            paymentOrder.setStatus(PaymentOrder.Status.CREATED);

            paymentOrderRepository.save(paymentOrder);

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", razorpayOrderId);
            result.put("keyId", keyId);
            result.put("amount", plan.getPriceInPaise());
            result.put("currency", plan.getCurrency());
            result.put("planId", plan.getId());
            result.put("planName", plan.getName());
            return result;
        } catch (Exception e) {
            log.error("Razorpay order creation failed", e);
            throw new AppException("Payment initialization failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, "PAYMENT_INIT_FAILED");
        }
    }

    @Transactional
    public Map<String, Object> verifyPayment(String userId, VerifyPaymentRequest request) {
        PaymentOrder order = paymentOrderRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new AppException("Payment order not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!order.getUser().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        if (order.getStatus() == PaymentOrder.Status.PAID) {
            return Map.of("success", true, "message", "Payment already processed", "quota", order.getUser().getStorageQuota());
        }

        String dataToSign = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        String generatedSignature = calculateHmacSha256(dataToSign, keySecret);

        if (!generatedSignature.equals(request.getRazorpaySignature())) {
            order.setStatus(PaymentOrder.Status.FAILED);
            paymentOrderRepository.save(order);
            throw new AppException("Invalid payment signature", HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE");
        }

        // Fulfill payment
        fulfillPayment(order, request.getRazorpayPaymentId());

        return Map.of(
                "success", true,
                "message", "Payment verified and storage upgraded successfully",
                "quota", order.getUser().getStorageQuota(),
                "planName", order.getSubscriptionPlan().getName()
        );
    }

    @Transactional
    public Map<String, Object> processWebhook(String rawPayload, String signature) {
        if (signature == null || signature.isBlank()) {
            throw new AppException("Missing webhook signature", HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE");
        }

        String expectedSignature = calculateHmacSha256(rawPayload, webhookSecret);
        if (!expectedSignature.equalsIgnoreCase(signature)) {
            log.warn("Invalid Razorpay webhook signature");
            throw new AppException("Invalid webhook signature", HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE");
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String event = root.path("event").asText();

            if ("order.paid".equalsIgnoreCase(event) || "payment.captured".equalsIgnoreCase(event)) {
                JsonNode entityNode = root.path("payload").path("payment").path("entity");
                String rzpOrderId = entityNode.path("order_id").asText();
                String rzpPaymentId = entityNode.path("id").asText();

                if (rzpOrderId != null && !rzpOrderId.isBlank()) {
                    paymentOrderRepository.findByRazorpayOrderId(rzpOrderId).ifPresent(order -> {
                        if (order.getStatus() != PaymentOrder.Status.PAID) {
                            fulfillPayment(order, rzpPaymentId);
                        }
                    });
                }
            }

            return Map.of("status", "processed");
        } catch (Exception e) {
            log.error("Webhook processing error", e);
            throw new AppException("Webhook processing failed", HttpStatus.BAD_REQUEST, "WEBHOOK_FAILED");
        }
    }

    private void fulfillPayment(PaymentOrder order, String paymentId) {
        order.setStatus(PaymentOrder.Status.PAID);
        order.setRazorpayPaymentId(paymentId);
        order.setPaidAt(LocalDateTime.now());
        paymentOrderRepository.save(order);

        User user = order.getUser();
        SubscriptionPlan plan = order.getSubscriptionPlan();

        // Update quota to plan quota if higher
        if (plan.getStorageQuotaBytes() > user.getStorageQuota()) {
            user.setStorageQuota(plan.getStorageQuotaBytes());
        }
        user.setCurrentPlan(plan);
        userRepository.save(user);

        activityService.logActivity(user, "SUBSCRIPTION_UPGRADED", "PLAN", plan.getId());
    }

    private String calculateHmacSha256(String data, String secret) {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : rawHmac) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
