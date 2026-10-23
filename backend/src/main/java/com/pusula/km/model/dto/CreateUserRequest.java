package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record CreateUserRequest(
        @JsonProperty("email") @NotBlank @Email String email,
        @JsonProperty("fullName") @JsonAlias({"full_name", "displayName", "display_name", "name"}) @NotBlank @Size(min = 2, max = 120) String fullName,
        @JsonProperty("role") @NotNull Role role,
        @JsonProperty("password") @NotBlank @Size(min = 8, max = 128) String password,
        @JsonProperty("featurePermissions") @JsonAlias({"feature_permissions"}) Set<String> featurePermissions,
        @JsonProperty("workspaceIds") @JsonAlias({"workspace_ids"}) List<UUID> workspaceIds
) {}
