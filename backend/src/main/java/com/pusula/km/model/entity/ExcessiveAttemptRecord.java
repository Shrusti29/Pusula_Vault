package com.pusula.km.model.entity;

import com.pusula.km.model.enums.ResourceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_excessive_attempt", indexes = {
    @Index(name = "idx_ea_actor_action_window", columnList = "actor_user_id,action,window_start")
})
public class ExcessiveAttemptRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private UUID actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false)
    private String resourceId;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private Instant windowStart;

    @Column(nullable = false)
    private Integer deniedCount;
}
