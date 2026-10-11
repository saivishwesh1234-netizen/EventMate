/**
 * Event Mate - Backend Server
 * 
 * Secure Node.js & Express API providing:
 * 1. Attendee Registration with Explicit Consent Verification
 * 2. Persistent Database Storage for Members, Events, and Message Logs
 * 3. Protected Organizer Dashboard API with Password / Token Authentication
 * 4. Meta WhatsApp Business Cloud API Dispatcher with Demo Mode Support
 * 5. Static File Hosting for the Event Mate Frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const db = require('./backend/db');
const whatsappService = require('./backend/whatsapp');
const { CampaignGenerator } = require('./js/generator');

const app = express();
const PORT = process.env.PORT || 5000;
const ORGANIZER_PASSWORD = process.env.ORGANIZER_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'eventmate-default-dev-secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// -----------------------------------------------------------------------------
// Authentication Helpers
// -----------------------------------------------------------------------------
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Middleware to protect organizer-only routes
function requireOrganizerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Organizer authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid or expired organizer session. Please log in again.'
    });
  }

  req.organizer = verified;
  next();
}

// -----------------------------------------------------------------------------
// Public Endpoints
// -----------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// WhatsApp system status (indicates whether Demo or Live Mode is active)
app.get('/api/whatsapp/status', (req, res) => {
  res.json(whatsappService.getStatus());
});

// List all active events
app.get('/api/events', (req, res) => {
  const events = db.getEvents();
  res.json({ success: true, events });
});

// Sync or create an event from frontend
app.post('/api/events', (req, res) => {
  const { id, name, dateTime, venue, description, registrationLink, tone } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Event name is required.' });
  }

  const eventId = id || `event-${Date.now()}`;
  const savedEvent = db.saveEvent({
    id: eventId,
    name,
    dateTime,
    venue,
    description,
    registrationLink,
    tone: tone || 'friendly'
  });

  res.json({ success: true, event: savedEvent });
});

// Campaign Generation API Endpoint (Server-Side Pipeline)
app.post('/api/campaign/generate', (req, res) => {
  const event = req.body;
  if (!event || !event.name) {
    return res.status(400).json({
      success: false,
      error: 'Event details with at least an event name are required.'
    });
  }

  try {
    const campaign = CampaignGenerator.generateAll(event);
    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      ...campaign
    });
  } catch (err) {
    console.error('Error generating campaign:', err);
    res.status(500).json({
      success: false,
      error: `Failed to generate campaign: ${err.message}`
    });
  }
});

// Attendee Registration Endpoint (Requirements 1 & 2)
app.post('/api/members/register', (req, res) => {
  const { name, phone, eventId, consent } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid member name (at least 2 characters).'
    });
  }

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Phone number with country code is required.'
    });
  }

  // Validate E.164 phone formatting
  const sanitized = whatsappService.sanitizePhoneNumber(phone);
  if (!sanitized.isValid) {
    return res.status(400).json({
      success: false,
      error: sanitized.error
    });
  }

  if (!eventId) {
    return res.status(400).json({
      success: false,
      error: 'Please select an event to register for.'
    });
  }

  // Explicit consent verification (strict requirement)
  if (consent !== true && consent !== 'true') {
    return res.status(400).json({
      success: false,
      error: 'Explicit consent is mandatory to receive event updates via WhatsApp.'
    });
  }

  // Lookup event details
  const event = db.getEventById(eventId);
  const eventName = event ? event.name : 'Registered Event';

  const memberRecord = {
    name: name.trim(),
    phone: sanitized.formatted,
    eventId,
    eventName,
    consent: true,
    consentTimestamp: new Date().toISOString()
  };

  const result = db.saveMember(memberRecord);

  res.status(201).json({
    success: true,
    message: result.isNew
      ? `Registration successful! You are now registered for "${eventName}".`
      : `Registration updated! You are confirmed for "${eventName}".`,
    member: result.member,
    isNew: result.isNew
  });
});

// -----------------------------------------------------------------------------
// Organizer Authentication Endpoints (Requirements 4 & 9)
// -----------------------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (!password || password !== ORGANIZER_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect organizer password. Access denied.'
    });
  }

  const token = generateToken({ role: 'organizer', loggedInAt: new Date().toISOString() });
  res.json({
    success: true,
    message: 'Authentication successful.',
    token,
    status: whatsappService.getStatus()
  });
});

app.get('/api/auth/verify', requireOrganizerAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    status: whatsappService.getStatus()
  });
});

// -----------------------------------------------------------------------------
// Protected Organizer Endpoints
// -----------------------------------------------------------------------------

// Get registered members (optionally filtered by event)
app.get('/api/organizer/members', requireOrganizerAuth, (req, res) => {
  const { eventId } = req.query;
  const members = db.getMembers(eventId || null);
  res.json({ success: true, count: members.length, members });
});

// Delete member
app.delete('/api/organizer/members/:id', requireOrganizerAuth, (req, res) => {
  const deleted = db.deleteMember(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }
  res.json({ success: true, message: 'Member registration removed.' });
});

// Organizer dashboard metrics
app.get('/api/organizer/stats', requireOrganizerAuth, (req, res) => {
  const stats = db.getStats();
  const waStatus = whatsappService.getStatus();
  res.json({ success: true, stats, whatsappStatus: waStatus });
});

// Delivery and activity logs
app.get('/api/organizer/logs', requireOrganizerAuth, (req, res) => {
  const { eventId } = req.query;
  const logs = db.getLogs(eventId || null);
  res.json({ success: true, count: logs.length, logs });
});

// Save custom direct WhatsApp log (protected)
app.post('/api/organizer/logs', requireOrganizerAuth, (req, res) => {
  const logEntry = req.body;
  const saved = db.saveLog(logEntry);
  res.json({ success: true, log: saved });
});

// Get current WhatsApp configuration (protected)
app.get('/api/whatsapp/config', requireOrganizerAuth, (req, res) => {
  res.json({ success: true, config: whatsappService.getStatus() });
});

// Update WhatsApp configuration & credentials (protected)
app.post('/api/whatsapp/config', requireOrganizerAuth, (req, res) => {
  const { token, phoneNumberId, businessAccountId, demoMode } = req.body;
  const updatedStatus = whatsappService.updateCredentials({
    token,
    phoneNumberId,
    businessAccountId,
    demoMode
  });
  res.json({
    success: true,
    message: updatedStatus.isDemoMode
      ? 'Demo Mode updated successfully.'
      : 'Live Meta WhatsApp Cloud API credentials updated.',
    config: updatedStatus
  });
});

// Test connection with Meta WhatsApp Cloud API (protected)
app.post('/api/whatsapp/test', requireOrganizerAuth, async (req, res) => {
  const result = await whatsappService.testConnection();
  res.json(result);
});

// Send WhatsApp Broadcast Updates (Requirements 4, 5, 7 & 8)
app.post('/api/whatsapp/send', requireOrganizerAuth, async (req, res) => {
  const {
    eventId,
    messageType = 'template',
    templateName = 'event_announcement',
    templateLanguage = 'en_US',
    announcementText = '',
    customText = ''
  } = req.body;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      error: 'Please select an event to broadcast to.'
    });
  }

  const event = db.getEventById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Selected event not found in database.'
    });
  }

  // Get all registered members for this event with verified consent
  const members = db.getMembers(eventId).filter(m => m.consent === true);

  if (members.length === 0) {
    return res.status(400).json({
      success: false,
      error: `No registered members with WhatsApp consent found for "${event.name}".`
    });
  }

  try {
    // Perform dispatch (live or demo simulation)
    const results = await whatsappService.broadcastToMembers(members, {
      eventName: event.name,
      venue: event.venue,
      messageType,
      templateName,
      templateLanguage,
      announcementText: announcementText || event.description,
      customText: customText || announcementText
    });

    // Save each dispatch attempt in database logs
    results.forEach(result => {
      db.saveLog({
        eventId: event.id,
        eventName: event.name,
        recipientName: result.recipientName,
        recipientPhone: result.phone,
        messageType,
        templateName: messageType === 'template' ? templateName : 'direct_text',
        status: result.status,
        metaMessageId: result.metaMessageId || null,
        details: result.details,
        directWhatsAppUrl: result.directWhatsAppUrl || null,
        isDemo: result.isDemo
      });
    });

    const summary = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      simulated: results.filter(r => r.status === 'simulated').length,
      failed: results.filter(r => r.status === 'failed').length,
      isDemoMode: whatsappService.isDemoMode
    };

    res.json({
      success: true,
      message: summary.isDemoMode
        ? `[DEMO MODE] Successfully simulated WhatsApp dispatch to ${summary.total} member(s).`
        : `WhatsApp broadcast completed. Dispatched to ${summary.sent} member(s).`,
      summary,
      results
    });

  } catch (err) {
    console.error('Error during WhatsApp broadcast:', err);
    res.status(500).json({
      success: false,
      error: `Internal server error during dispatch: ${err.message}`
    });
  }
});

// Default fallback to index.html for root path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  const waStatus = whatsappService.getStatus();
  console.log('====================================================');
  console.log(`🚀 Event Mate Server running at http://localhost:${PORT}`);
  console.log(`📡 Mode: ${waStatus.isDemoMode ? '🟡 DEMO MODE (Safe simulation)' : '🟢 LIVE MODE (Meta Cloud API)'}`);
  console.log(`🔐 Organizer Default Password: ${ORGANIZER_PASSWORD}`);
  console.log('====================================================');
});
