package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.DocumentStatus;

import java.util.List;
import java.util.UUID;

public record UpdateDocumentRequest(
        @JsonProperty("title") String title,
        @JsonProperty("content") String content,
        @JsonProperty("status") DocumentStatus status,
        @JsonProperty("tags") List<UUID> tags,
        @JsonProperty("changeSummary") String changeSummary
) {}
