package com.product.filthilink.services.payments;

import com.product.filthilink.entities.models.Subscription;
import com.product.filthilink.repositories.payments.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Single place that knows what each plan allows. Keep these numbers in step with
 * apps/web/lib/pricing.ts, which is what the pricing cards display.
 */
@Service
@RequiredArgsConstructor
public class PlanLimitService {

    public static final int FREE_MONTHLY_LINKS = 5;
    public static final int PREMIUM_MONTHLY_LINKS = 1000;
    public static final int FREE_API_KEYS = 1;

    private final SubscriptionRepository subscriptionRepository;

    /** Subscriptions are keyed by the user's email. No subscription row means the free plan. */
    public boolean isPremium(String email) {
        return subscriptionRepository.findByUserId(email)
                .map(Subscription::isPremium)
                .orElse(false);
    }

    public int monthlyLinkLimit(boolean premium) {
        return premium ? PREMIUM_MONTHLY_LINKS : FREE_MONTHLY_LINKS;
    }
}
