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
@Table(name = "pv_work_presence", uniqueConstraints = {
        @UniqueConstraint(name = "uk_presence_user", columnNames = "user_id")
})
public class WorkPresence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    private UUID documentId;
    private UUID workspaceId;
    private String documentTitle;
    private Instant lastSeenAt;
}
