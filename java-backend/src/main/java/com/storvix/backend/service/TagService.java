package com.storvix.backend.service;

import com.storvix.backend.dto.CreateTagRequest;
import com.storvix.backend.dto.FileResponse;
import com.storvix.backend.dto.FolderResponse;
import com.storvix.backend.dto.TagResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.entity.Tag;
import com.storvix.backend.entity.User;
import com.storvix.backend.exception.AppException;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import com.storvix.backend.repository.TagRepository;
import com.storvix.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    @Transactional
    public TagResponse createTag(String userId, CreateTagRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        String name = request.getName().trim();
        if (tagRepository.existsByNameIgnoreCaseAndOwnerId(name, userId)) {
            throw new AppException("Tag already exists", HttpStatus.CONFLICT, "TAG_EXISTS");
        }

        Tag tag = new Tag();
        tag.setName(name);
        tag.setColorHex(request.getColorHex() != null && !request.getColorHex().isBlank() ? request.getColorHex().trim() : "#3B82F6");
        tag.setOwner(user);
        tag = tagRepository.save(tag);

        return TagResponse.from(tag);
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getUserTags(String userId) {
        return tagRepository.findByOwnerIdOrderByNameAsc(userId)
                .stream().map(TagResponse::from).toList();
    }

    @Transactional
    public TagResponse updateTag(String userId, String tagId, CreateTagRequest request) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(tag.getName()) && tagRepository.existsByNameIgnoreCaseAndOwnerId(newName, userId)) {
                throw new AppException("Tag already exists", HttpStatus.CONFLICT, "TAG_EXISTS");
            }
            tag.setName(newName);
        }

        if (request.getColorHex() != null && !request.getColorHex().isBlank()) {
            tag.setColorHex(request.getColorHex().trim());
        }

        tag = tagRepository.save(tag);
        return TagResponse.from(tag);
    }

    @Transactional
    public Map<String, Boolean> deleteTag(String userId, String tagId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        for (File file : tag.getFiles()) {
            file.getTags().remove(tag);
            fileRepository.save(file);
        }

        for (Folder folder : tag.getFolders()) {
            folder.getTags().remove(tag);
            folderRepository.save(folder);
        }

        tagRepository.delete(tag);
        return Map.of("deleted", true);
    }

    @Transactional
    public FileResponse assignTagToFile(String userId, String tagId, String fileId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!file.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        file.getTags().add(tag);
        file = fileRepository.save(file);
        return FileResponse.from(file);
    }

    @Transactional
    public FileResponse removeTagFromFile(String userId, String tagId, String fileId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new AppException("File not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!file.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        file.getTags().remove(tag);
        file = fileRepository.save(file);
        return FileResponse.from(file);
    }

    @Transactional
    public FolderResponse assignTagToFolder(String userId, String tagId, String folderId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!folder.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        folder.getTags().add(tag);
        folder = folderRepository.save(folder);
        return FolderResponse.from(folder);
    }

    @Transactional
    public FolderResponse removeTagFromFolder(String userId, String tagId, String folderId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        if (!folder.getOwner().getId().equals(userId)) {
            throw new AppException("Forbidden", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        folder.getTags().remove(tag);
        folder = folderRepository.save(folder);
        return FolderResponse.from(folder);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTagResources(String userId, String tagId) {
        Tag tag = tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new AppException("Tag not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));

        List<FileResponse> files = tag.getFiles().stream()
                .filter(f -> !f.getIsDeleted() && "completed".equalsIgnoreCase(f.getUploadStatus()))
                .map(FileResponse::from)
                .toList();

        List<FolderResponse> folders = tag.getFolders().stream()
                .filter(f -> !f.getIsDeleted())
                .map(FolderResponse::from)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("tag", TagResponse.from(tag));
        result.put("files", files);
        result.put("folders", folders);
        return result;
    }
}
