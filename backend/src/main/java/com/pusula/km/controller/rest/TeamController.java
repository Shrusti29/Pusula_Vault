package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.TeamMapper;
import com.pusula.km.model.dto.AddTeamMemberRequest;
import com.pusula.km.model.dto.CreateTeamRequest;
import com.pusula.km.model.dto.TeamMembershipResponse;
import com.pusula.km.model.dto.TeamResponse;
import com.pusula.km.model.entity.Team;
import com.pusula.km.model.entity.TeamMembership;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.enums.MemberRole;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.TeamMembershipRepository;
import com.pusula.km.repository.TeamRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final TeamMapper teamMapper;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams() {
        List<TeamResponse> teams = teamRepository.findAll().stream()
                .map(teamMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(teams, "Teams fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(@RequestBody CreateTeamRequest req) {
        UUID creatorId = currentUserId();
        Workspace ws = req.workspaceId() != null ? workspaceRepository.findById(req.workspaceId()).orElse(null) : null;
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorId));
        Team team = Team.builder()
                .name(req.name())
                .description(req.description())
                .workspace(ws)
                .createdBy(creator)
                .createdAt(Instant.now())
                .build();
        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(ApiResponse.success(teamMapper.toResponse(saved), "Team created successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<TeamMembershipResponse>>> getMembers(@PathVariable UUID id) {
        List<TeamMembershipResponse> members = teamMembershipRepository.findByTeamId(id).stream()
                .map(m -> new TeamMembershipResponse(
                        m.getTeam() != null ? m.getTeam().getId() : null,
                        m.getUser() != null ? m.getUser().getId() : null,
                        m.getUser() != null ? m.getUser().getDisplayName() : null,
                        m.getMemberRole() != null ? m.getMemberRole().name() : null,
                        m.getJoinedAt()
                )).toList();
        return ResponseEntity.ok(ApiResponse.success(members, "Team members fetched successfully"));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<TeamMembershipResponse>> addMember(
            @PathVariable UUID id,
            @RequestBody AddTeamMemberRequest req) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + id));
        User user = userRepository.findById(req.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + req.userId()));
        MemberRole role;
        try {
            role = MemberRole.valueOf(req.role());
        } catch (IllegalArgumentException e) {
            role = MemberRole.MEMBER;
        }
        TeamMembership tm = TeamMembership.builder()
                .team(team)
                .user(user)
                .memberRole(role)
                .joinedAt(Instant.now())
                .build();
        TeamMembership saved = teamMembershipRepository.save(tm);
        TeamMembershipResponse resp = new TeamMembershipResponse(
                saved.getTeam() != null ? saved.getTeam().getId() : null,
                saved.getUser() != null ? saved.getUser().getId() : null,
                saved.getUser() != null ? saved.getUser().getDisplayName() : null,
                saved.getMemberRole() != null ? saved.getMemberRole().name() : null,
                saved.getJoinedAt()
        );
        return ResponseEntity.ok(ApiResponse.success(resp, "Member added successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        TeamMembership tm = teamMembershipRepository.findByTeamIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Team membership not found"));
        teamMembershipRepository.delete(tm);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }
}
