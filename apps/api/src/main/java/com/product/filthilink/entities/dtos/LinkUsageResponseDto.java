package com.product.filthilink.entities.dtos;

import java.time.LocalDateTime;

public record LinkUsageResponseDto(
        long used,
        int limit,
        boolean premium,
        LocalDateTime resetsAt
) {}
