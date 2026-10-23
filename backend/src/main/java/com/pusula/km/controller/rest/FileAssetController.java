package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.StorageException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.FileAssetMapper;
import com.pusula.km.model.dto.FileAssetResponse;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.FileAsset;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.PaginatedResponse;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.FileAssetRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.entity.Folder;
import com.pusula.km.repository.WorkspaceRepository;
import com.pusula.km.repository.FolderRepository;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileAssetController {

    private final StorageService storageService;
    private final FileAssetRepository fileAssetRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final com.pusula.km.repository.DocumentVersionRepository documentVersionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FolderRepository folderRepository;
    private final FileAssetMapper fileAssetMapper;
    private final AccessScopeService accessScopeService;
    private final com.pusula.km.service.impl.AuditService auditService;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileAssetResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "workspaceId", required = false) UUID workspaceId,
            @RequestParam(value = "documentId", required = false) UUID documentId,
            @RequestParam(value = "folderId", required = false) UUID folderId,
            @RequestParam(defaultValue = "false") boolean encrypt) {
        try {
            UUID userId = currentUserId();
            String subDir = "assets";
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf('.') + 1) : "txt";

            InputStream is = file.getInputStream();
            String storageKey = storageService.store(is, file.getContentType(), file.getSize(), subDir, extension, encrypt);
            String checksum = storageService.computeChecksum(storageKey);

            User user = userRepository.findById(userId).orElse(null);
            Document doc = documentId != null ? documentRepository.findById(documentId).orElse(null) : null;
            Workspace ws = workspaceId != null ? workspaceRepository.findById(workspaceId).orElse(null) : (doc != null ? doc.getWorkspace() : null);
            Folder folder = folderId != null ? folderRepository.findById(folderId).orElse(null) : (doc != null ? doc.getFolder() : null);

            if (doc == null && ws != null) {
                com.pusula.km.model.enums.DocumentType docType;
                String extLower = extension.toLowerCase();
                if (extLower.equals("pdf")) {
                    docType = com.pusula.km.model.enums.DocumentType.PDF;
                } else if (extLower.equals("docx") || extLower.equals("doc")) {
                    docType = com.pusula.km.model.enums.DocumentType.WORD;
                } else if (extLower.equals("xlsx") || extLower.equals("xls") || extLower.equals("csv")) {
                    docType = com.pusula.km.model.enums.DocumentType.EXCEL;
                } else if (extLower.equals("pptx") || extLower.equals("ppt")) {
                    docType = com.pusula.km.model.enums.DocumentType.POWERPOINT;
                } else {
                    docType = com.pusula.km.model.enums.DocumentType.TEXT;
                }

                String docContent = "Uploaded document: " + originalFilename;
                if (file.getContentType() != null && (file.getContentType().startsWith("text/") || extLower.equals("txt") || extLower.equals("md") || extLower.equals("csv"))) {
                    try {
                        String text = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
                        if (!text.isBlank()) {
                            docContent = text;
                        }
                    } catch (Exception ignored) {}
                }

                Document newDoc = Document.builder()
                        .title(originalFilename != null ? originalFilename : "Uploaded Document")
                        .workspace(ws)
                        .folder(folder)
                        .documentType(docType)
                        .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                        .content(docContent)
                        .status(com.pusula.km.model.enums.DocumentStatus.ACTIVE)
                        .sensitivityLevel(com.pusula.km.model.enums.SensitivityLevel.INTERNAL)
                        .createdBy(user)
                        .updatedBy(user)
                        .build();

                doc = documentRepository.save(newDoc);

                com.pusula.km.model.entity.DocumentVersion v1 = com.pusula.km.model.entity.DocumentVersion.builder()
                        .document(doc)
                        .versionNumber(1)
                        .content(docContent)
                        .changeSummary("Initial upload of " + originalFilename)
                        .createdBy(user)
                        .build();
                documentVersionRepository.save(v1);

                if (user != null) {
                    auditService.log(user.getId(), user.getRole(), com.pusula.km.model.enums.AuditAction.DOCUMENT_CREATED,
                            "Document", doc.getId().toString(), doc.getTitle(), "127.0.0.1", true, null, "Created via file upload");
                }
            }

            FileAsset asset = FileAsset.builder()
                    .document(doc)
                    .workspace(ws)
                    .folder(folder)
                    .fileName(originalFilename != null ? originalFilename : "unnamed")
                    .fileType(extension)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageKey(storageKey)
                    .checksum(checksum)
                    .uploadedBy(user)
                    .encrypted(encrypt)
                    .build();

            FileAsset saved = fileAssetRepository.save(asset);

            if (user != null) {
                auditService.log(user.getId(), user.getRole(), com.pusula.km.model.enums.AuditAction.FILE_UPLOADED,
                        "FileAsset", saved.getId().toString(), saved.getFileName(), "127.0.0.1", true, null, "Uploaded to workspace");
            }

            return ResponseEntity.ok(ApiResponse.success(fileAssetMapper.toResponse(saved), "File uploaded successfully"));
        } catch (com.pusula.km.exception.ValidationException | StorageException e) {
            throw e;
        } catch (Exception e) {
            throw new StorageException("File upload failed: " + e.getMessage(), e);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<FileAssetResponse>>> getFiles(
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) UUID folderId,
            @RequestParam(required = false) UUID documentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<FileAsset> all = fileAssetRepository.findAll();
        List<FileAsset> filtered = new ArrayList<>();
        for (FileAsset a : all) {
            boolean match = true;
            if (workspaceId != null) {
                UUID aWsId = a.getWorkspace() != null ? a.getWorkspace().getId() : (a.getDocument() != null && a.getDocument().getWorkspace() != null ? a.getDocument().getWorkspace().getId() : null);
                if (aWsId == null || !workspaceId.equals(aWsId)) match = false;
            }
            if (folderId != null) {
                UUID aFolderId = a.getFolder() != null ? a.getFolder().getId() : (a.getDocument() != null && a.getDocument().getFolder() != null ? a.getDocument().getFolder().getId() : null);
                if (aFolderId == null || !folderId.equals(aFolderId)) match = false;
            }
            if (documentId != null) {
                if (a.getDocument() == null || !documentId.equals(a.getDocument().getId())) match = false;
            }
            if (match) filtered.add(a);
        }
        int total = filtered.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<FileAsset> pageContent = filtered.subList(from, to);
        List<FileAssetResponse> content = pageContent.stream().map(fileAssetMapper::toResponse).toList();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        PaginatedResponse<FileAssetResponse> paginated = new PaginatedResponse<>(
                content,
                total,
                totalPages,
                size,
                page,
                page == 0,
                page >= totalPages - 1
        );
        return ResponseEntity.ok(ApiResponse.success(paginated, "Files fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileAssetResponse>> getFileById(@PathVariable UUID id) {
        FileAsset asset = fileAssetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(fileAssetMapper.toResponse(asset), "File fetched successfully"));
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<InputStreamResource> previewFile(@PathVariable UUID id) {
        FileAsset asset = fileAssetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + id));
        InputStream is = storageService.load(asset.getStorageKey());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.getMimeType() != null ? asset.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(new InputStreamResource(is));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable UUID id) {
        if (!accessScopeService.canDownload(accessScopeService.requireUser())) {
            throw new ForbiddenException("Downloads are not allowed for this role");
        }
        FileAsset asset = fileAssetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + id));
        InputStream is = storageService.load(asset.getStorageKey());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + asset.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(asset.getMimeType() != null ? asset.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(new InputStreamResource(is));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable UUID id) {
        if (!fileAssetRepository.existsById(id)) {
            throw new ResourceNotFoundException("File not found: " + id);
        }
        fileAssetRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "File deleted successfully"));
    }
}
