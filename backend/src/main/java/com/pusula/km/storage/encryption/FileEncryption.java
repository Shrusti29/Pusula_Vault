package com.pusula.km.storage.encryption;

import java.io.InputStream;

public interface FileEncryption {
    byte[] encrypt(byte[] data);
    byte[] decrypt(byte[] encryptedData);
}
