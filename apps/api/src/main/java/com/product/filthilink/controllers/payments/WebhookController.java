package com.product.filthilink.controllers.payments;

import com.product.filthilink.exceptions.InvalidWebhookSignatureException;
import com.product.filthilink.services.payments.WebhookService;
import com.product.filthilink.services.payments.WebhookSignatureVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks/dodo")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;
    private final WebhookSignatureVerifier signatureVerifier;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader(value = "webhook-id", required = false) String webhookId,
            @RequestHeader(value = "webhook-timestamp", required = false) String webhookTimestamp,
            @RequestHeader(value = "webhook-signature", required = false) String signature,
            @RequestBody String rawPayload) {

        try {
            signatureVerifier.verify(rawPayload, webhookId, webhookTimestamp, signature);
        } catch (InvalidWebhookSignatureException e) {
            log.warn("Rejected Dodo webhook: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(rawPayload);
        } catch (Exception e) {
            log.warn("Rejected Dodo webhook with unreadable body", e);
            return ResponseEntity.badRequest().build();
        }

        String eventType = root.path("type").asString(null);
        if (eventType == null || eventType.isBlank()) {
            log.warn("Rejected Dodo webhook without a type");
            return ResponseEntity.badRequest().build();
        }

        // The webhook id is a header, not part of the body. It is the idempotency key.
        JsonNode data = root.path("data");

        try {
            webhookService.process(eventType, data, webhookId);
        } catch (Exception e) {
            // Returning 5xx makes Dodo retry, which is what we want if our database failed.
            log.error("Failed to process Dodo webhook {} ({})", eventType, webhookId, e);
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok().build();
    }
}
