package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.dto.CreateShareRequest;
import com.storvix.backend.dto.ShareResponse;
import com.storvix.backend.dto.UpdateShareRequest;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.ShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createShare(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateShareRequest request) {
        
        Map<String, Object> result = shareService.createShare(userDetails.getUser().getId(), request);
        
        if (Boolean.TRUE.equals(result.get("emailSent"))) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.created((String) result.get("message"), result));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success((String) result.get("message"), result));
    }

    @GetMapping({"/{resourceId}", "/resource/{resourceId}"})
    public ResponseEntity<ApiResponse<List<ShareResponse>>> listShares(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String resourceId) {
        List<ShareResponse> shares = shareService.listShares(userDetails.getUser().getId(), resourceId);
        return ResponseEntity.ok(ApiResponse.success(shares));
    }

    @PatchMapping("/{shareId}")
    public ResponseEntity<ApiResponse<ShareResponse>> updateShare(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String shareId,
            @Valid @RequestBody UpdateShareRequest request) {
        ShareResponse share = shareService.updateShare(userDetails.getUser().getId(), shareId, request.getRole());
        return ResponseEntity.ok(ApiResponse.success("Share updated", share));
    }

    @DeleteMapping("/{shareId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> removeShare(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String shareId) {
        Map<String, Boolean> result = shareService.removeShare(userDetails.getUser().getId(), shareId);
        return ResponseEntity.ok(ApiResponse.success("Share removed", result));
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<ApiResponse<List<ShareResponse>>> sharedWithMe(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ShareResponse> items = shareService.getSharedWithMe(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
