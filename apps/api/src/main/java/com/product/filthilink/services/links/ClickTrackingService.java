package com.product.filthilink.services.links;

import com.product.filthilink.repositories.links.LinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClickTrackingService {

    private final LinkRepository linkRepository;

    /**
     * Atomic UPDATE ... click_count = click_count + 1. Reading the entity and saving it
     * back loses increments when two redirects arrive at the same time.
     */
    @Async
    @Transactional
    public void increment( Long linkId ) {
        linkRepository.incrementClickCount(linkId);
    }


}
