package com.storvix.backend.service;

import com.storvix.backend.dto.StarResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.Star;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.StarRepository;
import com.storvix.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StarService {
    private final StarRepository starRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    public List<StarResponse> listStars(String userId) {
        return starRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(StarResponse::from)
                .collect(Collectors.toList());
    }

    public StarResponse starResource(String userId, Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        String fileId = payload.get("fileId");
        String folderId = payload.get("folderId");
        
        File file = null;
        Folder folder = null;

        if (fileId != null) {
            file = fileRepository.findById(fileId)
                    .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            if (!file.getOwner().getId().equals(userId)) {
                throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
            }
        } else if (folderId != null) {
            folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
            if (!folder.getOwner().getId().equals(userId)) {
                throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
            }
        } else {
            throw new AppException("Provide fileId or folderId", HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
        }

        Star existing = null;
        if (file != null) {
            String fId = file.getId();
            existing = starRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(userId) && s.getFile() != null && s.getFile().getId().equals(fId))
                .findFirst().orElse(null);
        } else {
            String fId = folder.getId();
            existing = starRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(userId) && s.getFolder() != null && s.getFolder().getId().equals(fId))
                .findFirst().orElse(null);
        }

        if (existing != null) {
            return StarResponse.from(existing);
        }

        Star star = new Star();
        star.setUser(user);
        star.setFile(file);
        star.setFolder(folder);
        return StarResponse.from(starRepository.save(star));
    }

    public Map<String, Boolean> unstarResource(String userId, Map<String, String> payload) {
        String fileId = payload.get("fileId");
        String folderId = payload.get("folderId");

        Star star = null;
        if (fileId != null) {
            star = starRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(userId) && s.getFile() != null && s.getFile().getId().equals(fileId))
                .findFirst().orElse(null);
        } else if (folderId != null) {
            star = starRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(userId) && s.getFolder() != null && s.getFolder().getId().equals(folderId))
                .findFirst().orElse(null);
        }

        if (star != null) {
            starRepository.delete(star);
        }

        return Map.of("success", true);
    }
}
