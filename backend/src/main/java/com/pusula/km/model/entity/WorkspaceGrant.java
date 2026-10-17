package com.pusula.km.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_workspace_grant", uniqueConstraints = {
        @UniqueConstraint(name = "uk_grant_user_ws", columnNames = {"user_id", "workspace_id"})
})
public class WorkspaceGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Builder.Default
    private boolean canEdit = true;

    @Builder.Default
    private boolean canCreate = true;
}
