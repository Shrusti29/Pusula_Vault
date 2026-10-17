package com.pusula.km.mapper;

import com.pusula.km.model.dto.CreateDocumentRequest;
import com.pusula.km.model.dto.DocumentResponse;
import com.pusula.km.model.dto.TagResponse;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.User;
import com.pusula.km.service.impl.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class DocumentMapper {

    private final AccessScopeService accessScopeService;

    public DocumentResponse toResponse(Document d) {
        if (d == null) return null;
        boolean copyAllowed = true;
        try {
            User user = accessScopeService.requireUser();
            copyAllowed = accessScopeService.canCopy(user);
        } catch (Exception ignored) {
            copyAllowed = false;
        }
        return new DocumentResponse(
                d.getId(),
                d.getWorkspace() != null ? d.getWorkspace().getId() : null,
                d.getFolder() != null ? d.getFolder().getId() : null,
                d.getTitle(),
                d.getContent(),
                d.getContentType(),
                d.getStatus(),
                d.getCurrentVersion(),
                new ArrayList<TagResponse>(),
                d.getCreatedBy() != null ? d.getCreatedBy().getId() : null,
                d.getUpdatedBy() != null ? d.getUpdatedBy().getId() : null,
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getUpdatedAt(),
                null,
                copyAllowed,
                d.getVersion(),
                d.getDocumentType()
        );
    }

    public Document toEntity(CreateDocumentRequest req) {
        if (req == null) return null;
        Document d = new Document();
        d.setTitle(req.title());
        d.setContent(req.content());
        d.setContentType(req.contentType());
        return d;
    }
}
