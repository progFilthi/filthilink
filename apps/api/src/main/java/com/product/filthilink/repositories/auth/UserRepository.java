package com.product.filthilink.repositories.auth;

import com.product.filthilink.entities.enums.AuthProvider;
import com.product.filthilink.entities.enums.Role;
import com.product.filthilink.entities.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    /**
     * Row-locks the user for the duration of the transaction, so two concurrent
     * "create a link / API key" requests cannot both pass the plan limit check.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    long countByAuthProvider(AuthProvider authProvider);

    long countByRole(Role role);

    long countByCreatedAtAfter(LocalDateTime since);
}
