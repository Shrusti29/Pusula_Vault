package com.pusula.km.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pusula.km.model.dto.SecurityEventResponse;
import com.pusula.km.model.entity.SecurityEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SecurityEventMapper {

    private final ObjectMapper objectMapper;

    public SecurityEventResponse toResponse(SecurityEvent e) {
        if (e == null) return null;
        Map<String, Object> meta = parseJson(e.getDetails());
        return new SecurityEventResponse(
                e.getId(),
                e.getEventType(),
                e.getSeverity(),
                e.getActorUserId(),
                null,
                e.getResourceType(),
                e.getResourceId(),
                meta != null && meta.containsKey("description") ? String.valueOf(meta.get("description")) : null,
                meta,
                e.getDetectedAt(),
                e.getReviewedAt()
        );
    }

    private Map<String, Object> parseJson(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return objectMapper.readValue(s, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return null;
        }
    }
}
