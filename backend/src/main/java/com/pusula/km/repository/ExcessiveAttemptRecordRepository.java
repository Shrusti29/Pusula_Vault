package com.pusula.km.repository;

import com.pusula.km.model.entity.ExcessiveAttemptRecord;
import com.pusula.km.model.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExcessiveAttemptRecordRepository extends JpaRepository<ExcessiveAttemptRecord, Long> {
    Optional<ExcessiveAttemptRecord> findByActorUserIdAndActionAndWindowStartAfter(UUID actorUserId, String action, Instant windowStart);
}
