package com.pusula.km.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_retention_rule")
@EntityListeners(AuditingEntityListener.class)
public class RetentionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private Integer retentionDays;

    @Builder.Default
    private boolean autoArchive = false;

    @Builder.Default
    private boolean autoDelete = false;

    @Column(nullable = false)
    private String applicableDocumentTypes;

    @CreatedDate
    private Instant createdAt;
}
