package com.pusula.km.model.entity;

import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.enums.Role;
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
@Table(name = "pv_audit_log", indexes = {
    @Index(name = "idx_audit_actor_time", columnList = "actor_user_id,timestamp DESC"),
    @Index(name = "idx_audit_action_time", columnList = "action,timestamp DESC"),
    @Index(name = "idx_audit_entity", columnList = "entity_type,entity_id")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID actorUserId;

    @Enumerated(EnumType.STRING)
    private Role actorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    private String entityType;

    private String entityId;

    private String entityName;

    private String ip;

    private String userAgent;

    private String sessionId;

    @Builder.Default
    private boolean success = true;

    @Column(columnDefinition = "TEXT")
    private String previousState;

    @Column(columnDefinition = "TEXT")
    private String newState;

    @Column(nullable = false)
    private Instant timestamp;
}
