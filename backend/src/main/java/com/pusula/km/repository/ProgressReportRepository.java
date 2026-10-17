package com.pusula.km.repository;

import com.pusula.km.model.entity.ProgressReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProgressReportRepository extends JpaRepository<ProgressReport, UUID> {
    List<ProgressReport> findAllByOrderByCreatedAtDesc();
}
