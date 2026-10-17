package com.pusula.km.repository;

import com.pusula.km.model.entity.AuditLog;
import com.pusula.km.model.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByActorUserId(UUID actorUserId, Pageable pageable);
    Page<AuditLog> findByAction(AuditAction action, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(Instant start, Instant end, Pageable pageable);
}
