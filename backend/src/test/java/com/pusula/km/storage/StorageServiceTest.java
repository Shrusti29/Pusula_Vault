package com.pusula.km.storage;

import com.pusula.km.config.EncryptionProperties;
import com.pusula.km.config.StorageProperties;
import com.pusula.km.storage.encryption.Aes256GcmFileEncryption;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class StorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalDriveStorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        StorageProperties storageProperties = new StorageProperties(tempDir.toString());
        EncryptionProperties encryptionProperties = new EncryptionProperties(null); // autogenerate fallback key
        Aes256GcmFileEncryption fileEncryption = new Aes256GcmFileEncryption(encryptionProperties);
        
        storageService = new LocalDriveStorageServiceImpl(storageProperties, fileEncryption);
        storageService.init();
    }

    @Test
    void testInitCreatesDirectories() {
        String[] subDirs = {"documents", "assets", "versions", "exports", "temp", "backups"};
        for (String subDir : subDirs) {
            assertTrue(Files.isDirectory(tempDir.resolve(subDir)), "Subdirectory " + subDir + " should exist");
        }
    }

    @Test
    void testStoreAndLoadUnencrypted() throws Exception {
        String data = "Hello, Pusula Vault!";
        InputStream inputStream = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));

        String key = storageService.store(inputStream, "text/plain", data.length(), "assets", "txt", false);
        
        assertNotNull(key);
        assertTrue(key.startsWith("assets/"));
        assertTrue(key.endsWith(".txt"));

        InputStream loadedStream = storageService.load(key);
        byte[] loadedBytes = loadedStream.readAllBytes();
        String loadedData = new String(loadedBytes, StandardCharsets.UTF_8);

        assertEquals(data, loadedData);
    }

    @Test
    void testStoreAndLoadEncrypted() throws Exception {
        String data = "Top secret enterprise information";
        InputStream inputStream = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));

        String key = storageService.store(inputStream, "text/plain", data.length(), "documents", "md", true);
        
        assertNotNull(key);

        // Check that the actual stored file is encrypted and does not contain the plaintext
        Path storedFile = tempDir.resolve(key);
        byte[] storedBytes = Files.readAllBytes(storedFile);
        String storedContent = new String(storedBytes, StandardCharsets.UTF_8);
        assertFalse(storedContent.contains(data));

        // Load and decrypt
        InputStream loadedStream = storageService.load(key);
        byte[] loadedBytes = loadedStream.readAllBytes();
        String loadedData = new String(loadedBytes, StandardCharsets.UTF_8);

        assertEquals(data, loadedData);
    }

    @Test
    void testStoreUnsupportedExtensionThrowsException() {
        InputStream inputStream = new ByteArrayInputStream("".getBytes());
        assertThrows(IllegalArgumentException.class, () -> 
            storageService.store(inputStream, "application/octet-stream", 0, "assets", "exe", false)
        );
    }

    @Test
    void testPathTraversalRejected() {
        assertThrows(SecurityException.class, () -> storageService.load("assets/../../etc/passwd"));
        assertThrows(SecurityException.class, () -> storageService.load("assets/invalid\\format"));
    }
}
