package com.pusula.km.model.entity;

import com.pusula.km.model.enums.SensitivityLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_governance_policy", indexes = {
    @Index(name = "idx_policy_active", columnList = "active")
})
@EntityListeners(AuditingEntityListener.class)
public class GovernancePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SensitivityLevel sensitivityLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retention_rule_id")
    private RetentionRule retentionRule;

    @Column(nullable = false)
    private String policyText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean enforceOnCreate = true;

    @Builder.Default
    private boolean enforceOnEdit = true;

    @Builder.Default
    private boolean requireApproval = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
