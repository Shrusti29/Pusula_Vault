package com.pusula.km.repository;

import com.pusula.km.model.entity.SearchIndexMetadata;
import com.pusula.km.model.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SearchIndexMetadataRepository extends JpaRepository<SearchIndexMetadata, UUID> {
    Optional<SearchIndexMetadata> findByResourceTypeAndResourceId(ResourceType resourceType, String resourceId);
}
