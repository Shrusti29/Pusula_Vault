package com.pusula.km.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_ai_interaction")
@EntityListeners(AuditingEntityListener.class)
public class AiInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String type;

    private String providerName;

    private String modelName;

    private Integer promptTokens;

    private Integer completionTokens;

    @Lob
    private String inputSnippet;

    @Lob
    private String outputSnippet;

    @Builder.Default
    private boolean inputTokensTruncated = false;

    private Long durationMs;

    @CreatedDate
    private Instant createdAt;

    private UUID targetDocumentId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String citations;
}
