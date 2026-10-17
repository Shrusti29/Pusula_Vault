package com.pusula.km.controller.rest;

import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.DocumentMapper;
import com.pusula.km.model.dto.CreateDocumentRequest;
import com.pusula.km.model.dto.DocumentResponse;
import com.pusula.km.model.dto.EffectivePermissionsDTO;
import com.pusula.km.model.dto.SaveDraftRequest;
import com.pusula.km.model.dto.UpdateDocumentRequest;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.DocumentVersion;
import com.pusula.km.model.entity.Folder;
import com.pusula.km.model.entity.GovernancePolicy;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.model.enums.DocumentType;
import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.enums.SensitivityLevel;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.PaginatedResponse;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.DocumentVersionRepository;
import com.pusula.km.repository.FolderRepository;
import com.pusula.km.repository.GovernancePolicyRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.service.impl.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentMapper documentMapper;
    private final GovernancePolicyRepository governancePolicyRepository;
    private final AccessScopeService accessScopeService;
    private final AuditService auditService;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<DocumentResponse>>> getDocuments(
            @RequestParam UUID workspaceId,
            @RequestParam(required = false) UUID folderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        accessScopeService.assertCanView(accessScopeService.requireUser(), workspaceId);
        Page<Document> docPage;
        if (folderId != null) {
            docPage = documentRepository.findByWorkspaceIdAndFolderId(workspaceId, folderId, pageable);
        } else {
            docPage = documentRepository.findByWorkspaceId(workspaceId, pageable);
        }
        List<DocumentResponse> content = docPage.getContent().stream().map(documentMapper::toResponse).toList();
        PaginatedResponse<DocumentResponse> paginated = new PaginatedResponse<>(
                content,
                docPage.getTotalElements(),
                docPage.getTotalPages(),
                docPage.getSize(),
                docPage.getNumber(),
                docPage.isFirst(),
                docPage.isLast()
        );
        return ResponseEntity.ok(ApiResponse.success(paginated, "Documents fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(@PathVariable UUID id) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        accessScopeService.assertCanView(accessScopeService.requireUser(), d.getWorkspace().getId());
        User viewer = accessScopeService.requireUser();
        auditService.log(viewer.getId(), viewer.getRole(), com.pusula.km.model.enums.AuditAction.DOCUMENT_VIEWED,
                "Document", d.getId().toString(), d.getTitle(), "127.0.0.1", true, null, null);
        return ResponseEntity.ok(ApiResponse.success(documentMapper.toResponse(d), "Document fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DocumentResponse>> createDocument(
            @RequestBody CreateDocumentRequest req) {
        UUID userId = currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        accessScopeService.assertCanCreate(user, req.workspaceId());
        Workspace ws = workspaceRepository.findById(req.workspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + req.workspaceId()));
        Folder folder = req.folderId() != null ? folderRepository.findById(req.folderId()).orElse(null) : null;

        GovernancePolicy governancePolicy = null;
        if (req.governancePolicyId() != null) {
            governancePolicy = governancePolicyRepository.findById(req.governancePolicyId()).orElse(null);
        }

        Document doc = Document.builder()
                .workspace(ws)
                .folder(folder)
                .title(req.title())
                .content(req.content())
                .contentType(req.contentType() != null ? req.contentType() : "text/plain")
                .documentType(req.documentType() != null ? req.documentType() : DocumentType.TEXT)
                .sensitivityLevel(req.sensitivityLevel() != null ? req.sensitivityLevel() : SensitivityLevel.INTERNAL)
                .governancePolicy(governancePolicy)
                .createdBy(user)
                .updatedBy(user)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .currentVersion(1)
                .status(DocumentStatus.DRAFT)
                .build();
        Document saved = documentRepository.save(doc);
        rememberVersion(saved, user, saved.getContent(), "Created");
        return ResponseEntity.ok(ApiResponse.success(documentMapper.toResponse(saved), "Document created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable UUID id,
            @RequestBody UpdateDocumentRequest req) {
        UUID userId = currentUserId();
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        User updater = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        accessScopeService.assertCanEdit(updater, d.getWorkspace().getId());
        if (changed(d, req.title(), req.content())) {
            rememberVersion(d, updater, d.getContent(), req.changeSummary());
            d.setCurrentVersion((d.getCurrentVersion() != null ? d.getCurrentVersion() : 1) + 1);
        }

        if (req.title() != null) d.setTitle(req.title());
        if (req.content() != null) d.setContent(req.content());
        if (req.status() != null) d.setStatus(req.status());
        d.setUpdatedBy(updater);
        d.setUpdatedAt(Instant.now());

        Document saved = documentRepository.save(d);
        return ResponseEntity.ok(ApiResponse.success(documentMapper.toResponse(saved), "Document updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        Document existing = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        User actor = accessScopeService.requireUser();
        if (accessScopeService.isScopedEmployee(actor)) {
            throw new ForbiddenException("Employees cannot delete documents");
        }
        accessScopeService.assertCanEdit(actor, existing.getWorkspace().getId());
        documentRepository.delete(existing);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully"));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<DocumentResponse>> saveDraft(
            @PathVariable UUID id,
            @RequestBody SaveDraftRequest req) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        User actor = accessScopeService.requireUser();
        accessScopeService.assertCanEdit(actor, d.getWorkspace().getId());
        if (changed(d, req.title(), req.content())) {
            rememberVersion(d, actor, d.getContent(), "Autosave");
            d.setCurrentVersion((d.getCurrentVersion() != null ? d.getCurrentVersion() : 1) + 1);
        }
        if (req.title() != null) d.setTitle(req.title());
        if (req.content() != null) d.setContent(req.content());
        d.setUpdatedBy(actor);
        d.setUpdatedAt(Instant.now());
        Document saved = documentRepository.save(d);
        return ResponseEntity.ok(ApiResponse.success(documentMapper.toResponse(saved), "Draft saved successfully"));
    }

    @PostMapping("/{id}/version")
    public ResponseEntity<ApiResponse<com.pusula.km.model.dto.DocumentVersionResponse>> createVersion(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        UUID userId = currentUserId();
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        User user = userRepository.findById(userId).orElse(null);
        String summary = body != null && body.containsKey("changeSummary") ? String.valueOf(body.get("changeSummary")) : null;
        int nextVer = (d.getCurrentVersion() != null ? d.getCurrentVersion() : 0) + 1;
        DocumentVersion v = DocumentVersion.builder()
                .document(d)
                .versionNumber(nextVer)
                .content(d.getContent())
                .createdBy(user)
                .createdAt(Instant.now())
                .changeSummary(summary)
                .build();
        DocumentVersion saved = documentVersionRepository.save(v);
        d.setCurrentVersion(nextVer);
        documentRepository.save(d);
        com.pusula.km.model.dto.DocumentVersionResponse resp = new com.pusula.km.model.dto.DocumentVersionResponse(
                saved.getId(),
                saved.getDocument() != null ? saved.getDocument().getId() : null,
                saved.getVersionNumber(),
                saved.getContent(),
                saved.getChangeSummary(),
                saved.getContent() != null ? (long) saved.getContent().length() : null,
                saved.getCreatedBy() != null ? saved.getCreatedBy().getId() : null,
                saved.getCreatedAt(),
                saved.isPriority(),
                saved.getPriorityNote()
        );
        return ResponseEntity.ok(ApiResponse.success(resp, "Version created successfully"));
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<EffectivePermissionsDTO>> getPermissions(@PathVariable UUID id) {
        EffectivePermissionsDTO dto = new EffectivePermissionsDTO(
                id.toString(),
                ResourceType.DOCUMENT,
                Set.of(Permission.VIEW, Permission.EDIT, Permission.DOWNLOAD),
                Map.of("owner", Set.of(Permission.MANAGE_ACCESS))
        );
        return ResponseEntity.ok(ApiResponse.success(dto, "Permissions fetched successfully"));
    }

    private boolean changed(Document d, String title, String content) {
        boolean titleChanged = title != null && !title.equals(d.getTitle());
        boolean contentChanged = content != null && !content.equals(d.getContent());
        return titleChanged || contentChanged;
    }

    private void rememberVersion(Document d, User actor, String content, String summary) {
        int number = d.getCurrentVersion() != null ? d.getCurrentVersion() : 1;
        DocumentVersion version = DocumentVersion.builder()
                .document(d)
                .versionNumber(number)
                .content(content)
                .createdBy(actor)
                .createdAt(Instant.now())
                .changeSummary(summary)
                .build();
        documentVersionRepository.save(version);
        auditService.log(actor.getId(), actor.getRole(), com.pusula.km.model.enums.AuditAction.DOCUMENT_EDITED,
                "Document", d.getId().toString(), d.getTitle(), "127.0.0.1", true, null, summary);
    }
}
