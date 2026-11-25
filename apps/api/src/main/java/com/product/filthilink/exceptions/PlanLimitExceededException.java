package com.product.filthilink.exceptions;

/**
 * Thrown when an account has used everything its plan allows (links this month, API keys).
 * Mapped to HTTP 402 so the web app can show an upgrade prompt instead of a generic error.
 */
public class PlanLimitExceededException extends RuntimeException {
    public PlanLimitExceededException(String message) {
        super(message);
    }
}
