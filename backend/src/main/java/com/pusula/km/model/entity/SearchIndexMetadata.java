package com.pusula.km.model.entity;

import com.pusula.km.model.enums.ResourceType;
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
@Table(name = "pv_search_index_metadata", indexes = {
    @Index(name = "idx_sim_resource", columnList = "resource_type,resource_id,last_indexed_at")
})
public class SearchIndexMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false)
    private String resourceId;

    private Integer chunkCount;

    private String embeddingProvider;

    private String vectorStoreRef;

    private Instant lastIndexedAt;

    private String fingerprint;
}
