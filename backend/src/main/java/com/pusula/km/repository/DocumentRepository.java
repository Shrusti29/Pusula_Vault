package com.pusula.km.repository;

import com.pusula.km.model.entity.Document;
import com.pusula.km.model.enums.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByWorkspaceId(UUID workspaceId);
    List<Document> findByFolderId(UUID folderId);
    List<Document> findByStatus(DocumentStatus status);
    Page<Document> findByWorkspaceId(UUID workspaceId, Pageable pageable);
    Page<Document> findByWorkspaceIdAndFolderId(UUID workspaceId, UUID folderId, Pageable pageable);
    Page<Document> findByFolderId(UUID folderId, Pageable pageable);
}
