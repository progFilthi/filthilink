package com.product.filthilink.services.links;

import com.product.filthilink.entities.dtos.CreateLinkRequestDto;
import com.product.filthilink.entities.dtos.LinkResponseDto;
import com.product.filthilink.entities.dtos.LinkUsageResponseDto;
import com.product.filthilink.entities.dtos.UpdateLinkRequestDto;
import com.product.filthilink.entities.mappers.LinkMapper;
import com.product.filthilink.entities.models.Link;
import com.product.filthilink.entities.models.User;
import com.product.filthilink.exceptions.BadRequest;
import com.product.filthilink.exceptions.LinkExpiredException;
import com.product.filthilink.exceptions.PlanLimitExceededException;
import com.product.filthilink.exceptions.ResourceConflict;
import com.product.filthilink.exceptions.ResourceNotFound;
import com.product.filthilink.repositories.auth.UserRepository;
import com.product.filthilink.repositories.links.LinkRepository;
import com.product.filthilink.services.payments.PlanLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LinkService {

    private final LinkRepository linkRepository;
    private final LinkMapper linkMapper;
    private final ClickTrackingService clickTrackingService;
    private final UserRepository userRepository;
    private final PlanLimitService planLimitService;

    private static final long FREE_LINK_DAYS = 30;
    // The expires_at column is NOT NULL, so "never expires" is stored as a date far in the future.
    private static final long PERMANENT_LINK_YEARS = 100;

    private static final int MAX_URL_LENGTH = 255;
    private static final Pattern CUSTOM_SLUG_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{3,32}$");

    /** Paths that already exist on the API or web app, so a short code must not shadow them. */
    private static final Set<String> RESERVED_SLUGS = Set.of(
            "api", "actuator", "health", "error", "login", "register", "dashboard",
            "admin", "favicon.ico", "robots.txt", "sitemap.xml", "v3"
    );

    private static final String base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHORT_CODE_LENGTH = 6;

    @Value("${app.base-url}")
    private String baseUrl;

    @Transactional
    public LinkResponseDto createLink(CreateLinkRequestDto dto, String email) {

        // Row lock serialises link creation per user so two requests cannot both pass the limit check.
        User user = userRepository.findByEmailForUpdate(email).orElseThrow(() -> new UsernameNotFoundException(email));

        boolean premium = planLimitService.isPremium(email);
        int limit = planLimitService.monthlyLinkLimit(premium);
        long usedThisMonth = linkRepository.countByUserIdAndCreatedAtGreaterThanEqual(user.getId(), startOfCurrentMonth());

        if (usedThisMonth >= limit) {
            throw new PlanLimitExceededException(premium
                    ? "You've reached this month's limit of " + limit + " new links."
                    : "You've used all " + limit + " free links this month. Upgrade to Pro to keep creating links, and keep them forever.");
        }

        String originalUrl = validateDestination(dto.originalUrl());

        String shortCode;
        if (dto.customSlug() != null && !dto.customSlug().isBlank()) {
            if (!premium) {
                throw new PlanLimitExceededException("Custom slugs are a Pro feature.");
            }
            shortCode = validateCustomSlug(dto.customSlug());
            if (linkRepository.existsByShortCode(shortCode)) {
                throw new ResourceConflict("That custom slug is already taken.");
            }
        } else {
            shortCode = generateUniqueShortCode();
        }

        LocalDateTime expiresAt = premium
                ? LocalDateTime.now().plusYears(PERMANENT_LINK_YEARS)
                : LocalDateTime.now().plusDays(FREE_LINK_DAYS);

        Link link = linkMapper.toEntity(new CreateLinkRequestDto(originalUrl, null), shortCode, 0, expiresAt);
        link.setUser(user);

        Link savedLink = linkRepository.save(link);

        return linkMapper.toResponseDto(savedLink, baseUrl);

    }

    @Transactional
    public LinkResponseDto updateLink(Long id, UpdateLinkRequestDto dto, String email) {

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));

        Link link = linkRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .orElseThrow(() -> new ResourceNotFound("Link not found"));

        if (!planLimitService.isPremium(email)) {
            throw new PlanLimitExceededException("Editing a link's destination is a Pro feature.");
        }

        link.setOriginalUrl(validateDestination(dto.originalUrl()));

        return linkMapper.toResponseDto(linkRepository.save(link), baseUrl);

    }

    @Transactional
    public void deleteLink(Long id, String email) {

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));

        Link link = linkRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .orElseThrow(() -> new ResourceNotFound("Link not found"));

        // Soft delete: the row keeps counting toward the month's creation limit.
        link.setDeletedAt(LocalDateTime.now());
        linkRepository.save(link);

    }

    public Page<LinkResponseDto> getLinksByUser(String email, Pageable pageable) {

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));

        return linkRepository.findByUserIdAndDeletedAtIsNull(user.getId(), pageable)
                .map(link -> linkMapper.toResponseDto(link, baseUrl));

    }


    @Transactional(readOnly = true)
    public LinkUsageResponseDto getUsage(String email) {

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));

        boolean premium = planLimitService.isPremium(email);
        LocalDateTime monthStart = startOfCurrentMonth();
        long used = linkRepository.countByUserIdAndCreatedAtGreaterThanEqual(user.getId(), monthStart);

        return new LinkUsageResponseDto(used, planLimitService.monthlyLinkLimit(premium), premium, monthStart.plusMonths(1));

    }

    /**
     * Called when a subscription becomes active. Every link the user owns stops expiring,
     * including links that already lapsed on the free plan. Deliberately lenient: a webhook
     * must never fail because the user row can't be found.
     */
    @Transactional
    public void makeLinksPermanent(String email) {

        userRepository.findByEmail(email).ifPresent(user ->
                linkRepository.extendExpiryByUserId(user.getId(), LocalDateTime.now().plusYears(PERMANENT_LINK_YEARS)));

    }

    private LocalDateTime startOfCurrentMonth() {
        return LocalDate.now().withDayOfMonth(1).atStartOfDay();
    }


    public String resolveLink(String shortCode ) {

        Link link = linkRepository.findByShortCodeAndDeletedAtIsNull(shortCode)
                .orElseThrow(()-> new ResourceNotFound(shortCode));

        if( link.getExpiresAt().isBefore(LocalDateTime.now()) ) {
            throw new LinkExpiredException(shortCode);
        }

        // Legacy rows may predate validation. Treat a broken stored URL as not found
        // rather than letting URI.create throw a 500 during the redirect.
        if (!isRedirectable(link.getOriginalUrl())) {
            throw new ResourceNotFound(shortCode);
        }

        clickTrackingService.increment(link.getId());

        return link.getOriginalUrl();

    }

    /**
     * Trims and validates a destination URL. Only absolute http(s) URLs with a host are
     * accepted, and links back to FilthiLink itself are rejected to prevent redirect loops.
     */
    private String validateDestination(String raw) {

        if (raw == null || raw.isBlank()) {
            throw new BadRequest("A destination URL is required.");
        }

        String value = raw.trim();

        if (value.length() > MAX_URL_LENGTH) {
            throw new BadRequest("Destination URL must be " + MAX_URL_LENGTH + " characters or fewer.");
        }

        if (!isRedirectable(value)) {
            throw new BadRequest("Enter a full URL starting with http:// or https://.");
        }

        String host = hostOf(value);
        if (host != null && (host.equals(ownHost()) || host.equals("filthilink.store") || host.equals("www.filthilink.store"))) {
            throw new BadRequest("You can't shorten a link that points back to FilthiLink.");
        }

        return value;

    }

    private boolean isRedirectable(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            return scheme != null
                    && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank();
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private String hostOf(String value) {
        try {
            String host = new URI(value).getHost();
            return host == null ? null : host.toLowerCase(Locale.ROOT);
        } catch (URISyntaxException e) {
            return null;
        }
    }

    private String ownHost() {
        try {
            String host = URI.create(baseUrl).getHost();
            return host == null ? "" : host.toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException e) {
            return "";
        }
    }

    private String validateCustomSlug(String raw) {

        String slug = raw.trim();

        if (!CUSTOM_SLUG_PATTERN.matcher(slug).matches()) {
            throw new BadRequest("Custom slugs must be 3 to 32 characters and use only letters, numbers, hyphens or underscores.");
        }

        if (RESERVED_SLUGS.contains(slug.toLowerCase(Locale.ROOT))) {
            throw new BadRequest("That custom slug is reserved.");
        }

        return slug;

    }


    private String generateShortCode() {
        Random random = new SecureRandom();

        StringBuilder sb = new StringBuilder(SHORT_CODE_LENGTH);

        for( int i = 0; i < SHORT_CODE_LENGTH; i++ ) {
            sb.append(base62.charAt(random.nextInt(base62.length())));
        }

        return sb.toString();
    }


    private String generateUniqueShortCode() {

        String shortCode;

        do {
            shortCode = generateShortCode();

        } while (linkRepository.existsByShortCode(shortCode));
            return shortCode;
    }

}
