package com.product.filthilink.controllers.links;

import com.product.filthilink.exceptions.ResourceNotFound;
import com.product.filthilink.services.links.LinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final LinkService linkService;

    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        String originalUrl = linkService.resolveLink(shortCode);

        URI location;
        try {
            location = URI.create(originalUrl);
        } catch (IllegalArgumentException e) {
            // A stored URL that used to be acceptable but no longer parses should not 500.
            throw new ResourceNotFound(shortCode);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(location)
                .build();
    }
}
