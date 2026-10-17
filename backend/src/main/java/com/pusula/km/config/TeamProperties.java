package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.team")
public record TeamProperties(boolean enabled) {
}
