package com.pusula.km.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pusula.km.model.dto.AuditLogResponse;
import com.pusula.km.model.entity.AuditLog;
import com.pusula.km.model.enums.ResourceType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuditLogMapper {

    private final ObjectMapper objectMapper;

    public AuditLogResponse toResponse(AuditLog a) {
        if (a == null) return null;
        ResourceType rt = null;
        try {
            if (a.getEntityType() != null) {
                rt = ResourceType.valueOf(a.getEntityType());
            }
        } catch (IllegalArgumentException ignored) {
        }
        Map<String, Object> prev = parseJson(a.getPreviousState());
        Map<String, Object> newSt = parseJson(a.getNewState());
        return new AuditLogResponse(
                a.getId(),
                a.getAction(),
                a.getActorUserId(),
                null,
                a.getActorRole(),
                a.getSessionId(),
                rt,
                a.getEntityId(),
                a.getEntityName(),
                null,
                a.getIp(),
                a.getUserAgent(),
                a.isSuccess(),
                null,
                prev,
                newSt,
                a.getTimestamp()
        );
    }

    private Map<String, Object> parseJson(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return objectMapper.readValue(s, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }
}
