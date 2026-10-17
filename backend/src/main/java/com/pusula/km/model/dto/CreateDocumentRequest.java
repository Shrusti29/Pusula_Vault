package com.pusula.km.model.dto;

import com.pusula.km.model.enums.DocumentType;
import com.pusula.km.model.enums.SensitivityLevel;

import java.util.UUID;

public record CreateDocumentRequest(
        UUID workspaceId,
        UUID folderId,
        String title,
        String content,
        String contentType,
        DocumentType documentType,
        SensitivityLevel sensitivityLevel,
        UUID governancePolicyId
) {}
