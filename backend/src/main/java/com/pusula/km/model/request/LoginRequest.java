package com.pusula.km.model.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @JsonProperty("email") @NotBlank @Email String email,
        @JsonProperty("password") @NotBlank @Size(min = 8, max = 128) String password,
        @JsonProperty("deviceId") @JsonAlias({"device_id", "device", "client_device_id"}) String deviceId,
        @JsonProperty("deviceLabel") @JsonAlias({"device_label", "label", "userAgent"}) String deviceLabel
) {}
