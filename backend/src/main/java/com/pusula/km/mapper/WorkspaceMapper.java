package com.pusula.km.mapper;

import com.pusula.km.model.dto.WorkspaceResponse;
import com.pusula.km.model.entity.Workspace;
import org.springframework.stereotype.Component;

@Component
public class WorkspaceMapper {
    public WorkspaceResponse toResponse(Workspace workspace) {
        if (workspace == null) return null;
        return new WorkspaceResponse(
                workspace.getId(),
                workspace.getName(),
                workspace.getDescription(),
                workspace.getCreatedAt(),
                workspace.getUpdatedAt(),
                workspace.getCreatedBy() != null ? workspace.getCreatedBy().getId() : null,
                0,
                0L,
                null
        );
    }
}
