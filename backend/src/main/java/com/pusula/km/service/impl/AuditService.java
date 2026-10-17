package com.pusula.km.service.impl;

import com.pusula.km.model.entity.AuditLog;
import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(UUID actorUserId, Role actorRole, AuditAction action, String entityType, String entityId, String entityName, String ip, boolean success, String previousState, String newState) {
        AuditLog log = AuditLog.builder()
                .actorUserId(actorUserId)
                .actorRole(actorRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .ip(ip)
                .success(success)
                .previousState(previousState)
                .newState(newState)
                .timestamp(Instant.now())
                .build();
        auditLogRepository.save(log);
    }
}
