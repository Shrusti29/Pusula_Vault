package com.pusula.km.repository;

import com.pusula.km.model.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {
    List<Folder> findByWorkspaceId(UUID workspaceId);
    List<Folder> findByParentFolderIdIsNull();
    List<Folder> findByParentFolderId(UUID parentFolderId);
    List<Folder> findByWorkspaceIdAndParentFolderId(UUID workspaceId, UUID parentFolderId);
}
