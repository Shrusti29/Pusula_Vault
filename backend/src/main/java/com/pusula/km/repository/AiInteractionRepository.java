package com.pusula.km.repository;

import com.pusula.km.model.entity.AiInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiInteractionRepository extends JpaRepository<AiInteraction, UUID> {
    List<AiInteraction> findByUserId(UUID userId);
}
