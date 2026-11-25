package com.product.filthilink.services.payments;

import com.product.filthilink.entities.enums.Plan;
import com.product.filthilink.entities.enums.SubscriptionStatus;
import com.product.filthilink.entities.models.ProcessedEvent;
import com.product.filthilink.entities.models.Subscription;
import com.product.filthilink.repositories.auth.UserRepository;
import com.product.filthilink.repositories.payments.ProcessedEventRepository;
import com.product.filthilink.repositories.payments.SubscriptionRepository;
import com.product.filthilink.services.links.LinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final SubscriptionRepository subscriptionRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final LinkService linkService;
    private final UserRepository userRepository;

    /**
     * @param eventType Dodo's event type, e.g. {@code subscription.active}
     * @param data      the {@code data} object from the webhook body
     * @param eventId   the {@code webhook-id} header, used for idempotency
     */
    @Transactional
    public void process(String eventType, JsonNode data, String eventId) {

        if (eventId == null || eventId.isBlank()) {
            log.warn("Ignoring Dodo webhook {} with no webhook-id", eventType);
            return;
        }

        if (processedEventRepository.existsByEventId(eventId)) {
            return;
        }

        boolean handled = switch (eventType) {
            case "subscription.active",
                 "subscription.renewed",
                 "subscription.unpaused",
                 "subscription.plan_changed" -> activate(data);
            case "subscription.cancelled", "subscription.canceled" -> cancel(data);
            case "subscription.expired" -> expire(data, SubscriptionStatus.EXPIRED);
            case "subscription.failed" -> expire(data, SubscriptionStatus.FAILED);
            case "subscription.on_hold", "subscription.paused" -> pause(data);
            // A failed renewal opens a grace period; keep access until past_due_ends_at.
            case "subscription.past_due" -> keepAccessUntilPastDue(data);
            default -> false;
        };

        if (handled) {
            processedEventRepository.save(new ProcessedEvent(eventId, eventType));
        } else {
            // Return 200 anyway (the controller does), but leave the event unrecorded so a
            // later deploy that adds a handler can still process a redelivery.
            log.info("Unhandled or unmatched Dodo webhook {} ({})", eventType, eventId);
        }
    }

    private boolean activate(JsonNode data) {

        Subscription sub = findSubscription(data).orElse(null);
        if (sub == null) {
            log.warn("No subscription matched Dodo activation for subscription_id={}",
                    text(data, "subscription_id"));
            return false;
        }

        applyIdentifiers(sub, data);
        sub.setPlans(Plan.PREMIUM);
        sub.setStatus(SubscriptionStatus.ACTIVE);

        Instant periodEnd = parseInstant(text(data, "next_billing_date"));
        if (periodEnd != null) {
            sub.setCurrentPeriodEnd(periodEnd);
        }

        subscriptionRepository.save(sub);

        // Upgrading rescues every link the user has, including ones that already expired.
        linkService.makeLinksPermanent(sub.getUserId());

        return true;
    }

    private boolean cancel(JsonNode data) {

        Subscription sub = findSubscription(data).orElse(null);
        if (sub == null) {
            log.warn("No subscription matched Dodo cancellation for subscription_id={}",
                    text(data, "subscription_id"));
            return false;
        }

        applyIdentifiers(sub, data);
        sub.setStatus(SubscriptionStatus.CANCELLED);

        // isPremium() keeps access until currentPeriodEnd, so the date matters here.
        Instant periodEnd = parseInstant(text(data, "next_billing_date"));
        if (periodEnd != null) {
            sub.setCurrentPeriodEnd(periodEnd);
        }

        subscriptionRepository.save(sub);
        return true;
    }

    private boolean expire(JsonNode data, SubscriptionStatus status) {

        Subscription sub = findSubscription(data).orElse(null);
        if (sub == null) {
            log.warn("No subscription matched Dodo {} for subscription_id={}",
                    status, text(data, "subscription_id"));
            return false;
        }

        applyIdentifiers(sub, data);
        sub.setStatus(status);
        sub.setPlans(Plan.FREE);
        subscriptionRepository.save(sub);
        return true;
    }

    private boolean pause(JsonNode data) {

        Subscription sub = findSubscription(data).orElse(null);
        if (sub == null) {
            return false;
        }

        applyIdentifiers(sub, data);
        sub.setStatus(SubscriptionStatus.ON_HOLD);
        subscriptionRepository.save(sub);
        return true;
    }

    private boolean keepAccessUntilPastDue(JsonNode data) {

        Subscription sub = findSubscription(data).orElse(null);
        if (sub == null) {
            return false;
        }

        applyIdentifiers(sub, data);

        Instant graceEnd = parseInstant(text(data, "past_due_ends_at"));
        if (graceEnd == null) {
            graceEnd = parseInstant(text(data, "next_billing_date"));
        }
        if (graceEnd != null) {
            sub.setCurrentPeriodEnd(graceEnd);
        }

        subscriptionRepository.save(sub);
        return true;
    }

    private void applyIdentifiers(Subscription sub, JsonNode data) {

        String subscriptionId = text(data, "subscription_id");
        if (subscriptionId != null) {
            sub.setDodoSubscriptionId(subscriptionId);
        }

        String customerId = text(data.path("customer"), "customer_id");
        if (customerId == null) {
            customerId = text(data, "customer_id");
        }
        if (customerId != null) {
            sub.setDodoCustomerId(customerId);
        }
    }

    /**
     * Dodo sends the subscription, customer and metadata on every subscription event.
     * Match on the strongest identifier first, then fall back to our own user id (the
     * subscription row is keyed by email) and finally the customer email.
     */
    private Optional<Subscription> findSubscription(JsonNode data) {

        String subscriptionId = text(data, "subscription_id");
        if (subscriptionId != null) {
            Optional<Subscription> found = subscriptionRepository.findByDodoSubscriptionId(subscriptionId);
            if (found.isPresent()) return found;
        }

        String customerId = text(data.path("customer"), "customer_id");
        if (customerId == null) {
            customerId = text(data, "customer_id");
        }
        if (customerId != null) {
            Optional<Subscription> found = subscriptionRepository.findByDodoCustomerId(customerId);
            if (found.isPresent()) return found;
        }

        String metadataUserId = text(data.path("metadata"), "user_id");
        if (metadataUserId != null) {
            Optional<Subscription> found = subscriptionRepository.findByUserId(metadataUserId);
            if (found.isPresent()) return found;
            Optional<Subscription> created = createForUser(metadataUserId);
            if (created.isPresent()) return created;
        }

        String customerEmail = text(data.path("customer"), "email");
        if (customerEmail != null) {
            Optional<Subscription> found = subscriptionRepository.findByUserId(customerEmail);
            if (found.isPresent()) return found;
            return createForUser(customerEmail);
        }

        return Optional.empty();
    }

    private Optional<Subscription> createForUser(String userId) {
        if (!userRepository.existsByEmail(userId)) {
            return Optional.empty();
        }
        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setPlans(Plan.FREE);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        return Optional.of(subscriptionRepository.save(sub));
    }

    private static String text(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        String text = value.asString(null);
        return (text == null || text.isBlank()) ? null : text;
    }

    private static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            // Some payloads include a numeric offset instead of Z.
        }
        try {
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException ignored) {
            log.warn("Could not parse Dodo timestamp '{}'", value);
            return null;
        }
    }
}
