package com.pusula.km.mapper;

import com.pusula.km.model.dto.DocumentVersionResponse;
import com.pusula.km.model.entity.DocumentVersion;
import org.springframework.stereotype.Component;

@Component
public class DocumentVersionMapper {

    public DocumentVersionResponse toResponse(DocumentVersion v) {
        if (v == null) return null;
        return new DocumentVersionResponse(
                v.getId(),
                v.getDocument() != null ? v.getDocument().getId() : null,
                v.getVersionNumber(),
                v.getContent(),
                v.getChangeSummary(),
                v.getContent() != null ? (long) v.getContent().length() : null,
                v.getCreatedBy() != null ? v.getCreatedBy().getId() : null,
                v.getCreatedAt(),
                v.isPriority(),
                v.getPriorityNote()
        );
    }
}
