package com.storvix.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/", "/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Storvix Cloud Storage API");
        status.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(status);
    }
}
