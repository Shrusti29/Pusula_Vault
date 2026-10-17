package com.pusula.km.model.entity;

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
@Table(name = "pv_progress_report")
public class ProgressReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String period;

    private Instant periodStart;
    private Instant periodEnd;

    @Lob
    @Column(nullable = false)
    private String generatedSummary;

    @Lob
    private String authorNotes;

    private UUID createdBy;
    private Instant createdAt;
}
