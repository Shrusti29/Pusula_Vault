package com.pusula.km.model.entity;

import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_resource_permission", indexes = {
    @Index(name = "idx_rp_grantee", columnList = "grantee_type,grantee_id"),
    @Index(name = "idx_rp_resource", columnList = "resource_type,resource_id,permission")
})
@EntityListeners(AuditingEntityListener.class)
public class ResourcePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GranteeType granteeType;

    @Column(nullable = false)
    private String granteeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false)
    private String resourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Permission permission;

    @Column(nullable = false)
    private boolean allow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @CreatedDate
    private Instant assignedAt;
}
