package com.pusula.km.repository;

import com.pusula.km.model.entity.WorkPresence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkPresenceRepository extends JpaRepository<WorkPresence, UUID> {
    Optional<WorkPresence> findByUserId(UUID userId);
}
