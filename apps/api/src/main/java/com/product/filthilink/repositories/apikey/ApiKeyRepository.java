package com.product.filthilink.repositories.apikey;

import com.product.filthilink.entities.models.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    // Was findUserById(...), which Spring Data parses as findById(...): it matched the API key whose
    // own id equals the user id, not the keys that belong to the user.
    List<ApiKey> findByUserId(Long userId);

    long countByUserId(Long userId);

    /** A prefix is not guaranteed to be unique; the caller checks the full key hash. */
    List<ApiKey> findByKeyPrefix(String prefix);
}
