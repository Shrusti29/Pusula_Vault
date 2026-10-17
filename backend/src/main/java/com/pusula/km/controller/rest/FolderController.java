package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.FolderMapper;
import com.pusula.km.model.dto.CreateFolderRequest;
import com.pusula.km.model.dto.FolderResponse;
import com.pusula.km.model.dto.MoveFolderRequest;
import com.pusula.km.model.entity.Folder;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.FolderRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderRepository folderRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final FolderMapper folderMapper;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getFolders(
            @RequestParam UUID workspaceId,
            @RequestParam(required = false) UUID parentFolderId) {
        List<Folder> folders;
        if (parentFolderId != null) {
            folders = folderRepository.findByWorkspaceIdAndParentFolderId(workspaceId, parentFolderId);
        } else {
            folders = folderRepository.findByWorkspaceId(workspaceId).stream()
                    .filter(f -> f.getParentFolder() == null).toList();
        }
        List<FolderResponse> resp = folders.stream().map(folderMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(resp, "Folders fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> getFolderById(@PathVariable UUID id) {
        Folder f = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(folderMapper.toResponse(f), "Folder fetched successfully"));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getChildren(@PathVariable UUID id) {
        List<FolderResponse> children = folderRepository.findByParentFolderId(id).stream()
                .map(folderMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(children, "Children fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> createFolder(
            @RequestBody CreateFolderRequest req) {
        UUID createdById = currentUserId();
        Workspace workspace = workspaceRepository.findById(req.workspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + req.workspaceId()));
        Folder parent = req.parentFolderId() != null ? folderRepository.findById(req.parentFolderId()).orElse(null) : null;
        User creator = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found: " + createdById));

        Folder folder = Folder.builder()
                .workspace(workspace)
                .parentFolder(parent)
                .name(req.name())
                .createdBy(creator)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Folder saved = folderRepository.save(folder);
        return ResponseEntity.ok(ApiResponse.success(folderMapper.toResponse(saved), "Folder created successfully"));
    }

    @PostMapping("/move")
    public ResponseEntity<ApiResponse<FolderResponse>> moveFolder(@RequestBody MoveFolderRequest req) {
        Folder folder = folderRepository.findById(req.folderId())
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + req.folderId()));
        if (req.targetWorkspaceId() != null) {
            Workspace ws = workspaceRepository.findById(req.targetWorkspaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + req.targetWorkspaceId()));
            folder.setWorkspace(ws);
        }
        Folder newParent = req.targetFolderId() != null ? folderRepository.findById(req.targetFolderId()).orElse(null) : null;
        folder.setParentFolder(newParent);
        folder.setUpdatedAt(Instant.now());
        Folder saved = folderRepository.save(folder);
        return ResponseEntity.ok(ApiResponse.success(folderMapper.toResponse(saved), "Folder moved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(@PathVariable UUID id) {
        if (!folderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Folder not found: " + id);
        }
        folderRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Folder deleted successfully"));
    }
}
