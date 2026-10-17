package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.ai")
public record AiProperties(String provider) {
}
