package com.pusula.km.model.entity;

import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.enums.SecurityEventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_security_event", indexes = {
    @Index(name = "idx_sev_event_time", columnList = "event_type,detected_at DESC")
})
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecurityEventType eventType;

    @Builder.Default
    private String severity = "INFO";

    private UUID actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false)
    private String resourceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String details;

    @Column(nullable = false)
    private Instant detectedAt;

    private Instant reviewedAt;

    private UUID reviewedBy;
}
