package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.security.honeytoken")
public record HoneytokenProperties(boolean enabled) {
}
