package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pv.encryption")
public record EncryptionProperties(String key) {

    @Override
    public String toString() {
        return "EncryptionProperties[key=***]";
    }
}
