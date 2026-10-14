package com.storvix.backend.service;

import com.storvix.backend.dto.ActivityResponse;
import com.storvix.backend.dto.DashboardResponse;
import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.StarResponse;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final StarRepository starRepository;
    private final ActivityRepository activityRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        Map<String, Object> storage = new HashMap<>();
        storage.put("used", user.getStorageUsed() != null ? user.getStorageUsed() : 0L);
        storage.put("quota", user.getStorageQuota() != null ? user.getStorageQuota() : 5368709120L);

        Map<String, Object> totals = new HashMap<>();
        totals.put("files", fileRepository.countByOwnerIdAndIsDeletedFalseAndUploadStatus(userId, "completed"));
        totals.put("folders", folderRepository.countByOwnerIdAndIsDeletedFalse(userId));
        totals.put("starred", starRepository.countByUserId(userId));

        return DashboardResponse.builder()
                .storage(storage)
                .totals(totals)
                .recentFiles(fileRepository.findTop5ByOwnerIdAndIsDeletedFalseOrderByCreatedAtDesc(userId)
                        .stream().map(FileResponse::from).collect(Collectors.toList()))
                .starred(starRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                        .stream().map(StarResponse::from).collect(Collectors.toList()))
                .recentActivity(activityRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                        .stream().map(ActivityResponse::from).collect(Collectors.toList()))
                .build();
    }
}
