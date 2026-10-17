package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.audit")
public record AuditProperties(boolean capturePreviousState) {
}
