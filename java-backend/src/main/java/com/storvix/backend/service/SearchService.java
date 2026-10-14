package com.storvix.backend.service;

import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    public Map<String, Object> search(String userId, String query, String type) {
        String q = query != null ? query.trim().toLowerCase() : "";
        List<Map<String, Object>> items = new ArrayList<>();

        if (!q.isEmpty()) {
            boolean includeFolders = "all".equalsIgnoreCase(type) || "folder".equalsIgnoreCase(type);
            boolean includeFiles = "all".equalsIgnoreCase(type) || "file".equalsIgnoreCase(type) || (!includeFolders && !"folder".equalsIgnoreCase(type));

            if (includeFolders) {
                List<Folder> folders = folderRepository.findByOwnerIdAndIsDeletedFalse(userId);
                for (Folder f : folders) {
                    if (f.getName().toLowerCase().contains(q)) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("_id", f.getId());
                        item.put("id", f.getId());
                        item.put("name", f.getName());
                        item.put("resourceType", "folder");
                        item.put("mimeType", "folder");
                        item.put("updatedAt", f.getUpdatedAt());
                        items.add(item);
                    }
                }
            }

            if (includeFiles) {
                List<File> files = fileRepository.findByOwnerIdAndIsDeletedFalseAndUploadStatus(userId, "completed");
                for (File f : files) {
                    if (f.getName().toLowerCase().contains(q) || (f.getOriginalName() != null && f.getOriginalName().toLowerCase().contains(q))) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("_id", f.getId());
                        item.put("id", f.getId());
                        item.put("name", f.getName());
                        item.put("originalName", f.getOriginalName());
                        item.put("resourceType", "file");
                        item.put("mimeType", f.getMimeType());
                        item.put("size", f.getSize());
                        item.put("updatedAt", f.getUpdatedAt());
                        items.add(item);
                    }
                }
            }
        }

        List<Map<String, Object>> fileItems = items.stream().filter(i -> "file".equals(i.get("resourceType"))).toList();
        List<Map<String, Object>> folderItems = items.stream().filter(i -> "folder".equals(i.get("resourceType"))).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("files", fileItems);
        result.put("folders", folderItems);
        result.put("total", items.size());
        return result;
    }
}
