package com.storvix.backend.controller;

import com.storvix.backend.dto.ApiResponse;
import com.storvix.backend.entity.AiCache;
import com.storvix.backend.entity.AiConversation;
import com.storvix.backend.entity.File;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.AiCacheRepository;
import com.storvix.backend.repository.AiConversationRepository;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.security.CustomUserDetails;
import com.storvix.backend.service.AiService;
import com.storvix.backend.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/ai/files", "/api/ai"})
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final FileRepository fileRepository;
    private final AiCacheRepository aiCacheRepository;
    private final AiConversationRepository aiConversationRepository;
    private final S3StorageService s3StorageService;
    private final com.storvix.backend.service.PermissionService permissionService;

    private byte[] getAuthorizedFileBuffer(String userId, String fileId) {
        File file = fileRepository.findById(fileId).orElse(null);
        if (file == null || file.getIsDeleted() || !"completed".equals(file.getUploadStatus())) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        permissionService.validateFileReadAccess(userId, file);

        return s3StorageService.getObjectAsBytes(file.getStorageKey());
    }

    private File getAuthorizedFile(String userId, String fileId) {
        File file = fileRepository.findById(fileId).orElse(null);
        if (file == null || file.getIsDeleted()) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        permissionService.validateFileReadAccess(userId, file);
        return file;
    }

    @PostMapping("/{fileId}/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        AiCache cache = aiCacheRepository.findByFileIdAndAction(fileId, "summarize");
        if (cache != null && (cache.getFileUpdatedAt() == null || cache.getFileUpdatedAt().compareTo(file.getUpdatedAt()) >= 0)) {
            Map<String, Object> data = new HashMap<>(cache.getData());
            data.put("cached", true);
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        byte[] buffer = getAuthorizedFileBuffer(userId, fileId);
        Map<String, Object> result = aiService.summarizeDocument(buffer, file.getMimeType(), file.getExtension(), file.getName());
        
        saveCache(file, "summarize", result);

        Map<String, Object> data = new HashMap<>(result);
        data.put("cached", false);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{fileId}/short-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> shortSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        AiCache cache = aiCacheRepository.findByFileIdAndAction(fileId, "short-summary");
        if (cache != null && (cache.getFileUpdatedAt() == null || cache.getFileUpdatedAt().compareTo(file.getUpdatedAt()) >= 0)) {
            Map<String, Object> data = new HashMap<>(cache.getData());
            data.put("cached", true);
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        byte[] buffer = getAuthorizedFileBuffer(userId, fileId);
        Map<String, Object> result = aiService.generateShortSummary(buffer, file.getMimeType(), file.getExtension(), file.getName());

        saveCache(file, "short-summary", result);

        Map<String, Object> data = new HashMap<>(result);
        data.put("cached", false);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{fileId}/key-points")
    public ResponseEntity<ApiResponse<Map<String, Object>>> keyPoints(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        AiCache cache = aiCacheRepository.findByFileIdAndAction(fileId, "key-points");
        if (cache != null && (cache.getFileUpdatedAt() == null || cache.getFileUpdatedAt().compareTo(file.getUpdatedAt()) >= 0)) {
            Map<String, Object> data = new HashMap<>(cache.getData());
            data.put("cached", true);
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        byte[] buffer = getAuthorizedFileBuffer(userId, fileId);
        Map<String, Object> result = aiService.generateKeyPoints(buffer, file.getMimeType(), file.getExtension(), file.getName());

        saveCache(file, "key-points", result);

        Map<String, Object> data = new HashMap<>(result);
        data.put("cached", false);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{fileId}/extract")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extractInformation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        AiCache cache = aiCacheRepository.findByFileIdAndAction(fileId, "extract");
        if (cache != null && (cache.getFileUpdatedAt() == null || cache.getFileUpdatedAt().compareTo(file.getUpdatedAt()) >= 0)) {
            Map<String, Object> data = new HashMap<>(cache.getData());
            data.put("cached", true);
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        byte[] buffer = getAuthorizedFileBuffer(userId, fileId);
        Map<String, Object> result = aiService.extractInformation(buffer, file.getMimeType(), file.getExtension(), file.getName());

        saveCache(file, "extract", result);

        Map<String, Object> data = new HashMap<>(result);
        data.put("cached", false);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{fileId}/ask")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ask(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId,
            @RequestBody Map<String, String> body) {
        
        String question = body.get("question");
        if (question == null || question.trim().isEmpty()) {
            throw new AppException("Question is required", HttpStatus.BAD_REQUEST, "INVALID_INPUT");
        }

        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        byte[] buffer = getAuthorizedFileBuffer(userId, fileId);

        AiConversation conversation = aiConversationRepository.findByUserIdAndFileId(userId, fileId).orElse(null);
        if (conversation == null) {
            conversation = new AiConversation();
            conversation.setUser(userDetails.getUser());
            conversation.setFile(file);
            conversation.setMessages(new ArrayList<>());
        }

        List<Map<String, String>> history = new ArrayList<>();
        if (conversation.getMessages() != null) {
            for (Map<String, Object> m : conversation.getMessages()) {
                Map<String, String> hm = new HashMap<>();
                hm.put("role", (String) m.get("role"));
                hm.put("content", (String) m.get("content"));
                history.add(hm);
            }
        }

        Map<String, Object> result = aiService.askQuestion(buffer, file.getMimeType(), file.getExtension(), file.getName(), question.trim(), history);

        List<Map<String, Object>> messages = conversation.getMessages() != null ? conversation.getMessages() : new ArrayList<>();
        
        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", question.trim());
        userMsg.put("createdAt", LocalDateTime.now().toString());
        messages.add(userMsg);
        
        Map<String, Object> asstMsg = new HashMap<>();
        asstMsg.put("role", "assistant");
        asstMsg.put("content", result.get("answer"));
        asstMsg.put("sources", result.get("sources"));
        asstMsg.put("createdAt", LocalDateTime.now().toString());
        messages.add(asstMsg);

        conversation.setMessages(messages);
        aiConversationRepository.save(conversation);

        Map<String, Object> data = new HashMap<>();
        data.put("answer", result.get("answer"));
        data.put("sources", result.get("sources"));
        data.put("messages", messages);
        
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{fileId}/conversation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        List<Map<String, Object>> messages = new ArrayList<>();
        try {
            AiConversation conversation = aiConversationRepository.findByUserIdAndFileId(userId, fileId).orElse(null);
            if (conversation != null && conversation.getMessages() != null) {
                messages = conversation.getMessages();
            }
        } catch (Exception e) {
            // Log & gracefully return empty conversation history if DB or entity fails
        }

        Map<String, Object> data = new HashMap<>();
        data.put("messages", messages);
        
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @DeleteMapping("/{fileId}/conversation")
    public ResponseEntity<ApiResponse<Object>> clearConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String fileId) {
        String userId = userDetails.getUser().getId();
        File file = getAuthorizedFile(userId, fileId);
        if (file == null) throw new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND");

        AiConversation conversation = aiConversationRepository.findByUserIdAndFileId(userId, fileId).orElse(null);
        if (conversation != null) {
            aiConversationRepository.delete(conversation);
        }

        return ResponseEntity.ok(ApiResponse.success("Conversation history cleared", null));
    }

    private void saveCache(File file, String featureType, Map<String, Object> result) {
        AiCache cache = aiCacheRepository.findByFileIdAndAction(file.getId(), featureType);
        if (cache == null) {
            cache = new AiCache();
            cache.setFile(file);
            cache.setAction(featureType);
        }
        cache.setFileUpdatedAt(file.getUpdatedAt());
        cache.setData(result);
        aiCacheRepository.save(cache);
    }
}
