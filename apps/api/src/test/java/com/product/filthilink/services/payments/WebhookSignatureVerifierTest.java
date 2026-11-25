package com.product.filthilink.services.payments;

import com.product.filthilink.configs.DodoProperties;
import com.product.filthilink.exceptions.InvalidWebhookSignatureException;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Pure unit tests for the Standard Webhooks signature check. No Spring context or database.
 */
class WebhookSignatureVerifierTest {

    private static final byte[] SIGNING_KEY =
            "filthilink-test-signing-key-0123456789".getBytes(StandardCharsets.UTF_8);
    private static final String SECRET = "whsec_" + Base64.getEncoder().encodeToString(SIGNING_KEY);

    private final WebhookSignatureVerifier verifier = new WebhookSignatureVerifier(
            new DodoProperties("pdt_monthly", "pdt_yearly", "api-key", SECRET, "test")
    );

    @Test
    void acceptsAValidSignature() throws Exception {
        String id = "msg_123";
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String body = "{\"type\":\"subscription.active\"}";

        assertDoesNotThrow(() ->
                verifier.verify(body, id, timestamp, "v1," + sign(id, timestamp, body)));
    }

    @Test
    void acceptsWhenOneOfSeveralSignaturesMatches() throws Exception {
        String id = "msg_123";
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String body = "{\"type\":\"subscription.active\"}";

        String header = "v1,not-the-right-signature v1," + sign(id, timestamp, body);

        assertDoesNotThrow(() -> verifier.verify(body, id, timestamp, header));
    }

    @Test
    void rejectsATamperedBody() throws Exception {
        String id = "msg_123";
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String signature = "v1," + sign(id, timestamp, "{\"type\":\"subscription.active\"}");

        assertThrows(InvalidWebhookSignatureException.class, () ->
                verifier.verify("{\"type\":\"subscription.cancelled\"}", id, timestamp, signature));
    }

    @Test
    void rejectsAStaleTimestamp() throws Exception {
        String id = "msg_123";
        String timestamp = String.valueOf(Instant.now().minusSeconds(600).getEpochSecond());
        String body = "{\"type\":\"subscription.active\"}";

        assertThrows(InvalidWebhookSignatureException.class, () ->
                verifier.verify(body, id, timestamp, "v1," + sign(id, timestamp, body)));
    }

    @Test
    void rejectsMissingHeaders() {
        assertThrows(InvalidWebhookSignatureException.class,
                () -> verifier.verify("{}", null, "123", "v1,abc"));
        assertThrows(InvalidWebhookSignatureException.class,
                () -> verifier.verify("{}", "msg_123", null, "v1,abc"));
        assertThrows(InvalidWebhookSignatureException.class,
                () -> verifier.verify("{}", "msg_123", "123", null));
    }

    private static String sign(String id, String timestamp, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SIGNING_KEY, "HmacSHA256"));
        String signedContent = id + "." + timestamp + "." + body;
        return Base64.getEncoder().encodeToString(
                mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8)));
    }
}
