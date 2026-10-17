package com.pusula.km.repository;

import com.pusula.km.model.entity.WorkspaceGrant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceGrantRepository extends JpaRepository<WorkspaceGrant, UUID> {
    List<WorkspaceGrant> findByUserId(UUID userId);
    Optional<WorkspaceGrant> findByUserIdAndWorkspaceId(UUID userId, UUID workspaceId);
    void deleteByUserId(UUID userId);
}
