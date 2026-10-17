package com.pusula.km.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.pusula.km.config.GoogleDriveProperties;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.Workspace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleDriveService {

    private final GoogleDriveProperties googleDriveProperties;
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    public void syncDocument(Document document, String content) {
        if (!googleDriveProperties.isEnabled()) {
            log.info("Google Drive sync is disabled");
            return;
        }

        try {
            Drive driveService = getDriveService();
            String rootFolderId = googleDriveProperties.getRootFolderId();
            if (rootFolderId == null || rootFolderId.isEmpty()) {
                log.warn("Google Drive root folder ID not configured, skipping sync");
                return;
            }
            String workspaceFolderId = getOrCreateWorkspaceFolder(driveService, rootFolderId, document.getWorkspace());

            String fileName = document.getTitle() + getExtension(document.getContentType());
            File fileMetadata = new File();
            fileMetadata.setName(fileName);
            fileMetadata.setParents(Collections.singletonList(workspaceFolderId));

            java.io.File tempFile = createTempFile(fileName, content);
            FileContent mediaContent = new FileContent(document.getContentType(), tempFile);

            File uploadedFile = driveService.files()
                    .create(fileMetadata, mediaContent)
                    .setFields("id")
                    .execute();

            log.info("Document synced to Google Drive: {}", uploadedFile.getId());
            Files.deleteIfExists(tempFile.toPath());

        } catch (Exception e) {
            log.error("Failed to sync document to Google Drive", e);
        }
    }

    private Drive getDriveService() throws IOException, GeneralSecurityException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        GoogleCredential credential;
        if (googleDriveProperties.getCredentialsPath() != null && !googleDriveProperties.getCredentialsPath().isEmpty()) {
            credential = GoogleCredential.fromStream(new FileInputStream(googleDriveProperties.getCredentialsPath()))
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));
        } else {
            log.warn("Google Drive credentials path not configured, using default credentials");
            credential = GoogleCredential.getApplicationDefault()
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));
        }

        return new Drive.Builder(httpTransport, JSON_FACTORY, credential)
                .setApplicationName(googleDriveProperties.getApplicationName())
                .build();
    }

    private String getOrCreateWorkspaceFolder(Drive driveService, String parentFolderId, Workspace workspace) throws IOException {
        String folderName = workspace.getName();
        FileList result = driveService.files().list()
                .setQ("mimeType='application/vnd.google-apps.folder' and name='" + folderName + "' and '" + parentFolderId + "' in parents and trashed=false")
                .setFields("files(id, name)")
                .execute();

        if (!result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setParents(Collections.singletonList(parentFolderId));

        File folder = driveService.files().create(folderMetadata)
                .setFields("id")
                .execute();

        return folder.getId();
    }

    private java.io.File createTempFile(String fileName, String content) throws IOException {
        Path tempDir = Files.createTempDirectory("pusula-drive");
        java.io.File tempFile = tempDir.resolve(fileName).toFile();
        Files.writeString(tempFile.toPath(), content);
        return tempFile;
    }

    private String getExtension(String contentType) {
        if (contentType == null) return ".txt";
        return switch (contentType.toLowerCase()) {
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> ".pptx";
            case "application/pdf" -> ".pdf";
            case "text/plain" -> ".txt";
            default -> ".txt";
        };
    }
}
