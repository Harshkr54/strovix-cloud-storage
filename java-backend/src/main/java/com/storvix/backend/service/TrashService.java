package com.storvix.backend.service;

import com.storvix.backend.dto.TrashItemResponse;
import com.storvix.backend.entity.File;
import com.storvix.backend.entity.Folder;
import com.storvix.backend.repository.FileRepository;
import com.storvix.backend.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrashService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    public List<TrashItemResponse> listTrash(String userId) {
        List<File> files = fileRepository.findByOwnerIdAndIsDeletedTrue(userId);
        List<Folder> folders = folderRepository.findByOwnerIdAndIsDeletedTrue(userId);

        List<TrashItemResponse> items = new ArrayList<>();

        for (Folder f : folders) {
            items.add(TrashItemResponse.builder()
                    .id(f.getId())
                    .name(f.getName())
                    .type("folder")
                    .deletedAt(f.getDeletedAt())
                    .originalLocation(f.getPath())
                    .parentFolder(f.getParentFolder() != null ? f.getParentFolder().getId() : null)
                    .build());
        }

        for (File f : files) {
            items.add(TrashItemResponse.builder()
                    .id(f.getId())
                    .name(f.getName())
                    .type("file")
                    .deletedAt(f.getDeletedAt())
                    .originalLocation(f.getFolder() != null ? f.getFolder().getId() : null)
                    .mimeType(f.getMimeType())
                    .size(f.getSize())
                    .build());
        }

        // Sort by deletedAt descending
        items.sort(Comparator.comparing(TrashItemResponse::getDeletedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        
        return items;
    }
}
