package com.eventmate.model;

import jakarta.validation.constraints.NotBlank;

public class EventRequest {

    @NotBlank(message = "Event name is required")
    private String name;

    @NotBlank(message = "Date and time is required")
    private String dateTime;

    @NotBlank(message = "Venue or meeting link is required")
    private String venue;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Target audience is required")
    private String audience;

    @NotBlank(message = "Registration link is required")
    private String registrationLink;

    private String tone = "friendly";

    // Constructors
    public EventRequest() {}

    public EventRequest(String name, String dateTime, String venue, String description, String audience, String registrationLink, String tone) {
        this.name = name;
        this.dateTime = dateTime;
        this.venue = venue;
        this.description = description;
        this.audience = audience;
        this.registrationLink = registrationLink;
        this.tone = tone;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDateTime() { return dateTime; }
    public void setDateTime(String dateTime) { this.dateTime = dateTime; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getRegistrationLink() { return registrationLink; }
    public void setRegistrationLink(String registrationLink) { this.registrationLink = registrationLink; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }
}
