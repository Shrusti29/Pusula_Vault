package com.pusula.km.controller.rest;

import com.pusula.km.model.dto.SearchResultItem;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.FileAsset;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.PaginatedResponse;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.FileAssetRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final DocumentRepository documentRepository;
    private final FileAssetRepository fileAssetRepository;
    private final WorkspaceRepository workspaceRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<SearchResultItem>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean semantic) {
        List<SearchResultItem> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String qq = q != null ? q.toLowerCase() : "";
        int limit = 50;

        if (type == null || type.equalsIgnoreCase("DOCUMENT")) {
            for (Document d : documentRepository.findAll()) {
                if (items.size() >= limit) break;
                if (workspaceId != null && (d.getWorkspace() == null || !workspaceId.equals(d.getWorkspace().getId()))) continue;
                boolean match = qq.isEmpty()
                        || (d.getTitle() != null && d.getTitle().toLowerCase().contains(qq))
                        || (d.getContent() != null && d.getContent().toLowerCase().contains(qq));
                String key = "DOC:" + d.getId();
                if (match && seen.add(key)) {
                    String snippet = "";
                    if (d.getContent() != null) {
                        snippet = d.getContent().length() > 200 ? d.getContent().substring(0, 200) : d.getContent();
                    }
                    items.add(new SearchResultItem(
                            ResourceType.DOCUMENT,
                            d.getId().toString(),
                            d.getWorkspace() != null ? d.getWorkspace().getId() : null,
                            d.getTitle(),
                            snippet,
                            d.getCreatedBy() != null ? d.getCreatedBy().getDisplayName() : null,
                            d.getUpdatedAt() != null ? d.getUpdatedAt() : (d.getCreatedAt() != null ? d.getCreatedAt() : Instant.now()),
                            d.getCurrentVersion(),
                            d.getWorkspace() != null ? d.getWorkspace().getName() : null,
                            new ArrayList<>(),
                            1.0
                    ));
                }
            }
        }

        if (type == null || type.equalsIgnoreCase("ASSET")) {
            for (FileAsset a : fileAssetRepository.findAll()) {
                if (items.size() >= limit) break;
                boolean match = qq.isEmpty()
                        || (a.getFileName() != null && a.getFileName().toLowerCase().contains(qq));
                UUID aWorkspaceId = null;
                String wsName = null;
                if (a.getDocument() != null && a.getDocument().getWorkspace() != null) {
                    aWorkspaceId = a.getDocument().getWorkspace().getId();
                    wsName = a.getDocument().getWorkspace().getName();
                }
                if (workspaceId != null && !workspaceId.equals(aWorkspaceId)) continue;
                String key = "ASSET:" + a.getId();
                if (match && seen.add(key)) {
                    items.add(new SearchResultItem(
                            ResourceType.ASSET,
                            a.getId().toString(),
                            aWorkspaceId,
                            a.getFileName(),
                            a.getMimeType() != null ? a.getMimeType() : "",
                            a.getUploadedBy() != null ? a.getUploadedBy().getDisplayName() : null,
                            a.getCreatedAt() != null ? a.getCreatedAt() : Instant.now(),
                            null,
                            wsName,
                            new ArrayList<>(),
                            0.9
                    ));
                }
            }
        }

        if (type == null || type.equalsIgnoreCase("WORKSPACE")) {
            for (Workspace w : workspaceRepository.findAll()) {
                if (items.size() >= limit) break;
                if (workspaceId != null && !workspaceId.equals(w.getId())) continue;
                boolean match = qq.isEmpty()
                        || (w.getName() != null && w.getName().toLowerCase().contains(qq))
                        || (w.getDescription() != null && w.getDescription().toLowerCase().contains(qq));
                String key = "WS:" + w.getId();
                if (match && seen.add(key)) {
                    items.add(new SearchResultItem(
                            ResourceType.WORKSPACE,
                            w.getId().toString(),
                            w.getId(),
                            w.getName(),
                            w.getDescription() != null ? w.getDescription() : "",
                            w.getCreatedBy() != null ? w.getCreatedBy().getDisplayName() : null,
                            w.getUpdatedAt() != null ? w.getUpdatedAt() : (w.getCreatedAt() != null ? w.getCreatedAt() : Instant.now()),
                            null,
                            w.getName(),
                            new ArrayList<>(),
                            0.8
                    ));
                }
            }
        }

        int total = items.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<SearchResultItem> pageContent = items.subList(from, to);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        PaginatedResponse<SearchResultItem> paginated = new PaginatedResponse<>(
                pageContent,
                total,
                totalPages,
                size,
                page,
                page == 0,
                page >= totalPages - 1
        );
        return ResponseEntity.ok(ApiResponse.success(paginated, "Search completed successfully"));
    }
}
