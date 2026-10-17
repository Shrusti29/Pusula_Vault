package com.pusula.km.model.entity;

import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.model.enums.DocumentType;
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
@Table(name = "pv_document", indexes = {
    @Index(name = "idx_doc_ws_folder_status", columnList = "workspace_id,folder_id,status")
})
@EntityListeners(AuditingEntityListener.class)
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @Column(nullable = false)
    private String title;

    @Lob
    private String content;

    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DocumentType documentType = DocumentType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SensitivityLevel sensitivityLevel = SensitivityLevel.INTERNAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "governance_policy_id")
    private GovernancePolicy governancePolicy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Builder.Default
    private Integer currentVersion = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.DRAFT;

    @Version Long version;
}
