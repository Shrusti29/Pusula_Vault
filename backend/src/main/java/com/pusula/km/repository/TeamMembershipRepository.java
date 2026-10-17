package com.pusula.km.repository;

import com.pusula.km.model.entity.TeamMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMembershipRepository extends JpaRepository<TeamMembership, Long> {
    List<TeamMembership> findByTeamId(UUID teamId);
    List<TeamMembership> findByUserId(UUID userId);
    Optional<TeamMembership> findByTeamIdAndUserId(UUID teamId, UUID userId);
}
