package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FileAssetResponse(
        @JsonProperty("id") UUID id,
        @JsonProperty("documentId") UUID documentId,
        @JsonProperty("workspaceId") UUID workspaceId,
        @JsonProperty("folderId") UUID folderId,
        @JsonProperty("originalName") String originalName,
        @JsonProperty("mimeType") String mimeType,
        @JsonProperty("extension") String extension,
        @JsonProperty("sizeBytes") Long sizeBytes,
        @JsonProperty("checksum") String checksum,
        @JsonProperty("encrypted") boolean encrypted,
        @JsonProperty("storageKey") String storageKey,
        @JsonProperty("ocrText") String ocrText,
        @JsonProperty("ocrStatus") String ocrStatus,
        @JsonProperty("createdBy") UUID createdBy,
        @JsonProperty("createdAt") Instant createdAt,
        @JsonProperty("effectivePermissions") List<Permission> effectivePermissions,
        @JsonProperty("downloadAllowed") Boolean downloadAllowed
) {
    @JsonProperty("original_name")
    public String getOriginalNameAlias() { return originalName; }

    @JsonProperty("workspace_id")
    public UUID getWorkspaceIdAlias() { return workspaceId; }

    @JsonProperty("document_id")
    public UUID getDocumentIdAlias() { return documentId; }

    @JsonProperty("folder_id")
    public UUID getFolderIdAlias() { return folderId; }

    @JsonProperty("mime_type")
    public String getMimeTypeAlias() { return mimeType; }

    @JsonProperty("size_bytes")
    public Long getSizeBytesAlias() { return sizeBytes; }

    @JsonProperty("storage_key")
    public String getStorageKeyAlias() { return storageKey; }

    @JsonProperty("ocr_text")
    public String getOcrTextAlias() { return ocrText; }

    @JsonProperty("ocr_status")
    public String getOcrStatusAlias() { return ocrStatus; }

    @JsonProperty("created_by")
    public UUID getCreatedByAlias() { return createdBy; }

    @JsonProperty("created_at")
    public Instant getCreatedAtAlias() { return createdAt; }

    @JsonProperty("effective_permissions")
    public List<Permission> getEffectivePermissionsAlias() { return effectivePermissions; }

    @JsonProperty("download_allowed")
    public Boolean getDownloadAllowedAlias() { return downloadAllowed; }
}
