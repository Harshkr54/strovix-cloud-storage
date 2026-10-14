package com.storvix.backend.security;

import com.storvix.backend.entity.OAuthCode;
import com.storvix.backend.entity.User;
import com.storvix.backend.repository.OAuthCodeRepository;
import com.storvix.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final OAuthCodeRepository oAuthCodeRepository;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String googleId = oAuth2User.getAttribute("sub");

        if (email == null || email.trim().isEmpty()) {
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=email_missing");
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (!"GOOGLE".equals(user.getProvider())) {
                user.setProvider("GOOGLE");
                user.setGoogleId(googleId);
            }
        } else {
            user = new User();
            user.setEmail(normalizedEmail);
            user.setName(name != null ? name : "Google User");
            user.setAvatar(picture);
            user.setProvider("GOOGLE");
            user.setGoogleId(googleId);
        }
        user = userRepository.save(user);

        // Generate 32-byte cryptographically secure random token
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawCode = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        // Hash code using SHA-256 before saving to DB
        String codeHash = hashOAuthCode(rawCode);
        OAuthCode oAuthCode = new OAuthCode();
        oAuthCode.setCodeHash(codeHash);
        oAuthCode.setUserId(user.getId());
        oAuthCode.setExpiresAt(LocalDateTime.now().plusSeconds(60));
        oAuthCode.setIsUsed(false);
        oAuthCodeRepository.save(oAuthCode);

        // Clear OAuth authorization request cookies
        cookieAuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // Redirect with ONLY the temporary one-time exchange code (ZERO JWT IN URL)
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                .queryParam("code", rawCode)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String hashOAuthCode(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 missing", e);
        }
    }
}
