package com.pusula.km.storage;

import com.pusula.km.config.StorageProperties;
import com.pusula.km.exception.StorageException;
import com.pusula.km.exception.ValidationException;
import com.pusula.km.storage.encryption.FileEncryption;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LocalDriveStorageServiceImpl implements StorageService {

    private final StorageProperties storageProperties;
    private final FileEncryption fileEncryption;

    private Path rootPath;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "docx", "xlsx", "csv", "pdf", "png", "jpg", "jpeg", "webp", "svg", "txt", "md"
    );

    private static final List<String> SUB_DIRS = Arrays.asList(
            "documents", "assets", "versions", "exports", "temp", "backups"
    );

    private static final Pattern STORAGE_KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+/[0-9a-fA-F-]+\\.[a-zA-Z0-9]+$");

    private static final byte[] ENC_MAGIC = {0x45, 0x4E, 0x43, 0x00};

    @PostConstruct
    public void init() {
        String uploadDir = storageProperties.uploadDir();
        if (uploadDir == null || uploadDir.trim().isEmpty()) {
            uploadDir = System.getProperty("user.home") + "/PusulaKM_Data";
        }
        rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
            for (String subDir : SUB_DIRS) {
                Files.createDirectories(rootPath.resolve(subDir));
            }
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage directories", e);
        }
    }

    @Override
    public String store(InputStream inputStream, String contentType, long size, String subDir, String extension, boolean encrypt) {
        if (!SUB_DIRS.contains(subDir)) {
            throw new ValidationException("Invalid subdirectory: " + subDir);
        }
        String sanitizedExt = StringUtils.getFilenameExtension("file." + extension);
        if (sanitizedExt == null || !ALLOWED_EXTENSIONS.contains(sanitizedExt.toLowerCase())) {
            throw new ValidationException("Unsupported file extension: " + extension);
        }
        String storageKey = subDir + "/" + UUID.randomUUID() + "." + sanitizedExt.toLowerCase();
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                bos.write(buffer, 0, bytesRead);
            }
            byte[] fileBytes = bos.toByteArray();
            if (encrypt) {
                byte[] encrypted = fileEncryption.encrypt(fileBytes);
                ByteBuffer bb = ByteBuffer.allocate(ENC_MAGIC.length + encrypted.length);
                bb.put(ENC_MAGIC);
                bb.put(encrypted);
                fileBytes = bb.array();
            }
            Files.write(targetPath, fileBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return storageKey;
        } catch (IOException e) {
            throw new StorageException("Failed to store file " + storageKey, e);
        }
    }

    @Override
    public InputStream load(String storageKey) {
        validatePath(storageKey);
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        if (!Files.exists(targetPath)) {
            throw new StorageException("File not found: " + storageKey);
        }
        try {
            byte[] fileBytes = Files.readAllBytes(targetPath);
            if (fileBytes.length >= ENC_MAGIC.length && startsWith(fileBytes, ENC_MAGIC)) {
                byte[] encryptedData = Arrays.copyOfRange(fileBytes, ENC_MAGIC.length, fileBytes.length);
                fileBytes = fileEncryption.decrypt(encryptedData);
            }
            return new ByteArrayInputStream(fileBytes);
        } catch (IOException e) {
            throw new StorageException("Failed to load file " + storageKey, e);
        }
    }

    private boolean startsWith(byte[] array, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (array[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void delete(String storageKey) {
        validatePath(storageKey);
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        try {
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            throw new StorageException("Failed to delete file " + storageKey, e);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            validatePath(storageKey);
        } catch (StorageException e) {
            return false;
        }
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            return false;
        }
        return Files.exists(targetPath);
    }

    @Override
    public long size(String storageKey) {
        validatePath(storageKey);
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        try {
            return Files.size(targetPath);
        } catch (IOException e) {
            throw new StorageException("Failed to determine size of file " + storageKey, e);
        }
    }

    @Override
    public String move(String storageKey, String targetSubDir) {
        validatePath(storageKey);
        if (!SUB_DIRS.contains(targetSubDir)) {
            throw new ValidationException("Invalid subdirectory: " + targetSubDir);
        }
        Path sourcePath = rootPath.resolve(storageKey).normalize();
        if (!sourcePath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        if (!Files.exists(sourcePath)) {
            throw new StorageException("File not found: " + storageKey);
        }
        String fileName = sourcePath.getFileName().toString();
        String newKey = targetSubDir + "/" + fileName;
        Path targetPath = rootPath.resolve(newKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected for target: " + newKey);
        }
        try {
            if (targetPath.getParent() != null) {
                Files.createDirectories(targetPath.getParent());
            }
            Files.move(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return newKey;
        } catch (IOException e) {
            throw new StorageException("Failed to move file to " + targetSubDir, e);
        }
    }

    @Override
    public String computeChecksum(String storageKey) {
        validatePath(storageKey);
        Path targetPath = rootPath.resolve(storageKey).normalize();
        if (!targetPath.startsWith(rootPath)) {
            throw new StorageException("Path traversal detected: " + storageKey);
        }
        try (InputStream is = Files.newInputStream(targetPath)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new StorageException("Failed to compute checksum for " + storageKey, e);
        }
    }

    private void validatePath(String storageKey) {
        if (storageKey == null || storageKey.isEmpty()) {
            throw new StorageException("Storage key cannot be null or empty");
        }
        if (storageKey.contains("..") || storageKey.contains("\\") || storageKey.contains("\0")) {
            throw new StorageException("Path traversal detected: illegal characters in storage key");
        }
        if (!STORAGE_KEY_PATTERN.matcher(storageKey).matches()) {
            throw new StorageException("Invalid storage key format: " + storageKey);
        }
    }
}
