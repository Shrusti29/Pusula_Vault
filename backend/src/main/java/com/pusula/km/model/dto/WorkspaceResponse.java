package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkspaceResponse(
        @JsonProperty("id") UUID id,
        @JsonProperty("name") String name,
        @JsonProperty("description") String description,
        @JsonProperty("createdAt") Instant createdAt,
        @JsonProperty("updatedAt") Instant updatedAt,
        @JsonProperty("createdBy") UUID createdBy,
        @JsonProperty("documentCount") Integer documentCount,
        @JsonProperty("storageUsedBytes") Long storageUsedBytes,
        @JsonProperty("effectivePermissions") List<Permission> effectivePermissions
) {
    @JsonProperty("created_at")
    public Instant getCreatedAtAlias() { return createdAt; }

    @JsonProperty("updated_at")
    public Instant getUpdatedAtAlias() { return updatedAt; }

    @JsonProperty("created_by")
    public UUID getCreatedByAlias() { return createdBy; }

    @JsonProperty("document_count")
    public Integer getDocumentCountAlias() { return documentCount; }

    @JsonProperty("storage_used_bytes")
    public Long getStorageUsedBytesAlias() { return storageUsedBytes; }

    @JsonProperty("effective_permissions")
    public List<Permission> getEffectivePermissionsAlias() { return effectivePermissions; }
}
