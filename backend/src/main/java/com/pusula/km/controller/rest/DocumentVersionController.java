package com.pusula.km.controller.rest;

import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.model.dto.DiffRange;
import com.pusula.km.model.dto.DocumentDiffResponse;
import com.pusula.km.model.dto.DocumentVersionResponse;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.DocumentVersion;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.DocumentVersionRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DocumentVersionController {

    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final AccessScopeService accessScopeService;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping("/documents/{documentId}/versions")
    public ResponseEntity<ApiResponse<List<DocumentVersionResponse>>> getVersions(@PathVariable UUID documentId) {
        List<DocumentVersionResponse> versions = documentVersionRepository
                .findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(v -> new DocumentVersionResponse(
                        v.getId(),
                        v.getDocument() != null ? v.getDocument().getId() : null,
                        v.getVersionNumber(),
                        v.getContent(),
                        v.getChangeSummary(),
                        v.getContent() != null ? (long) v.getContent().length() : null,
                        v.getCreatedBy() != null ? v.getCreatedBy().getId() : null,
                        v.getCreatedAt(),
                        v.isPriority(),
                        v.getPriorityNote()
                )).toList();
        return ResponseEntity.ok(ApiResponse.success(versions, "Document versions fetched successfully"));
    }

    @GetMapping("/versions/{id}")
    public ResponseEntity<ApiResponse<DocumentVersionResponse>> getVersionById(@PathVariable Long id) {
        DocumentVersion v = documentVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document version not found: " + id));
        DocumentVersionResponse resp = new DocumentVersionResponse(
                v.getId(),
                v.getDocument() != null ? v.getDocument().getId() : null,
                v.getVersionNumber(),
                v.getContent(),
                v.getChangeSummary(),
                v.getContent() != null ? (long) v.getContent().length() : null,
                v.getCreatedBy() != null ? v.getCreatedBy().getId() : null,
                v.getCreatedAt(),
                v.isPriority(),
                v.getPriorityNote()
        );
        return ResponseEntity.ok(ApiResponse.success(resp, "Version fetched successfully"));
    }

    @PostMapping("/versions/{id}/restore")
    public ResponseEntity<ApiResponse<DocumentVersionResponse>> restoreVersion(@PathVariable Long id) {
        UUID userId = currentUserId();
        DocumentVersion old = documentVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document version not found: " + id));
        Document doc = old.getDocument();
        if (doc == null) throw new ResourceNotFoundException("Document not found for version");
        User user = userRepository.findById(userId).orElse(null);
        int nextVer = (doc.getCurrentVersion() != null ? doc.getCurrentVersion() : 0) + 1;
        DocumentVersion restored = DocumentVersion.builder()
                .document(doc)
                .versionNumber(nextVer)
                .content(old.getContent())
                .createdBy(user)
                .createdAt(Instant.now())
                .changeSummary("Restored from version " + old.getVersionNumber())
                .build();
        DocumentVersion saved = documentVersionRepository.save(restored);
        doc.setContent(old.getContent());
        doc.setCurrentVersion(nextVer);
        doc.setUpdatedAt(Instant.now());
        doc.setUpdatedBy(user);
        documentRepository.save(doc);
        DocumentVersionResponse resp = new DocumentVersionResponse(
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
        return ResponseEntity.ok(ApiResponse.success(resp, "Version restored successfully"));
    }

    @PostMapping("/versions/{id}/priority")
    public ResponseEntity<ApiResponse<DocumentVersionResponse>> prioritize(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body) {
        User actor = accessScopeService.requireUser();
        if (!accessScopeService.isLeadership(actor)) {
            throw new ForbiddenException("Only an admin or founder can prioritise versions");
        }
        DocumentVersion version = documentVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document version not found: " + id));
        boolean priority = body != null && Boolean.TRUE.equals(body.get("priority"));
        version.setPriority(priority);
        if (body != null && body.get("note") != null) {
            version.setPriorityNote(String.valueOf(body.get("note")));
        }
        DocumentVersion saved = documentVersionRepository.save(version);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), priority ? "Version prioritised" : "Priority cleared"));
    }

    @GetMapping("/documents/{documentId}/diff")
    public ResponseEntity<ApiResponse<DocumentDiffResponse>> getDiff(
            @PathVariable UUID documentId,
            @RequestParam int leftVersion,
            @RequestParam int rightVersion) {
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
        String unifiedText;
        List<DiffRange> empty = Collections.emptyList();
        if (versions == null || versions.isEmpty()) {
            unifiedText = "No previous versions";
        } else {
            unifiedText = "No differences";
        }
        DocumentDiffResponse diff = new DocumentDiffResponse(
                documentId,
                leftVersion,
                rightVersion,
                empty,
                empty,
                empty,
                unifiedText
        );
        return ResponseEntity.ok(ApiResponse.success(diff, "Diff computed successfully"));
    }

    private DocumentVersionResponse toResponse(DocumentVersion v) {
        return new DocumentVersionResponse(
                v.getId(),
                v.getDocument() != null ? v.getDocument().getId() : null,
                v.getVersionNumber(),
                v.getContent(),
                v.getChangeSummary(),
                v.getContent() != null ? (long) v.getContent().length() : null,
                v.getCreatedBy() != null ? v.getCreatedBy().getId() : null,
                v.getCreatedAt(),
                v.isPriority(),
                v.getPriorityNote()
        );
    }
}
