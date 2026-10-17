package com.pusula.km.model.request;

public record LoginRequest(
        String username,
        String password,
        String deviceId,
        String deviceLabel
) {}
