package com.pusula.km.storage;

import java.io.InputStream;

public interface StorageService {
    String store(InputStream inputStream, String contentType, long size, String subDir, String extension, boolean encrypt);
    InputStream load(String storageKey);
    void delete(String storageKey);
    boolean exists(String storageKey);
    long size(String storageKey);
    String move(String storageKey, String targetSubDir);
    String computeChecksum(String storageKey);
}
