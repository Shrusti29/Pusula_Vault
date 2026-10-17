package com.pusula.km.repository;

import com.pusula.km.model.entity.DocumentTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentTagRepository extends JpaRepository<DocumentTag, Long> {
    List<DocumentTag> findByDocumentId(UUID documentId);
    List<DocumentTag> findByTagId(UUID tagId);
}
