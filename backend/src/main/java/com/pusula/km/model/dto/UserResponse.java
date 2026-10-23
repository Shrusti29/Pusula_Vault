package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.Role;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        @JsonProperty("id") UUID id,
        @JsonProperty("username") String username,
        @JsonProperty("email") String email,
        @JsonProperty("role") Role role,
        @JsonProperty("fullName") String fullName,
        @JsonProperty("active") boolean active,
        @JsonProperty("createdAt") Instant createdAt,
        @JsonProperty("updatedAt") Instant updatedAt,
        @JsonProperty("featurePermissions") Set<String> featurePermissions,
        @JsonProperty("workspaceIds") List<UUID> workspaceIds
) {
    @JsonProperty("full_name")
    public String getFullNameAlias() {
        return fullName;
    }

    @JsonProperty("feature_permissions")
    public Set<String> getFeaturePermissionsAlias() {
        return featurePermissions;
    }

    @JsonProperty("workspace_ids")
    public List<UUID> getWorkspaceIdsAlias() {
        return workspaceIds;
    }

    @JsonProperty("created_at")
    public Instant getCreatedAtAlias() {
        return createdAt;
    }

    @JsonProperty("updated_at")
    public Instant getUpdatedAtAlias() {
        return updatedAt;
    }
}
