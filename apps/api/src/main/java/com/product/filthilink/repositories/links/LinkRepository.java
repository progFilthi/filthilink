package com.product.filthilink.repositories.links;

import com.product.filthilink.entities.models.Link;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface LinkRepository extends JpaRepository<Link, Long> {

    /** Includes soft-deleted rows so a generated or custom code is never reused. */
    boolean existsByShortCode(String shortCode);

    Optional<Link> findByShortCodeAndDeletedAtIsNull(String shortCode);

    Optional<Link> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    Page<Link> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    long countByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * Deliberately counts soft-deleted links too: a deleted link still consumed one of
     * the month's creations, so Free users cannot delete-and-recreate to bypass the limit.
     */
    long countByUserIdAndCreatedAtGreaterThanEqual(Long userId, LocalDateTime since);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Link l SET l.expiresAt = :expiresAt WHERE l.user.id = :userId AND l.deletedAt IS NULL")
    int extendExpiryByUserId(@Param("userId") Long userId,
                             @Param("expiresAt") LocalDateTime expiresAt);

    /** Atomic increment so concurrent redirects do not lose clicks. */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Link l SET l.clickCount = l.clickCount + 1 WHERE l.id = :id")
    int incrementClickCount(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(l.clickCount), 0) FROM Link l WHERE l.user.id = :userId AND l.deletedAt IS NULL")
    long sumClickCountByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(l.clickCount), 0) FROM Link l WHERE l.deletedAt IS NULL")
    long totalClickCount();

    @Query("SELECT COUNT(l) FROM Link l WHERE l.deletedAt IS NULL")
    long countActive();
}
