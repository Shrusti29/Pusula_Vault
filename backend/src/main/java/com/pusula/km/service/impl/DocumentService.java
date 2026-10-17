package com.pusula.km.service.impl;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.entity.Folder;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.WorkspaceRepository;
import com.pusula.km.repository.FolderRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    public List<Document> getDocumentsByWorkspace(UUID workspaceId) {
        return documentRepository.findByWorkspaceId(workspaceId);
    }

    public Document createDocument(UUID workspaceId, UUID folderId, String title, String content, String contentType, UUID userId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
        Folder folder = folderId != null ? folderRepository.findById(folderId).orElse(null) : null;
        User user = userRepository.findById(userId).orElse(null);

        Document doc = Document.builder()
                .workspace(ws)
                .folder(folder)
                .title(title)
                .content(content)
                .contentType(contentType)
                .createdBy(user)
                .updatedBy(user)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .currentVersion(1)
                .status(DocumentStatus.ACTIVE)
                .build();
        return documentRepository.save(doc);
    }
}
