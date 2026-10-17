package com.pusula.km.mapper;

import com.pusula.km.model.dto.TeamResponse;
import com.pusula.km.model.entity.Team;
import org.springframework.stereotype.Component;

@Component
public class TeamMapper {

    public TeamResponse toResponse(Team t) {
        if (t == null) return null;
        return new TeamResponse(
                t.getId(),
                t.getName(),
                t.getDescription(),
                t.getWorkspace() != null ? t.getWorkspace().getId() : null,
                null,
                t.getCreatedAt()
        );
    }
}
