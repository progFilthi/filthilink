package com.product.filthilink.services.payments;

import com.product.filthilink.configs.DodoProperties;
import com.product.filthilink.exceptions.InvalidWebhookSignatureException;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

/**
 * Verifies Dodo's Standard Webhooks (Svix) signature.
 *
 * The signed content is {@code webhook-id.webhook-timestamp.raw-body}, HMAC-SHA256 with the
 * base64-decoded webhook secret, base64-encoded. The {@code webhook-signature} header holds
 * one or more space-separated signatures of the form {@code v1,<signature>}.
 */
@Component
public class WebhookSignatureVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SECRET_PREFIX = "whsec_";
    private static final String SIGNATURE_PREFIX = "v1,";
    /** Standard Webhooks recommends a 5 minute window to blunt replay attacks. */
    private static final long MAX_TIMESTAMP_SKEW_SECONDS = 300;

    private final byte[] signingKey;

    public WebhookSignatureVerifier(DodoProperties properties) {
        this.signingKey = decodeSecret(properties.webhookKey());
    }

    public void verify(String payload, String webhookId, String webhookTimestamp, String signatureHeader) {

        if (webhookId == null || webhookId.isBlank()
                || webhookTimestamp == null || webhookTimestamp.isBlank()
                || signatureHeader == null || signatureHeader.isBlank()) {
            throw new InvalidWebhookSignatureException("Missing webhook signature headers");
        }

        long timestamp;
        try {
            timestamp = Long.parseLong(webhookTimestamp.trim());
        } catch (NumberFormatException e) {
            throw new InvalidWebhookSignatureException("Invalid webhook timestamp");
        }

        if (Math.abs(Instant.now().getEpochSecond() - timestamp) > MAX_TIMESTAMP_SKEW_SECONDS) {
            throw new InvalidWebhookSignatureException("Webhook timestamp outside the allowed window");
        }

        String signedContent = webhookId + "." + webhookTimestamp + "." + payload;
        String expectedSignature = sign(signedContent);

        for (String candidate : signatureHeader.split(" ")) {
            String signature = candidate.startsWith(SIGNATURE_PREFIX)
                    ? candidate.substring(SIGNATURE_PREFIX.length())
                    : candidate;
            if (constantTimeEquals(expectedSignature, signature)) {
                return;
            }
        }

        throw new InvalidWebhookSignatureException("Invalid webhook signature");
    }

    private String sign(String signedContent) {
        try {
            // A fresh Mac per request: Mac is not thread-safe, and this component is a singleton.
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(signingKey, HMAC_ALGORITHM));
            return Base64.getEncoder().encodeToString(mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to initialize webhook verifier", e);
        }
    }

    private static byte[] decodeSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("Dodo webhook key is not configured");
        }
        if (secret.startsWith(SECRET_PREFIX)) {
            try {
                return Base64.getDecoder().decode(secret.substring(SECRET_PREFIX.length()));
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException("Dodo webhook key is not valid base64", e);
            }
        }
        // Accept a plain secret too, which is useful for local testing.
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
