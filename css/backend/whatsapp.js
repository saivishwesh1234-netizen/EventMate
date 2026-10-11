/**
 * Event Mate - Meta WhatsApp Business Platform Cloud API Client
 * 
 * Supports:
 * 1. Official Meta WhatsApp Cloud API (Graph API v20.0)
 * 2. Approved WhatsApp Message Templates (Utility & Marketing announcements)
 * 3. 24h Customer Service Window Freeform Messages
 * 4. Honest Demo Mode: Simulates dispatch with detailed logs when credentials are not configured
 * 5. E.164 Phone Sanitization and validation
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.reloadConfig();
  }

  reloadConfig() {
    this.token = process.env.WHATSAPP_TOKEN ? process.env.WHATSAPP_TOKEN.trim() : '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ? process.env.WHATSAPP_PHONE_NUMBER_ID.trim() : '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? process.env.WHATSAPP_BUSINESS_ACCOUNT_ID.trim() : '';
    
    // Check if demo mode is explicitly requested or forced due to missing keys
    const demoModeEnv = (process.env.DEMO_MODE || '').toLowerCase();
    this.isDemoMode = demoModeEnv === 'true' || !this.token || !this.phoneNumberId;
  }

  /**
   * Update credentials dynamically and persist to .env
   */
  updateCredentials(config) {
    const { token, phoneNumberId, businessAccountId, demoMode } = config;
    if (token !== undefined) {
      this.token = String(token).trim();
      process.env.WHATSAPP_TOKEN = this.token;
    }
    if (phoneNumberId !== undefined) {
      this.phoneNumberId = String(phoneNumberId).trim();
      process.env.WHATSAPP_PHONE_NUMBER_ID = this.phoneNumberId;
    }
    if (businessAccountId !== undefined) {
      this.businessAccountId = String(businessAccountId).trim();
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = this.businessAccountId;
    }
    if (demoMode !== undefined) {
      this.isDemoMode = demoMode === true || demoMode === 'true';
      process.env.DEMO_MODE = String(this.isDemoMode);
    } else {
      this.isDemoMode = !this.token || !this.phoneNumberId;
      process.env.DEMO_MODE = String(this.isDemoMode);
    }

    // Persist to .env file if it exists
    try {
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        const updateVar = (key, val) => {
          const reg = new RegExp(`^${key}=.*$`, 'm');
          if (reg.test(envContent)) {
            envContent = envContent.replace(reg, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        };
        if (token !== undefined) updateVar('WHATSAPP_TOKEN', this.token);
        if (phoneNumberId !== undefined) updateVar('WHATSAPP_PHONE_NUMBER_ID', this.phoneNumberId);
        if (businessAccountId !== undefined) updateVar('WHATSAPP_BUSINESS_ACCOUNT_ID', this.businessAccountId);
        updateVar('DEMO_MODE', String(this.isDemoMode));
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (e) {
      console.warn('Could not persist updated credentials to .env:', e.message);
    }

    return this.getStatus();
  }

  /**
   * Test Meta Graph API credentials
   */
  async testConnection() {
    this.reloadConfig();
    if (!this.token || !this.phoneNumberId) {
      return {
        success: false,
        isDemoMode: true,
        error: 'Missing credentials: Both WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required.'
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error?.message || 'Meta Cloud API rejected connection verification.',
          details: data.error
        };
      }

      return {
        success: true,
        message: 'Connected to Meta WhatsApp Cloud API successfully!',
        details: {
          verifiedName: data.verified_name || 'Configured Meta Business',
          displayPhoneNumber: data.display_phone_number || this.phoneNumberId,
          codeVerificationStatus: data.code_verification_status || 'VERIFIED',
          qualityRating: data.quality_rating || 'UNKNOWN'
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Network error connecting to Meta Graph API: ${err.message}`
      };
    }
  }

  /**
   * Get current connection status for organizer dashboard
   */
  getStatus() {
    this.reloadConfig();
    return {
      isDemoMode: this.isDemoMode,
      hasToken: Boolean(this.token && this.token.length > 10),
      hasPhoneNumberId: Boolean(this.phoneNumberId && this.phoneNumberId.length > 5),
      phoneNumberId: this.phoneNumberId ? `...${this.phoneNumberId.slice(-4)}` : null,
      rawPhoneNumberId: this.phoneNumberId || '',
      businessAccountId: this.businessAccountId || '',
      maskedToken: this.token ? `${this.token.slice(0, 6)}...${this.token.slice(-4)}` : '',
      modeDescription: this.isDemoMode
        ? "Demo Mode Active — Messages are simulated safely without calling external APIs."
        : "Live Mode Active — Connected to Meta WhatsApp Business Cloud API."
    };
  }

  /**
   * Validate and sanitize phone number to E.164 format (e.g., +919876543210)
   */
  sanitizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, formatted: '', error: 'Phone number is required.' };
    }

    // Strip whitespaces, hyphens, and parenthesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Ensure it starts with a plus
    if (!cleaned.startsWith('+')) {
      // If starts with 00, replace with +
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.slice(2);
      } else {
        return {
          isValid: false,
          formatted: cleaned,
          error: 'Phone number must include country code with a leading + (e.g. +91 9876543210).'
        };
      }
    }

    // E.164 format regex: + followed by 10 to 15 digits
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    if (!e164Regex.test(cleaned)) {
      return {
        isValid: false,
        formatted: cleaned,
        error: `Invalid phone format "${cleaned}". Must follow E.164 format (+[country code][number], 10-15 digits).`
      };
    }

    return { isValid: true, formatted: cleaned, error: null };
  }

  /**
   * Format phone number for Meta API payload (digits only, no plus sign)
   */
  getMetaApiRecipient(formattedE164) {
    return formattedE164.replace('+', '');
  }

  /**
   * Send WhatsApp message to an individual recipient
   * 
   * @param {Object} options
   * @param {string} options.recipientPhone - E.164 phone number
   * @param {string} options.recipientName - Full name of attendee
   * @param {string} options.eventName - Name of event
   * @param {string} options.messageType - 'template' or 'text'
   * @param {string} options.templateName - Name of approved Meta template (e.g. 'event_announcement', 'hello_world')
   * @param {string} options.templateLanguage - Language code (default: 'en_US')
   * @param {Array<string>} options.templateParameters - Dynamic parameters {{1}}, {{2}}, etc.
   * @param {string} options.customText - Freeform text (used for text mode or fallback)
   */
  async sendMessage(options) {
    this.reloadConfig();

    const {
      recipientPhone,
      recipientName = 'Attendee',
      eventName = 'Event',
      messageType = 'template',
      templateName = 'event_announcement',
      templateLanguage = 'en_US',
      templateParameters = [],
      customText = ''
    } = options;

    // 1. Sanitize Phone
    const phoneCheck = this.sanitizePhoneNumber(recipientPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        status: 'failed',
        phone: recipientPhone,
        recipientName,
        details: phoneCheck.error,
        errorCode: 'INVALID_PHONE_FORMAT',
        isDemo: this.isDemoMode
      };
    }

    const cleanPhone = phoneCheck.formatted;
    const metaApiPhone = this.getMetaApiRecipient(cleanPhone);

    // Compute direct WhatsApp Web / Mobile URL for instant 1-click fallback
    const textForDirect = customText || (templateParameters.length > 0 ? `Hello ${recipientName}! Update for ${eventName}:\n${templateParameters[2] || ''}\nVenue: ${templateParameters[3] || ''}` : `Hello ${recipientName}! Update for ${eventName}`);
    const directWhatsAppUrl = `https://api.whatsapp.com/send?phone=${metaApiPhone}&text=${encodeURIComponent(textForDirect)}`;

    // 2. Demo Mode Simulation (Honest testing mode)
    if (this.isDemoMode) {
      // Simulate realistic network delay
      await new Promise(r => setTimeout(r, 150));

      const simulatedWamid = `wamid.DEMO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      return {
        success: true,
        status: 'simulated',
        phone: cleanPhone,
        recipientName,
        metaMessageId: simulatedWamid,
        details: 'Simulated delivery in Demo Mode. (No live Meta API credentials configured or DEMO_MODE=true).',
        isDemo: true,
        directWhatsAppUrl,
        sentPayload: {
          recipient: cleanPhone,
          messageType,
          template: messageType === 'template' ? templateName : null,
          content: messageType === 'template' ? `[Template: ${templateName}] Params: ${JSON.stringify(templateParameters)}` : customText
        }
      };
    }

    // 3. Live Mode: Dispatch to official Meta Cloud API
    try {
      const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
      let payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: metaApiPhone
      };

      if (messageType === 'template') {
        // Build template component parameters
        const bodyParameters = templateParameters.map(param => ({
          type: 'text',
          text: String(param)
        }));

        payload.type = 'template';
        payload.template = {
          name: templateName,
          language: { code: templateLanguage || 'en_US' }
        };

        // Default Meta sandbox test template "hello_world" takes no parameters
        if (templateName !== 'hello_world' && bodyParameters.length > 0) {
          payload.template.components = [
            {
              type: 'body',
              parameters: bodyParameters
            }
          ];
        }
      } else {
        // Freeform Direct Message (valid within 24hr user-initiated window)
        payload.type = 'text';
        payload.text = {
          preview_url: true,
          body: customText
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorInfo = responseData.error || {};
        const errorMessage = errorInfo.message || 'Meta Cloud API rejected the message dispatch.';
        const errorCode = errorInfo.code || response.status;
        const errorSubcode = errorInfo.error_subcode || '';

        console.error(`Meta WhatsApp API Error for ${cleanPhone}:`, errorInfo);

        let userFriendlyHelp = errorMessage;
        if (errorCode === 131030) {
          userFriendlyHelp = 'Recipient phone number is not registered in Meta Sandbox allowed recipient list.';
        } else if (errorCode === 132000) {
          userFriendlyHelp = `Template "${templateName}" does not exist or has not been approved in your Meta WhatsApp Manager.`;
        } else if (errorCode === 190) {
          userFriendlyHelp = 'Meta WhatsApp Access Token has expired or is invalid. Please generate a fresh token.';
        }

        return {
          success: false,
          status: 'failed',
          phone: cleanPhone,
          recipientName,
          details: `Meta API Error (${errorCode}): ${userFriendlyHelp}`,
          errorCode,
          errorSubcode,
          directWhatsAppUrl,
          isDemo: false
        };
      }

      const metaMessageId = responseData.messages?.[0]?.id || 'WAMID_SUCCESS';

      return {
        success: true,
        status: 'sent',
        phone: cleanPhone,
        recipientName,
        metaMessageId,
        details: 'Live message dispatched via Meta WhatsApp Business Cloud API.',
        directWhatsAppUrl,
        isDemo: false
      };

    } catch (networkError) {
      console.error(`Network error sending WhatsApp to ${cleanPhone}:`, networkError);
      return {
        success: false,
        status: 'failed',
        phone: cleanPhone,
        recipientName,
        details: `Network communication error: ${networkError.message}`,
        errorCode: 'NETWORK_ERROR',
        directWhatsAppUrl,
        isDemo: false
      };
    }
  }

  /**
   * Broadcast message to multiple registered members
   */
  async broadcastToMembers(members, broadcastOptions) {
    const results = [];
    
    for (const member of members) {
      // Build dynamic parameters if using templates
      // Template {{1}} = Member Name, {{2}} = Event Name, {{3}} = Announcement Body, {{4}} = Venue / Link
      const dynamicParams = [
        member.name,
        broadcastOptions.eventName || 'Event',
        broadcastOptions.announcementText || '',
        broadcastOptions.venue || ''
      ];

      // Personalized text replacement for direct text
      let personalizedText = broadcastOptions.customText || '';
      personalizedText = personalizedText
        .replace(/\{\{name\}\}/gi, member.name)
        .replace(/\{\{event\}\}/gi, broadcastOptions.eventName || 'Event')
        .replace(/\{\{venue\}\}/gi, broadcastOptions.venue || '');

      const sendResult = await this.sendMessage({
        recipientPhone: member.phone,
        recipientName: member.name,
        eventName: broadcastOptions.eventName,
        messageType: broadcastOptions.messageType || 'template',
        templateName: broadcastOptions.templateName || 'event_announcement',
        templateLanguage: broadcastOptions.templateLanguage || 'en_US',
        templateParameters: dynamicParams,
        customText: personalizedText
      });

      results.push({
        memberId: member.id,
        ...sendResult
      });
    }

    return results;
  }
}

module.exports = new WhatsAppService();
