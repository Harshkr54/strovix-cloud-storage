package com.storvix.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:noreply@storvix.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:Storvix}")
    private String senderName;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    public boolean sendTransactionalEmail(String toEmail, String toName, String subject, String htmlContent, String textContent, List<String> tags) {
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            log.warn("Cannot send email to {}. BREVO_API_KEY is not configured.", toEmail);
            return false;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey.trim());

        Map<String, Object> body = new HashMap<>();
        body.put("sender", Map.of("name", senderName, "email", senderEmail));
        
        Map<String, String> to = new HashMap<>();
        to.put("email", toEmail);
        if (toName != null) to.put("name", toName);
        body.put("to", Collections.singletonList(to));
        
        body.put("subject", subject);
        body.put("htmlContent", htmlContent);
        body.put("textContent", textContent);
        if (tags != null && !tags.isEmpty()) {
            body.put("tags", tags);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Brevo to: {}", toEmail);
                return true;
            }
            log.warn("Brevo email API returned non-2xx status: {} {}", response.getStatusCode(), response.getBody());
            return false;
        } catch (Exception e) {
            log.error("Failed to send email via Brevo to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendFileShareEmail(String recipientEmail, String recipientName, String senderName, String resourceName, String permission, String resourceId) {
        String subject = senderName + " shared a file with you";
        String html = "<p>" + senderName + " shared the file <b>" + resourceName + "</b> with you (" + permission + ").</p><p><a href='" + frontendUrl + "/shared'>View File</a></p>";
        String text = senderName + " shared the file " + resourceName + " with you.";
        return sendTransactionalEmail(recipientEmail, recipientName, subject, html, text, Collections.singletonList("FILE_SHARE"));
    }

    public boolean sendFolderShareEmail(String recipientEmail, String recipientName, String senderName, String resourceName, String permission, String resourceId) {
        String subject = senderName + " shared a folder with you";
        String html = "<p>" + senderName + " shared the folder <b>" + resourceName + "</b> with you (" + permission + ").</p><p><a href='" + frontendUrl + "/shared'>View Folder</a></p>";
        String text = senderName + " shared the folder " + resourceName + " with you.";
        return sendTransactionalEmail(recipientEmail, recipientName, subject, html, text, Collections.singletonList("FOLDER_SHARE"));
    }

    public boolean sendShareInviteEmail(String recipientEmail, String senderName, String resourceName, String resourceType, String permission, String inviteToken) {
        String subject = senderName + " invited you to collaborate";
        String inviteUrl = frontendUrl + "/register?email=" + recipientEmail + "&invite=" + inviteToken;
        String html = "<p>" + senderName + " invited you to collaborate on a " + resourceType + " named <b>" + resourceName + "</b>.</p><p><a href='" + inviteUrl + "'>Accept Invite</a></p>";
        String text = senderName + " invited you to collaborate on " + resourceName + ".";
        return sendTransactionalEmail(recipientEmail, null, subject, html, text, Collections.singletonList("SHARE_INVITE"));
    }

    public boolean sendPublicLinkEmail(String recipientEmail, String recipientName, String senderName, String resourceName, String resourceType, String token) {
        String subject = senderName + " shared a link with you";
        String shareUrl = frontendUrl + "/share/" + token;
        String html = "<p>" + senderName + " shared a public link for a " + resourceType + " named <b>" + resourceName + "</b>.</p><p><a href='" + shareUrl + "'>Open Link</a></p>";
        String text = senderName + " shared a public link for " + resourceName + ".";
        return sendTransactionalEmail(recipientEmail, recipientName, subject, html, text, Collections.singletonList("PUBLIC_LINK"));
    }
}
