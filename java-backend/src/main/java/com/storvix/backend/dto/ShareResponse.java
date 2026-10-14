package com.storvix.backend.dto;

import com.storvix.backend.entity.Share;
import com.storvix.backend.entity.ShareInvite;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ShareResponse {
    private String _id;
    private String role;
    private Boolean pending;
    private String kind;
    private String email;
    private LocalDateTime createdAt;
    private Object sharedWith; // Could be a map with name and email
    private FileResponse file;
    private FolderResponse folder;
    private Object owner;

    public static ShareResponse from(Share share) {
        return ShareResponse.builder()
                .pending(false)
                .kind("share")
                ._id(share.getId())
                .role(share.getRole())
                .createdAt(share.getCreatedAt())
                .sharedWith(java.util.Map.of(
                        "name", share.getSharedWith().getName(),
                        "email", share.getSharedWith().getEmail()
                ))
                .file(share.getFile() != null ? FileResponse.from(share.getFile()) : null)
                .folder(share.getFolder() != null ? FolderResponse.from(share.getFolder()) : null)
                .owner(share.getOwner() != null ? java.util.Map.of(
                        "name", share.getOwner().getName(),
                        "email", share.getOwner().getEmail()
                ) : null)
                .build();
    }

    public static ShareResponse from(ShareInvite invite) {
        return ShareResponse.builder()
                .pending(true)
                .kind("invite")
                ._id(invite.getId())
                .role(invite.getRole())
                .email(invite.getEmail())
                .createdAt(invite.getCreatedAt())
                .sharedWith(java.util.Map.of(
                        "name", invite.getEmail(),
                        "email", invite.getEmail()
                ))
                .file(invite.getFile() != null ? FileResponse.from(invite.getFile()) : null)
                .folder(invite.getFolder() != null ? FolderResponse.from(invite.getFolder()) : null)
                .owner(invite.getOwner() != null ? java.util.Map.of(
                        "name", invite.getOwner().getName(),
                        "email", invite.getOwner().getEmail()
                ) : null)
                .build();
    }
}
