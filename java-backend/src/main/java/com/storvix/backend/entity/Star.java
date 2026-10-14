package com.storvix.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "stars", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "file_id"}),
    @UniqueConstraint(columnNames = {"user_id", "folder_id"})
}, indexes = {
    @Index(name = "idx_stars_user_file", columnList = "user_id, file_id"),
    @Index(name = "idx_stars_user_folder", columnList = "user_id, folder_id"),
    @Index(name = "idx_stars_user_created", columnList = "user_id, created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
public class Star {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private File file;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        validateResource();
        createdAt = LocalDateTime.now();
    }
    
    private void validateResource() {
        if ((file == null && folder == null) || (file != null && folder != null)) {
            throw new IllegalStateException("Star must reference exactly one of file or folder");
        }
    }
}
