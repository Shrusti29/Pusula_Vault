package com.pusula.km.service.impl;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.entity.User;
import com.pusula.km.repository.WorkspaceRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public List<Workspace> getAllWorkspaces() {
        return workspaceRepository.findAll();
    }

    public Workspace createWorkspace(String name, String description, UUID creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found: " + creatorId));
        Workspace workspace = Workspace.builder()
                .name(name)
                .description(description)
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return workspaceRepository.save(workspace);
    }
}
