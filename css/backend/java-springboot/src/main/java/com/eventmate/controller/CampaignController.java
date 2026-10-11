package com.eventmate.controller;

import com.eventmate.model.EventRequest;
import com.eventmate.service.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow frontend calls from any origin
public class CampaignController {

    private final CampaignService campaignService;
    private final Map<String, Object> eventStore = new ConcurrentHashMap<>();

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    /**
     * GET /api/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "framework", "Spring Boot 3",
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * POST /api/campaign/generate
     */
    @PostMapping("/campaign/generate")
    public ResponseEntity<?> generateCampaign(@Valid @RequestBody EventRequest request) {
        Map<String, Object> campaign = campaignService.generateCampaign(request);
        return ResponseEntity.ok(campaign);
    }

    /**
     * GET /api/events
     */
    @GetMapping("/events")
    public ResponseEntity<Collection<Object>> getSavedEvents() {
        return ResponseEntity.ok(eventStore.values());
    }

    /**
     * POST /api/events
     */
    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> saveEvent(@RequestBody Map<String, Object> eventPayload) {
        String id = (String) eventPayload.getOrDefault("id", "evt-" + System.currentTimeMillis());
        eventPayload.put("id", id);
        eventStore.put(id, eventPayload);
        return ResponseEntity.ok(Map.of("success", true, "id", id, "message", "Event saved"));
    }
}
