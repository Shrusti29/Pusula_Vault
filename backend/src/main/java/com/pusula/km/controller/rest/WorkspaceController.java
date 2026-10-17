package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.WorkspaceMapper;
import com.pusula.km.model.dto.CreateWorkspaceRequest;
import com.pusula.km.model.dto.UpdateWorkspaceRequest;
import com.pusula.km.model.dto.WorkspaceResponse;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import com.pusula.km.service.impl.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMapper workspaceMapper;
    private final AccessScopeService accessScopeService;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getAllWorkspaces() {
        var actor = accessScopeService.requireUser();
        List<WorkspaceResponse> workspaces = accessScopeService.visibleWorkspaces(actor).stream()
                .map(workspaceMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(workspaces, "Workspaces fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(@PathVariable UUID id) {
        Workspace ws = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + id));
        accessScopeService.assertCanView(accessScopeService.requireUser(), ws.getId());
        return ResponseEntity.ok(ApiResponse.success(workspaceMapper.toResponse(ws), "Workspace fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
            @RequestBody CreateWorkspaceRequest req) {
        UUID creatorId = currentUserId();
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found: " + creatorId));
        Workspace ws = Workspace.builder()
                .name(req.name())
                .description(req.description())
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        Workspace saved = workspaceRepository.save(ws);
        return ResponseEntity.ok(ApiResponse.success(workspaceMapper.toResponse(saved), "Workspace created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
            @PathVariable UUID id,
            @RequestBody UpdateWorkspaceRequest req) {
        Workspace ws = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + id));
        if (req.name() != null) ws.setName(req.name());
        if (req.description() != null) ws.setDescription(req.description());
        ws.setUpdatedAt(Instant.now());
        Workspace saved = workspaceRepository.save(ws);
        return ResponseEntity.ok(ApiResponse.success(workspaceMapper.toResponse(saved), "Workspace updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable UUID id) {
        if (!workspaceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Workspace not found: " + id);
        }
        workspaceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Workspace deleted successfully"));
    }
}
