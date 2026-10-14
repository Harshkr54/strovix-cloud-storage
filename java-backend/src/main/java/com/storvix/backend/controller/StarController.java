package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.StarResponse;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.StarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stars")
@RequiredArgsConstructor
public class StarController {
    
    private final StarService starService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StarResponse>>> listStars(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<StarResponse> stars = starService.listStars(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(stars));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StarResponse>> starResource(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        StarResponse star = starService.starResource(userDetails.getUser().getId(), payload);
        return ResponseEntity.ok(ApiResponse.success("Resource starred", star));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> unstarResource(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> payload) {
        Map<String, Boolean> result = starService.unstarResource(userDetails.getUser().getId(), payload);
        return ResponseEntity.ok(ApiResponse.success("Resource unstarred", result));
    }
}
