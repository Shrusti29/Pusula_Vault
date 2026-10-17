package com.pusula.km.controller.rest;

import com.pusula.km.mapper.AuditLogMapper;
import com.pusula.km.model.dto.AuditFilterRequest;
import com.pusula.km.model.dto.AuditLogResponse;
import com.pusula.km.model.entity.AuditLog;
import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.PaginatedResponse;
import com.pusula.km.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('FOUNDER')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) AuditAction[] action,
            @RequestParam(required = false) ResourceType resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Boolean success,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLog> all = auditLogRepository.findAll(pageable);

        Stream<AuditLog> stream = all.getContent().stream();
        if (actorId != null) stream = stream.filter(a -> actorId.equals(a.getActorUserId()));
        if (action != null && action.length > 0) {
            List<AuditAction> acts = List.of(action);
            stream = stream.filter(a -> acts.contains(a.getAction()));
        }
        if (resourceType != null) {
            String rt = resourceType.name();
            stream = stream.filter(a -> rt.equals(a.getEntityType()));
        }
        if (resourceId != null) stream = stream.filter(a -> resourceId.equals(a.getEntityId()));
        if (success != null) stream = stream.filter(a -> success == a.isSuccess());
        if (from != null) stream = stream.filter(a -> a.getTimestamp() != null && !a.getTimestamp().isBefore(from));
        if (to != null) stream = stream.filter(a -> a.getTimestamp() != null && !a.getTimestamp().isAfter(to));

        List<AuditLogResponse> filtered = stream.map(auditLogMapper::toResponse).toList();

        PaginatedResponse<AuditLogResponse> paginated = new PaginatedResponse<>(
                filtered,
                filtered.size(),
                size > 0 ? (int) Math.ceil((double) filtered.size() / size) : 0,
                size,
                page,
                page == 0,
                true
        );
        return ResponseEntity.ok(ApiResponse.success(paginated, "Audit logs fetched successfully"));
    }
}
