package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.model.enums.DocumentType;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DocumentResponse(
        @JsonProperty("id") UUID id,
        @JsonProperty("workspaceId") UUID workspaceId,
        @JsonProperty("folderId") UUID folderId,
        @JsonProperty("title") String title,
        @JsonProperty("content") String content,
        @JsonProperty("contentType") String contentType,
        @JsonProperty("status") DocumentStatus status,
        @JsonProperty("currentVersion") Integer currentVersion,
        @JsonProperty("tags") List<TagResponse> tags,
        @JsonProperty("createdBy") UUID createdBy,
        @JsonProperty("updatedBy") UUID updatedBy,
        @JsonProperty("createdAt") Instant createdAt,
        @JsonProperty("updatedAt") Instant updatedAt,
        @JsonProperty("lastEditedAt") Instant lastEditedAt,
        @JsonProperty("effectivePermissions") List<Permission> effectivePermissions,
        @JsonProperty("copyAllowed") Boolean copyAllowed,
        @JsonProperty("version") Long version,
        @JsonProperty("documentType") DocumentType documentType
) {
    @JsonProperty("workspace_id")
    public UUID getWorkspaceIdAlias() { return workspaceId; }

    @JsonProperty("folder_id")
    public UUID getFolderIdAlias() { return folderId; }

    @JsonProperty("content_type")
    public String getContentTypeAlias() { return contentType; }

    @JsonProperty("current_version")
    public Integer getCurrentVersionAlias() { return currentVersion; }

    @JsonProperty("created_by")
    public UUID getCreatedByAlias() { return createdBy; }

    @JsonProperty("updated_by")
    public UUID getUpdatedByAlias() { return updatedBy; }

    @JsonProperty("created_at")
    public Instant getCreatedAtAlias() { return createdAt; }

    @JsonProperty("updated_at")
    public Instant getUpdatedAtAlias() { return updatedAt; }

    @JsonProperty("last_edited_at")
    public Instant getLastEditedAtAlias() { return lastEditedAt; }

    @JsonProperty("effective_permissions")
    public List<Permission> getEffectivePermissionsAlias() { return effectivePermissions; }

    @JsonProperty("copy_allowed")
    public Boolean getCopyAllowedAlias() { return copyAllowed; }

    @JsonProperty("document_type")
    public DocumentType getDocumentTypeAlias() { return documentType; }
}
