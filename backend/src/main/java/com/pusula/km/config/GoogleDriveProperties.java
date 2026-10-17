package com.pusula.km.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "pv.google.drive")
public class GoogleDriveProperties {
    private boolean enabled = false;
    private String credentialsPath;
    private String applicationName = "Pusula Vault";
    private String rootFolderId;
    private String rootFolderName = "Pusula_Vault_Exports";
    private String serviceAccountEmail = "gummyyybear6666@gmail.com";
}
