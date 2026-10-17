package com.pusula.km.repository;

import com.pusula.km.model.entity.FileAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileAssetRepository extends JpaRepository<FileAsset, UUID> {
    List<FileAsset> findByDocumentId(UUID documentId);
    Optional<FileAsset> findByStorageKey(String storageKey);
    Page<FileAsset> findByDocumentId(UUID documentId, Pageable pageable);
}
