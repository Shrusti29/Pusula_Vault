package com.pusula.km.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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

    @JsonProperty("retentionDays")
    public Integer getRetentionDaysCamel() { return retentionDays; }

    @JsonProperty("retention_days")
    public Integer getRetentionDaysSnake() { return retentionDays; }

    @JsonProperty("autoArchive")
    public boolean isAutoArchiveCamel() { return autoArchive; }

    @JsonProperty("auto_archive")
    public boolean isAutoArchiveSnake() { return autoArchive; }

    @JsonProperty("autoDelete")
    public boolean isAutoDeleteCamel() { return autoDelete; }

    @JsonProperty("auto_delete")
    public boolean isAutoDeleteSnake() { return autoDelete; }

    @JsonProperty("applicableDocumentTypes")
    public String getApplicableDocumentTypesCamel() { return applicableDocumentTypes; }

    @JsonProperty("applicable_document_types")
    public String getApplicableDocumentTypesSnake() { return applicableDocumentTypes; }

    @CreatedDate
    private Instant createdAt;
}
