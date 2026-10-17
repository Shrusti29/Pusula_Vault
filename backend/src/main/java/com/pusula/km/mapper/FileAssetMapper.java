package com.pusula.km.mapper;

import com.pusula.km.model.dto.FileAssetResponse;
import com.pusula.km.model.entity.FileAsset;
import com.pusula.km.model.entity.User;
import com.pusula.km.service.impl.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FileAssetMapper {

    private final AccessScopeService accessScopeService;

    public FileAssetResponse toResponse(FileAsset a) {
        if (a == null) return null;
        UUID workspaceId = null;
        UUID folderId = null;
        if (a.getDocument() != null) {
            if (a.getDocument().getWorkspace() != null) {
                workspaceId = a.getDocument().getWorkspace().getId();
            }
            if (a.getDocument().getFolder() != null) {
                folderId = a.getDocument().getFolder().getId();
            }
        }
        return new FileAssetResponse(
                a.getId(),
                a.getDocument() != null ? a.getDocument().getId() : null,
                workspaceId,
                folderId,
                a.getFileName(),
                a.getMimeType(),
                a.getFileType(),
                a.getFileSize(),
                a.getChecksum(),
                a.isEncrypted(),
                a.getStorageKey(),
                null,
                null,
                a.getUploadedBy() != null ? a.getUploadedBy().getId() : null,
                a.getCreatedAt(),
                null,
                downloadAllowed()
        );
    }

    private boolean downloadAllowed() {
        try {
            User user = accessScopeService.requireUser();
            return accessScopeService.canDownload(user);
        } catch (Exception ignored) {
            return false;
        }
    }
}
