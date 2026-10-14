package com.storvix.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "files", indexes = {
    @Index(name = "idx_files_owner_folder_deleted", columnList = "owner_id, folder_id, is_deleted, upload_status"),
    @Index(name = "idx_files_folder_deleted", columnList = "folder_id, is_deleted, upload_status"),
    @Index(name = "idx_files_owner_created", columnList = "owner_id, is_deleted, created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false)
    private String originalName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "file_tags",
        joinColumns = @JoinColumn(name = "file_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private java.util.Set<Tag> tags = new java.util.HashSet<>();

    @Column(nullable = false, unique = true)
    private String storageKey;

    @Column(nullable = false)
    private String mimeType;

    private String extension = "";

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false)
    private String storageProvider = "local";

    @Column(nullable = false)
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;

    @Column(nullable = false)
    private String uploadStatus = "pending";

    @Column(name = "version_number", nullable = false, columnDefinition = "integer default 1")
    private Integer versionNumber = 1;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (versionNumber == null) {
            versionNumber = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (versionNumber == null) {
            versionNumber = 1;
        }
    }

    @PostLoad
    protected void onPostLoad() {
        if (versionNumber == null) {
            versionNumber = 1;
        }
    }
}
