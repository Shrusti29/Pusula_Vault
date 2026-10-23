package com.pusula.km.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RetentionRule retentionRule;

    @Column(nullable = false)
    private String policyText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "featurePermissions"})
    private User createdBy;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean enforceOnCreate = true;

    @Builder.Default
    private boolean enforceOnEdit = true;

    @Builder.Default
    private boolean requireApproval = false;

    @JsonProperty("policyText")
    public String getPolicyTextCamel() { return policyText; }

    @JsonProperty("policy_text")
    public String getPolicyTextSnake() { return policyText; }

    @JsonProperty("sensitivityLevel")
    public SensitivityLevel getSensitivityLevelCamel() { return sensitivityLevel; }

    @JsonProperty("sensitivity_level")
    public SensitivityLevel getSensitivityLevelSnake() { return sensitivityLevel; }

    @JsonProperty("enforceOnCreate")
    public boolean isEnforceOnCreateCamel() { return enforceOnCreate; }

    @JsonProperty("enforce_on_create")
    public boolean isEnforceOnCreateSnake() { return enforceOnCreate; }

    @JsonProperty("enforceOnEdit")
    public boolean isEnforceOnEditCamel() { return enforceOnEdit; }

    @JsonProperty("enforce_on_edit")
    public boolean isEnforceOnEditSnake() { return enforceOnEdit; }

    @JsonProperty("requireApproval")
    public boolean isRequireApprovalCamel() { return requireApproval; }

    @JsonProperty("require_approval")
    public boolean isRequireApprovalSnake() { return requireApproval; }

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
