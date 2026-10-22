package com.pusula.km.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.dto.UserResponse;
import com.pusula.km.model.enums.Role;

import java.util.List;
import java.util.UUID;

public record LoginResponse(
        @JsonProperty("token") String token,
        @JsonProperty("user") UserResponse user,
        @JsonProperty("visibleWorkspaceIds") List<UUID> visibleWorkspaceIds,
        @JsonProperty("role") Role role,
        @JsonProperty("deviceStatus") String deviceStatus,
        @JsonProperty("deviceMessage") String deviceMessage
) {
    @JsonProperty("visible_workspace_ids")
    public List<UUID> getVisibleWorkspaceIdsAlias() { return visibleWorkspaceIds; }

    @JsonProperty("device_status")
    public String getDeviceStatusAlias() { return deviceStatus; }

    @JsonProperty("device_message")
    public String getDeviceMessageAlias() { return deviceMessage; }
}
