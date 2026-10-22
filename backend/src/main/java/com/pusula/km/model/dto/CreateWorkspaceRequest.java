package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateWorkspaceRequest(
        @JsonProperty("name") String name,
        @JsonProperty("description") String description
) {}
