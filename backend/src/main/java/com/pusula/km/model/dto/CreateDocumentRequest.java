package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.DocumentType;
import com.pusula.km.model.enums.SensitivityLevel;

import java.util.UUID;

public record CreateDocumentRequest(
        @JsonProperty("workspaceId") UUID workspaceId,
        @JsonProperty("folderId") UUID folderId,
        @JsonProperty("title") String title,
        @JsonProperty("content") String content,
        @JsonProperty("contentType") String contentType,
        @JsonProperty("documentType") DocumentType documentType,
        @JsonProperty("sensitivityLevel") SensitivityLevel sensitivityLevel,
        @JsonProperty("governancePolicyId") UUID governancePolicyId
) {}
