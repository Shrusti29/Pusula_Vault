package com.pusula.km.mapper;

import com.pusula.km.model.dto.CreateFolderRequest;
import com.pusula.km.model.dto.FolderResponse;
import com.pusula.km.model.entity.Folder;
import org.springframework.stereotype.Component;

@Component
public class FolderMapper {

    public FolderResponse toResponse(Folder f) {
        if (f == null) return null;
        return new FolderResponse(
                f.getId(),
                f.getWorkspace() != null ? f.getWorkspace().getId() : null,
                f.getParentFolder() != null ? f.getParentFolder().getId() : null,
                f.getName(),
                null,
                f.getCreatedAt(),
                f.getUpdatedAt(),
                0,
                0
        );
    }

    public Folder toEntity(CreateFolderRequest req) {
        if (req == null) return null;
        Folder f = new Folder();
        f.setName(req.name());
        return f;
    }
}
