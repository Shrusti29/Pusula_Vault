package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.security.authz")
public record AuthzProperties(boolean denyWinsByDefault) {
}
