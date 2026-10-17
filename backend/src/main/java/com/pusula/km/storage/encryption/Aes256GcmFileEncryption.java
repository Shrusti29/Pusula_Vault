package com.pusula.km.storage.encryption;

import com.pusula.km.config.EncryptionProperties;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class Aes256GcmFileEncryption implements FileEncryption {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    private final SecretKey secretKey;

    public Aes256GcmFileEncryption(EncryptionProperties properties) {
        String keyStr = properties.key();
        if (keyStr == null || keyStr.trim().isEmpty()) {
            try {
                KeyGenerator keyGen = KeyGenerator.getInstance("AES");
                keyGen.init(256, new SecureRandom());
                this.secretKey = keyGen.generateKey();
            } catch (Exception e) {
                throw new RuntimeException("Failed to generate fallback encryption key", e);
            }
        } else {
            byte[] decodedKey = Base64.getDecoder().decode(keyStr);
            this.secretKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, "AES");
        }
    }

    @Override
    public byte[] encrypt(byte[] data) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(data);

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);
            return byteBuffer.array();
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public byte[] decrypt(byte[] encryptedData) {
        try {
            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedData);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);
            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
