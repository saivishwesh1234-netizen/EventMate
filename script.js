/**
 * Event Mate – Smart Event Communication Generator
 * Main Application Controller & Content Generation Engine
 * 
 * Implements:
 * - Dynamic Multilingual & Tone-aware Generation Engine (All 6 content types)
 * - Event Form Validation & Sample Preset Fillers
 * - Clipboard Management & Live Content In-Place Editor
 * - WhatsApp URL Encoder & Mailto Email Draft Launcher
 * - Suggested Reminder Date Calculator
 * - LocalStorage & Optional Firebase Firestore Data Persistence
 * - Single-Page Screen Routing & Toast Notification System
 */

const EventMateApp = {
  // Application State
  state: {
    currentScreen: 'home',
    currentEvent: null,
    generatedItems: [], // Array of content cards
    savedEvents: [],
    activeCategoryFilter: 'all',
    editStates: {},
    currentUser: null,
    isFirebaseConnected: false
  },

  // Sample Presets for 1-Click Demo & Hackathon Testing
  presets: {
    hackathon: {
      eventName: "HackTech 2026: 24-Hour AI & Web3 Hackathon",
      category: "Hackathon",
      organizer: "Google Developer Student Club & Dept of CSE",
      eventDate: "2026-11-15",
      startTime: "09:00",
      endTime: "18:00",
      venue: "Main Auditorium & Innovation Lab, Tech Campus (or Online on Discord)",
      description: "Build cutting-edge AI and decentralized applications in an intensive 24-hour sprint. Mentors from top tech companies, cash prizes worth ₹1,00,000, free food, and schwag kits for all shortlisted participants!",
      targetAudience: "Engineering students, developers, designers, and tech enthusiasts",
      registrationLink: "https://eventmate.dev/hacktech2026",
      contactInfo: "hacktech@college.edu | +91 98765 43210",
      additionalInfo: "Free entry. Bring your laptops, chargers, and college ID cards. Participation certificates provided to all teams.",
      tone: "Exciting",
      language: "English"
    },
    workshop: {
      eventName: "Hands-on Masterclass: Cloud & Docker Essentials",
      category: "Workshop",
      organizer: "College Open Source Society",
      eventDate: "2026-10-30",
      startTime: "14:00",
      endTime: "17:00",
      venue: "Computer Science Lab 3 & Live Zoom Stream",
      description: "Learn how to containerize web applications using Docker, write multi-stage Dockerfiles, and deploy directly to AWS and Google Cloud with live industry examples.",
      targetAudience: "2nd, 3rd, and 4th year CSE/IT students and aspiring DevOps engineers",
      registrationLink: "https://eventmate.dev/docker-workshop",
      contactInfo: "opensource@college.edu | +91 91234 56789",
      additionalInfo: "No prior Docker experience required. Basic terminal knowledge recommended. E-certificates upon completion.",
      tone: "Professional",
      language: "English"
    },
    fest: {
      eventName: "Tarang 2026: Annual Inter-College Cultural Fest",
      category: "Fest",
      organizer: "Student Activity Council (SAC)",
      eventDate: "2026-12-05",
      startTime: "10:00",
      endTime: "22:00",
      venue: "University Open Air Amphitheatre & Sports Complex",
      description: "Three days of electrifying music, dance battles, street play championships, fashion shows, and celebrity star night performances! Over 40+ universities participating.",
      targetAudience: "All college students, alumni, and faculty members",
      registrationLink: "https://eventmate.dev/tarang2026",
      contactInfo: "culturalfest@university.edu | +91 99887 76655",
      additionalInfo: "College ID mandatory at entrance. Entry tickets ₹100 for non-students. Food stalls and gaming zones open all day.",
      tone: "Friendly",
      language: "English"
    }
  },

  /**
   * Initialize Application
   */
  init() {
    this.bindEvents();
    this.loadSavedEvents();
    this.initFirebaseIntegration();
    this.setDefaultDateTime();
    this.updateDashboardStats();

    // If URL has a hash, route to it
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'create', 'generated', 'events', 'about', 'help'].includes(hash)) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('home');
    }

    console.info("🚀 Event Mate initialized successfully!");
  },

  /**
   * Bind DOM Events
   */
  bindEvents() {
    // Nav Links
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const route = el.getAttribute('data-route');
        this.navigateTo(route);
      });
    });

    // Mobile Menu Toggle
    const mobileBtn = document.getElementById('btn-mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener('click', () => {
        navMenu.classList.toggle('show');
      });
    }

    // Form Submission
    const eventForm = document.getElementById('event-details-form');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Preset Buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        this.fillPreset(presetKey);
      });
    });

    // Clear Form Button
    const clearBtn = document.getElementById('btn-clear-form');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearForm());
    }

    // Filter Tabs on Generated Screen
    document.querySelectorAll('[data-filter]').forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.getAttribute('data-filter');
        this.filterGeneratedContent(category);
      });
    });

    // Global Actions
    const downloadAllBtn = document.getElementById('btn-download-all');
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => this.downloadAllContent());
    }

    const generateAgainBtn = document.getElementById('btn-generate-again');
    if (generateAgainBtn) {
      generateAgainBtn.addEventListener('click', () => {
        if (this.state.currentEvent) {
          this.generateAllContent(this.state.currentEvent);
          this.showToast("All communication content refreshed!", "success");
        }
      });
    }

    const saveEventBtn = document.getElementById('btn-save-event');
    if (saveEventBtn) {
      saveEventBtn.addEventListener('click', () => {
        if (this.state.currentEvent) {
          this.saveEvent(this.state.currentEvent, this.state.generatedItems);
        }
      });
    }

    // Status Pill click
    const statusPill = document.getElementById('status-pill');
    if (statusPill) {
      statusPill.addEventListener('click', () => this.openStatusModal());
    }

    // Real-time input validation clear
    const formInputs = document.querySelectorAll('#event-details-form input, #event-details-form textarea, #event-details-form select');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
        const errEl = document.getElementById(`err-${input.id}`);
        if (errEl) errEl.classList.remove('visible');
      });
    });
  },

  /**
   * Screen Navigation Router
   */
  navigateTo(screenId) {
    this.state.currentScreen = screenId;
    window.location.hash = screenId;

    // Toggle screen container visibility
    const screens = ['home', 'create', 'generated', 'events', 'about', 'help'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s === screenId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-route') === screenId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile menu if open
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('show');

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh dashboard stats if entering events screen
    if (screenId === 'events') {
      this.renderSavedEventsList();
      this.updateDashboardStats();
    }
  },

  /**
   * Set default event date & time (tomorrow at 10:00 AM)
   */
  setDefaultDateTime() {
    const dateInput = document.getElementById('eventDate');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    if (startTimeInput && !startTimeInput.value) {
      startTimeInput.value = "10:00";
    }
    if (endTimeInput && !endTimeInput.value) {
      endTimeInput.value = "16:00";
    }
  },

  /**
   * Fill Sample Preset Data
   */
  fillPreset(presetKey) {
    const data = this.presets[presetKey];
    if (!data) return;

    document.getElementById('eventName').value = data.eventName;
    document.getElementById('category').value = data.category;
    document.getElementById('organizer').value = data.organizer;
    document.getElementById('eventDate').value = data.eventDate;
    document.getElementById('startTime').value = data.startTime;
    document.getElementById('endTime').value = data.endTime;
    document.getElementById('venue').value = data.venue;
    document.getElementById('description').value = data.description;
    document.getElementById('targetAudience').value = data.targetAudience;
    document.getElementById('registrationLink').value = data.registrationLink;
    document.getElementById('contactInfo').value = data.contactInfo;
    document.getElementById('additionalInfo').value = data.additionalInfo;
    document.getElementById('tone').value = data.tone;
    document.getElementById('language').value = data.language;

    // Clear previous error highlights
    document.querySelectorAll('#event-details-form .error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error-msg').forEach(el => el.classList.remove('visible'));

    this.showToast(`Loaded "${data.eventName}" sample data!`, 'info');
  },

  /**
   * Clear Form
   */
  clearForm() {
    document.getElementById('event-details-form').reset();
    this.setDefaultDateTime();
    document.querySelectorAll('#event-details-form .error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error-msg').forEach(el => el.classList.remove('visible'));
    this.showToast("Form cleared.", "info");
  },

  /**
   * Form Submission Handler & Validator
   */
  handleFormSubmit() {
    const requiredFields = [
      { id: 'eventName', name: 'Event Name' },
      { id: 'category', name: 'Event Category' },
      { id: 'organizer', name: 'Organizer / Organization' },
      { id: 'eventDate', name: 'Event Date' },
      { id: 'startTime', name: 'Start Time' },
      { id: 'venue', name: 'Venue / Meeting Link' },
      { id: 'description', name: 'Event Description' }
    ];

    let hasErrors = false;
    let firstErrorField = null;

    requiredFields.forEach(field => {
      const el = document.getElementById(field.id);
      const val = el ? el.value.trim() : '';
      const errEl = document.getElementById(`err-${field.id}`);

      if (!val) {
        hasErrors = true;
        if (el) el.classList.add('error');
        if (errEl) {
          errEl.textContent = `Please enter ${field.name}.`;
          errEl.classList.add('visible');
        }
        if (!firstErrorField) firstErrorField = el;
      } else {
        if (el) el.classList.remove('error');
        if (errEl) errEl.classList.remove('visible');
      }
    });

    if (hasErrors) {
      if (firstErrorField) firstErrorField.focus();
      this.showToast("Please fill in all required fields marked with *", "danger");
      return;
    }

    // Extract Event Details Object
    const eventData = {
      id: this.state.currentEvent && this.state.currentEvent.id ? this.state.currentEvent.id : 'evt_' + Date.now(),
      eventName: document.getElementById('eventName').value.trim(),
      category: document.getElementById('category').value,
      organizer: document.getElementById('organizer').value.trim(),
      eventDate: document.getElementById('eventDate').value,
      startTime: document.getElementById('startTime').value,
      endTime: document.getElementById('endTime').value.trim(),
      venue: document.getElementById('venue').value.trim(),
      description: document.getElementById('description').value.trim(),
      targetAudience: document.getElementById('targetAudience').value.trim(),
      registrationLink: document.getElementById('registrationLink').value.trim(),
      contactInfo: document.getElementById('contactInfo').value.trim(),
      additionalInfo: document.getElementById('additionalInfo').value.trim(),
      tone: document.getElementById('tone').value,
      language: document.getElementById('language').value,
      createdAt: new Date().toISOString()
    };

    this.state.currentEvent = eventData;

    // Generate All 6 Content Types
    this.generateAllContent(eventData);

    // Auto-save to localStorage
    this.saveEvent(eventData, this.state.generatedItems, false);

    // Navigate to Generated Content screen
    this.navigateTo('generated');
    this.showToast("Generated all 6 communication kits successfully!", "success");
  },

  /**
   * Format Date Display
   */
  formatDate(dateStr) {
    if (!dateStr) return "[Date to be announced]";
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Format Time Display (converts 24h to 12h AM/PM)
   */
  formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  },

  /**
   * Calculate Suggested Reminder Date
   */
  getSuggestedDate(eventDateStr, daysBefore) {
    if (!eventDateStr) return "N/A";
    try {
      const parts = eventDateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() - daysBefore);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return "N/A";
    }
  },

  /**
   * Content Generation Engine (Multilingual & Tone-Aware)
   * Generates all 6 categories:
   * 1. Event Captions
   * 2. Announcements
   * 3. Email Invitations
   * 4. WhatsApp Messages
   * 5. Event Reminders
   * 6. Frequently Asked Questions (FAQs)
   */
  generateAllContent(evt) {
    const formattedDate = this.formatDate(evt.eventDate);
    const timeFormatted = evt.endTime 
      ? `${this.formatTime(evt.startTime)} – ${this.formatTime(evt.endTime)}`
      : this.formatTime(evt.startTime);
    
    const regLink = evt.registrationLink || "[Organizer Note: Registration link to be provided]";
    const contact = evt.contactInfo || "[Organizer Note: Contact details to be provided]";
    const audience = evt.targetAudience || "Students, professionals, and enthusiasts";
    const addl = evt.additionalInfo || "All participants are requested to arrive 15 minutes before the start time.";
    
    const isTelugu = evt.language === "Telugu";
    const isHindi = evt.language === "Hindi";

    const items = [];

    // =========================================================================
    // 1. EVENT CAPTIONS (Social Media, Headlines, Hashtags)
    // =========================================================================
    let igCaption = "";
    let liCaption = "";
    let xCaption = "";
    let headlines = "";
    let hashtags = "";

    const categoryTag = evt.category.toLowerCase().replace(/[^a-z0-9]/g, '');
    hashtags = `#${categoryTag} #EventMate #CollegeEvent #${evt.eventName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)} #CampusLife #Networking #RegisterNow`;

    if (isTelugu) {
      igCaption = `✨ మీరంతా ఎదురుచూస్తున్న శుభవార్త! 🎉\n\n${evt.organizer} సమర్పిస్తున్న "${evt.eventName}" లో పాల్గొనడానికి సిద్ధంగా ఉన్నారా?\n\n📅 తేదీ: ${formattedDate}\n⏰ సమయం: ${timeFormatted}\n📍 వేదిక: ${evt.venue}\n\n👉 ముఖ్య వివరాలు: ${evt.description}\n\nఇప్పుడే రిజిస్టర్ చేసుకోండి, మీ స్నేహితులతో పంచుకోండి! 🚀\n🔗 రిజిస్ట్రేషన్ లింక్: ${regLink}\n\n${hashtags}`;
      
      liCaption = `నమస్కారం! మా సంస్థ/కళాశాల ${evt.organizer} తరపున "${evt.eventName}" నిర్వహించబోతున్నందుకు గర్విస్తున్నాము.\n\nఈ ఈవెంట్ ద్వారా ${audience} కు కొత్త విషయాలు నేర్చుకునే మరియు నెట్‌వర్కింగ్ చేసుకునే చక్కని అవకాశం లభిస్తుంది.\n\n• వేదిక: ${evt.venue}\n• తేదీ: ${formattedDate}\n• సమయం: ${timeFormatted}\n\nపూర్తి వివరాలు మరియు రిజిస్ట్రేషన్ కొరకు: ${regLink}\nసంప్రదించండి: ${contact}`;
      
      xCaption = `📢 సిద్ధంగా ఉండండి! ${evt.organizer} ఆధ్వర్యంలో "${evt.eventName}"!\n📅 ${formattedDate} | 📍 ${evt.venue}\n🔗 వెంటనే నమోదు చేసుకోండి: ${regLink}\n${hashtags}`;
      
      headlines = `1. 🔥 "${evt.eventName}" – అద్భుతమైన అవకాశం, మిస్ అవ్వకండి!\n2. 💡 ${formattedDate} నాడు మీ ప్రతిభను నిరూపించుకోండి!\n3. 🎯 ఒకే ఒక క్లిక్‌తో "${evt.eventName}" లో మీ స్థానాన్ని ఖరారు చేసుకోండి!`;
    } else if (isHindi) {
      igCaption = `✨ क्या आप तैयार हैं? 🎉\n\n${evt.organizer} प्रस्तुत करते हैं: "${evt.eventName}"!\n\n📅 दिनांक: ${formattedDate}\n⏰ समय: ${timeFormatted}\n📍 स्थान: ${evt.venue}\n\n💡 संक्षिप्त विवरण: ${evt.description}\n\nसीटें सीमित हैं! आज ही अपना पंजीकरण सुनिश्चित करें: 🚀\n🔗 लिंक: ${regLink}\n\n${hashtags}`;
      
      liCaption = `हमें यह घोषणा करते हुए बेहद खुशी हो रही है कि ${evt.organizer} द्वारा "${evt.eventName}" का आयोजन किया जा रहा है।\n\nयह कार्यक्रम ${audience} के लिए कौशल निखारने और नए संबंध बनाने का एक सुनहरा अवसर है।\n\n• स्थान: ${evt.venue}\n• दिनांक: ${formattedDate} (${timeFormatted})\n• पंजीकरण: ${regLink}\n\nअधिक जानकारी के लिए संपर्क करें: ${contact}`;
      
      xCaption = `🚀 आ रहा है "${evt.eventName}"! ${evt.organizer} के साथ जुड़ें।\n📅 ${formattedDate} | 📍 ${evt.venue}\n🔗 अभी रजिस्टर करें: ${regLink}\n${hashtags}`;
      
      headlines = `1. 🚀 "${evt.eventName}" – सीखें, जुड़ें और आगे बढ़ें!\n2. 🌟 ${formattedDate} को कुछ नया अनुभव करें!\n3. 🎯 अपनी सीट अभी सुरक्षित करें: ${evt.eventName}!`;
    } else {
      // English (Tone variants)
      const tone = evt.tone || "Exciting";
      if (tone === "Professional" || tone === "Formal") {
        igCaption = `Join us for ${evt.eventName}, organized by ${evt.organizer}.\n\nAn exceptional opportunity designed specifically for ${audience}.\n\n🗓️ Date: ${formattedDate}\n🕒 Time: ${timeFormatted}\n📍 Location: ${evt.venue}\n\nKey Highlights:\n${evt.description}\n\nSecure your participation today:\n🔗 Register: ${regLink}\n\n${hashtags}`;
        
        liCaption = `We are pleased to announce ${evt.eventName}, hosted by ${evt.organizer}.\n\nThis initiative aims to bring together ${audience} for insightful sessions and professional development.\n\nKey Event Details:\n• Date: ${formattedDate}\n• Time: ${timeFormatted}\n• Venue: ${evt.venue}\n• Overview: ${evt.description}\n\nTo reserve your seat, please register via the official link:\n${regLink}\n\nInquiries: ${contact}\n\n${hashtags}`;
        
        xCaption = `Announcement: Join us for ${evt.eventName} hosted by ${evt.organizer}.\n📅 ${formattedDate} | 📍 ${evt.venue}\nRegister here: ${regLink}\n${hashtags}`;
      } else {
        // Exciting / Friendly
        igCaption = `🚨 BIG ANNOUNCEMENT! 🚨\n\nAre you ready for ${evt.eventName}? Brought to you by ${evt.organizer}! 🎉\n\nHere's what you need to know:\n📅 Date: ${formattedDate}\n⏰ Time: ${timeFormatted}\n📍 Venue: ${evt.venue}\n\n🔥 What to expect:\n${evt.description}\n\nTag your friends and reserve your spot before registrations close!\n🔗 Register here: ${regLink}\n\n${hashtags}`;
        
        liCaption = `Exciting news! ${evt.organizer} is hosting ${evt.eventName}.\n\nWhether you're looking to upgrade your skills, network with peers, or be part of an inspiring community of ${audience}, this is the place to be.\n\n🗓️ Date: ${formattedDate} (${timeFormatted})\n📍 Location: ${evt.venue}\n\nRegistration link in description:\n👉 ${regLink}\n\nContact organizer: ${contact}\n\n${hashtags}`;
        
        xCaption = `Get ready for ${evt.eventName}! 🚀\nHosted by ${evt.organizer}\n📅 ${formattedDate} at ${timeFormatted}\n📍 ${evt.venue}\nGrab your spot now 👇\n${regLink}\n${hashtags}`;
      }

      headlines = `1. 🚀 Master Your Skills at "${evt.eventName}" – Don't Miss Out!\n2. ⚡ ${evt.organizer} Presents: ${evt.eventName} on ${formattedDate}!\n3. 🎯 Level Up With ${audience} – Register for "${evt.eventName}" Today!`;
    }

    items.push({
      id: 'cap_ig',
      category: 'captions',
      categoryName: 'Event Captions',
      iconClass: 'fa-brands fa-instagram',
      iconTheme: 'social',
      title: 'Instagram Post Caption',
      content: igCaption,
      categoryFilter: 'captions'
    });

    items.push({
      id: 'cap_li',
      category: 'captions',
      categoryName: 'Event Captions',
      iconClass: 'fa-brands fa-linkedin',
      iconTheme: 'social',
      title: 'LinkedIn Professional Post',
      content: liCaption,
      categoryFilter: 'captions'
    });

    items.push({
      id: 'cap_x',
      category: 'captions',
      categoryName: 'Event Captions',
      iconClass: 'fa-brands fa-x-twitter',
      iconTheme: 'social',
      title: 'Twitter / X Short Update',
      content: xCaption,
      categoryFilter: 'captions'
    });

    items.push({
      id: 'cap_headlines',
      category: 'captions',
      categoryName: 'Event Captions',
      iconClass: 'fa-solid fa-bullhorn',
      iconTheme: 'social',
      title: 'Promotional Catchy Headlines & Hashtags',
      content: `${headlines}\n\nRecommended Hashtags:\n${hashtags}`,
      categoryFilter: 'captions'
    });

    // =========================================================================
    // 2. ANNOUNCEMENTS (College Circular, Student Club, Short Blast)
    // =========================================================================
    let collegeNotice = "";
    let clubNotice = "";
    let shortBlast = "";

    if (isTelugu) {
      collegeNotice = `కళాశాల అధికారిక ప్రకటన / నోటీసు\nరెఫరెన్స్ సంఖ్య: EVT/${new Date().getFullYear()}/001\nతేదీ: ${new Date().toLocaleDateString('te-IN')}\n\nవిషయం: "${evt.eventName}" నిర్వహణ గురించి\n\nమా సంస్థ/కళాశాల విద్యార్థులు మరియు అధ్యాపకులకు తెలియజేయునది ఏమనగా, ${evt.organizer} ఆధ్వర్యంలో "${evt.eventName}" నిర్వహించబడుతుంది.\n\nకార్యక్రమ వివరాలు:\n• ఈవెంట్ పేరు: ${evt.eventName}\n• విభాగం: ${evt.category}\n• నిర్వహణ తేదీ: ${formattedDate}\n• సమయం: ${timeFormatted}\n• వేదిక: ${evt.venue}\n• అర్హత: ${audience}\n• వివరాలు: ${evt.description}\n• అదనపు సమాచారం: ${addl}\n\nఆసక్తి గల అభ్యర్థులు క్రింది లింక్ ద్వారా నమోదు చేసుకోవాల్సిందిగా కోరడమైనది:\nరిజిస్ట్రేషన్ లింక్: ${regLink}\n\nసందేహాలున్నచో సంప్రదించండి: ${contact}\n\nభవదీయులు,\n${evt.organizer}\nకళాశాల పాలకమండలి`;

      clubNotice = `హే క్లబ్ మిత్రులారా! 👋\n\nమన ${evt.organizer} తరపున ఎంతో ప్రతిష్టాత్మకమైన "${evt.eventName}" ను ప్రకటించడం ఎంతో సంతోషంగా ఉంది! 🎉\n\nఇందులో ఎన్నో అద్భుతమైన అవకాశాలు ఉన్నాయి. మీరంతా ఉత్సాహంగా పాల్గొని విజయవంతం చేయాలని కోరుతున్నాము.\n\n📅 తేదీ: ${formattedDate}\n⏰ సమయం: ${timeFormatted}\n📍 వేదిక: ${evt.venue}\n🔗 ఇప్పుడే రిజిస్టర్ చేసుకోండి: ${regLink}\n\nరండి, కలిసి నేర్చుకుందాం! 🚀`;

      shortBlast = `⚡ అత్యవసర ప్రకటన: "${evt.eventName}" రిజిస్ట్రేషన్లు ప్రారంభమయ్యాయి! తేదీ: ${formattedDate} | వేదిక: ${evt.venue}. వెంటనే మీ పేరు నమోదు చేసుకోండి: ${regLink}`;
    } else if (isHindi) {
      collegeNotice = `आधिकारिक सूचना / परिपत्र\nसंदर्भ सं.: EVT/${new Date().getFullYear()}/001\nदिनांक: ${new Date().toLocaleDateString('hi-IN')}\n\nविषय: "${evt.eventName}" के आयोजन के संबंध में\n\nसभी छात्रों एवं संकाय सदस्यों को सूचित किया जाता है कि ${evt.organizer} द्वारा "${evt.eventName}" का आयोजन किया जा रहा है।\n\nकार्यक्रम का विवरण निम्नानुसार है:\n• आयोजन: ${evt.eventName}\n• श्रेणी: ${evt.category}\n• दिनांक: ${formattedDate}\n• समय: ${timeFormatted}\n• स्थान: ${evt.venue}\n• लक्षित प्रतिभागी: ${audience}\n• विवरण: ${evt.description}\n• अन्य निर्देश: ${addl}\n\nइच्छुक प्रतिभागी दिए गए लिंक पर पंजीकरण करें:\nपंजीकरण लिंक: ${regLink}\n\nसंपर्क: ${contact}\n\nहस्ताक्षर,\n${evt.organizer}`;

      clubNotice = `नमस्ते दोस्तों! 👋\n\nहमारे ${evt.organizer} क्लब की तरफ से बहुप्रतीक्षित "${evt.eventName}" की घोषणा करते हुए हमें अपार हर्ष हो रहा है! 🎉\n\nकुछ नया सीखने और दोस्तों के साथ बेहतरीन समय बिताने के लिए तैयार हो जाइए।\n\n📅 दिनांक: ${formattedDate}\n⏰ समय: ${timeFormatted}\n📍 स्थान: ${evt.venue}\n🔗 पंजीकरण लिंक: ${regLink}\n\nजल्दी करें, सीटें सीमित हैं! 🚀`;

      shortBlast = `⚡ त्वरित सूचना: "${evt.eventName}" के लिए पंजीकरण खुले हैं! दिनांक: ${formattedDate} | स्थान: ${evt.venue}। अभी रजिस्टर करें: ${regLink}`;
    } else {
      collegeNotice = `OFFICIAL INSTITUTIONAL CIRCULAR\nCircular Ref: EVT/${new Date().getFullYear()}/CIR-108\nDate: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nSubject: Conduct of "${evt.eventName}" – Registration and Participation\n\nThis is to formally notify all departments, faculty members, and students that ${evt.organizer} is organizing "${evt.eventName}" (${evt.category}).\n\nEvent Schedule & Particulars:\n1. Event Title: ${evt.eventName}\n2. Category: ${evt.category}\n3. Date: ${formattedDate}\n4. Timing: ${timeFormatted}\n5. Venue: ${evt.venue}\n6. Target Group: ${audience}\n7. Objectives: ${evt.description}\n8. General Guidelines: ${addl}\n\nEligible and interested candidates are instructed to complete their registration via the official portal link below on or before the due date:\nRegistration URL: ${regLink}\n\nFor administrative inquiries, contact: ${contact}\n\nBy Order,\nAuthorized Signatory\n${evt.organizer}`;

      clubNotice = `Hey everyone! 👋✨\n\nThe wait is finally over! ${evt.organizer} is super pumped to announce our flagship event: "${evt.eventName}"! 🎊\n\nHere is your chance to learn, compete, and connect with awesome peers from across the campus.\n\n📌 Quick Recap:\n📅 Date: ${formattedDate}\n⏰ Time: ${timeFormatted}\n📍 Venue: ${evt.venue}\n👥 Who can join: ${audience}\n\nSeats fill up fast on a first-come, first-served basis, so grab your spot right away:\n👉 Registration Link: ${regLink}\n\nQuestions? Reach out to us at: ${contact}\n\nSee you there! 🚀`;

      shortBlast = `📢 QUICK BLAST: Registrations are officially OPEN for "${evt.eventName}"! 🚀 Date: ${formattedDate} | Venue: ${evt.venue}. Don't miss out, register now: ${regLink}`;
    }

    items.push({
      id: 'ann_college',
      category: 'announcements',
      categoryName: 'Announcements',
      iconClass: 'fa-solid fa-landmark',
      iconTheme: 'announce',
      title: 'Formal College Announcement (Official Circular)',
      content: collegeNotice,
      categoryFilter: 'announcements'
    });

    items.push({
      id: 'ann_club',
      category: 'announcements',
      categoryName: 'Announcements',
      iconClass: 'fa-solid fa-users',
      iconTheme: 'announce',
      title: 'Student Club Announcement (Friendly & Engaging)',
      content: clubNotice,
      categoryFilter: 'announcements'
    });

    items.push({
      id: 'ann_blast',
      category: 'announcements',
      categoryName: 'Announcements',
      iconClass: 'fa-solid fa-bolt',
      iconTheme: 'announce',
      title: 'Short Promotional Announcement (Quick Blast)',
      content: shortBlast,
      categoryFilter: 'announcements'
    });

    // =========================================================================
    // 3. EMAIL INVITATIONS (Professional Email Draft with Mailto Link)
    // =========================================================================
    let emailSubject = "";
    let emailGreeting = "";
    let emailBody = "";

    if (isTelugu) {
      emailSubject = `ఆహ్వానం: ${evt.eventName} – ${formattedDate}`;
      emailGreeting = `గౌరవనీయులైన ఆహ్వానితులకు,`;
      emailBody = `${emailGreeting}\n\n${evt.organizer} తరపున మీకు హృదయపూర్వక నమస్కారాలు. మా ఆధ్వర్యంలో జరగనున్న "${evt.eventName}" కార్యక్రమానికి మిమ్మల్ని సాదరంగా ఆహ్వానిస్తున్నాము.\n\nఈ కార్యక్రమం ${audience} ను దృష్టిలో ఉంచుకొని ప్రత్యేకంగా రూపొందించబడింది.\n\nకార్యక్రమ వివరాలు:\n• ఈవెంట్: ${evt.eventName}\n• తేదీ: ${formattedDate}\n• సమయం: ${timeFormatted}\n• వేదిక: ${evt.venue}\n• ముఖ్యాంశాలు: ${evt.description}\n• అదనపు వివరాలు: ${addl}\n\nదయచేసి ఈ క్రింది లింక్ ద్వారా మీ రిజిస్ట్రేషన్‌ను పూర్తి చేసుకోండి:\n${regLink}\n\nఏవైనా సందేహాలుంటే మా సమన్వయకర్తలను సంప్రదించండి:\n${contact}\n\nమీ రాక కొరకు ఎదురుచూస్తూ,\n${evt.organizer}`;
    } else if (isHindi) {
      emailSubject = `निमंत्रण: "${evt.eventName}" में शामिल हों – ${formattedDate}`;
      emailGreeting = `सादर अभिवादन,`;
      emailBody = `${emailGreeting}\n\n${evt.organizer} की ओर से हार्दिक शुभकामनाएं। हमें आपको आगामी कार्यक्रम "${evt.eventName}" में सादर आमंत्रित करते हुए अत्यंत प्रसन्नता हो रही है।\n\nयह कार्यक्रम विशेष रूप से ${audience} के लिए आयोजित किया गया है।\n\nआयोजन विवरण:\n• कार्यक्रम: ${evt.eventName}\n• दिनांक: ${formattedDate}\n• समय: ${timeFormatted}\n• स्थान: ${evt.venue}\n• मुख्य विषय: ${evt.description}\n• महत्वपूर्ण निर्देश: ${addl}\n\nकृपया दिए गए लिंक के माध्यम से अपना पंजीकरण पूरा करें:\n${regLink}\n\nकिसी भी सहायता या प्रश्न के लिए संपर्क करें:\n${contact}\n\nसादर,\n${evt.organizer}`;
    } else {
      emailSubject = `[Invitation] Join us for ${evt.eventName} – ${formattedDate}`;
      emailGreeting = `Dear Participant,`;
      emailBody = `${emailGreeting}\n\nOn behalf of ${evt.organizer}, we are delighted to invite you to "${evt.eventName}".\n\nThis event has been specially curated for ${audience} to deliver valuable insights, hands-on learning, and meaningful connections.\n\nEVENT DETAILS AT A GLANCE:\n• Event Name: ${evt.eventName}\n• Category: ${evt.category}\n• Date: ${formattedDate}\n• Time: ${timeFormatted}\n• Venue / Platform: ${evt.venue}\n\nABOUT THE EVENT:\n${evt.description}\n\nIMPORTANT PARTICIPANT INSTRUCTIONS:\n${addl}\n\nHOW TO REGISTER:\nSpaces are allocated on a prioritized basis. Please secure your attendance by completing the registration form below:\n👉 ${regLink}\n\nIf you have any questions or require special accommodations, feel free to contact us:\n${contact}\n\nWe look forward to welcoming you!\n\nWarm regards,\nEvent Organizing Team\n${evt.organizer}`;
    }

    items.push({
      id: 'email_invite',
      category: 'email',
      categoryName: 'Email Invitations',
      iconClass: 'fa-solid fa-envelope',
      iconTheme: 'email',
      title: 'Complete Professional Email Invitation',
      content: `Subject: ${emailSubject}\n\n${emailBody}`,
      emailSubject: emailSubject,
      emailBody: emailBody,
      hasEmailAction: true,
      categoryFilter: 'email'
    });

    // =========================================================================
    // 4. WHATSAPP MESSAGES (Short, Detailed, Reg Reminder, Event Day)
    // =========================================================================
    let waShort = "";
    let waDetailed = "";
    let waReminder = "";
    let waEventDay = "";

    if (isTelugu) {
      waShort = `హాయ్! 👋 ${evt.organizer} తరపున *${evt.eventName}* నిర్వహిస్తున్నారు! 🚀\n📅 తేదీ: ${formattedDate}\n📍 వేదిక: ${evt.venue}\n🔗 ఇప్పుడే రిజిస్టర్ చేసుకోండి: ${regLink}\nస్నేహితులతో పంచుకోండి!`;

      waDetailed = `🌟 *మీకు ఆహ్వానం: ${evt.eventName}!* 🌟\n\n${evt.organizer} ఆధ్వర్యంలో జరుగుతున్న ఈవెంట్ వివరాలు:\n\n📅 *తేదీ:* ${formattedDate}\n⏰ *సమయం:* ${timeFormatted}\n📍 *వేదిక:* ${evt.venue}\n🎯 *అర్హత:* ${audience}\n\n💡 *వివరాలు:*\n${evt.description}\n\n📌 *సూచనలు:* ${addl}\n\n🔗 *నమోదు చేసుకోండి:* ${regLink}\n📞 *సంప్రదించండి:* ${contact}\n\nతప్పక పాల్గొనండి! 👍`;

      waReminder = `⏰ *రిమైండర్: ${evt.eventName} రిజిస్ట్రేషన్లు త్వరలో ముగుస్తాయి!* ⏰\n\n${formattedDate} నాడు జరగబోయే ఈ ఈవెంట్‌లో మీ స్థానాన్ని ఖరారు చేసుకోండి.\n👉 వెంటనే క్లిక్ చేయండి: ${regLink}\nసందేహాలకు: ${contact}`;

      waEventDay = `🎉 *ఈరోజే ఈవెంట్! ${evt.eventName}!* 🎉\n\nసమయం: ${timeFormatted}\nవేదిక: ${evt.venue}\nదయచేసి 15 నిమిషాల ముందుగా చేరుకోండి. మిమ్మల్ని కలవడానికి ఎదురుచూస్తున్నాము! 🚀`;
    } else if (isHindi) {
      waShort = `नमस्ते! 👋 ${evt.organizer} प्रस्तुत करते हैं: *${evt.eventName}*! 🚀\n📅 दिनांक: ${formattedDate}\n📍 स्थान: ${evt.venue}\n🔗 अभी रजिस्टर करें: ${regLink}\nअपने दोस्तों को भी बताएं!`;

      waDetailed = `🌟 *सादर आमंत्रण: ${evt.eventName}!* 🌟\n\n${evt.organizer} द्वारा आयोजित:\n\n📅 *दिनांक:* ${formattedDate}\n⏰ *समय:* ${timeFormatted}\n📍 *स्थान:* ${evt.venue}\n👥 *प्रतिभागी:* ${audience}\n\n💡 *संक्षिप्त विवरण:*\n${evt.description}\n\n📌 *आवश्यक निर्देश:* ${addl}\n\n🔗 *पंजीकरण लिंक:* ${regLink}\n📞 *संपर्क:* ${contact}\n\nआज ही सीट पक्की करें! 👍`;

      waReminder = `⏰ *रिमाइंडर: ${evt.eventName} के लिए पंजीकरण जल्द बंद हो रहे हैं!* ⏰\n\nदिनांक: ${formattedDate}\nअपनी सीट सुरक्षित करने के लिए अभी रजिस्टर करें:\n👉 ${regLink}\nसंपर्क: ${contact}`;

      waEventDay = `🎉 *आज ही है दिन! ${evt.eventName}!* 🎉\n\nसमय: ${timeFormatted}\nस्थान: ${evt.venue}\nकृपया समय पर पहुंचे और अपना पहचान पत्र साथ रखें। आपका स्वागत है! 🚀`;
    } else {
      waShort = `Hey! 👋 You're invited to *${evt.eventName}* hosted by *${evt.organizer}*! 🚀\n\n📅 *When:* ${formattedDate} (${timeFormatted})\n📍 *Where:* ${evt.venue}\n👉 *Register here:* ${regLink}\n\nForward this to anyone who shouldn't miss out!`;

      waDetailed = `🚀 *YOU'RE INVITED: ${evt.eventName}* 🚀\n\nOrganized with ❤️ by *${evt.organizer}*\n\n📅 *Date:* ${formattedDate}\n⏰ *Time:* ${timeFormatted}\n📍 *Venue:* ${evt.venue}\n👥 *Audience:* ${audience}\n\n💡 *What's happening?*\n${evt.description}\n\n📌 *Important Notes:* ${addl}\n\n🎟️ *Claim your spot now:*\n${regLink}\n\n💬 *Questions?* Reach out at: ${contact}\n\nSee you there! 🙌`;

      waReminder = `⏰ *REGISTRATION REMINDER: ${evt.eventName}* ⏰\n\nDon't miss out! Registrations for *${evt.eventName}* are filling up quickly.\n\n📅 Event Date: ${formattedDate}\n📍 Location: ${evt.venue}\n\nSecure your participation before spots run out 👇\n🔗 ${regLink}`;

      waEventDay = `🎉 *TODAY IS THE DAY! ${evt.eventName} IS HERE!* 🎉\n\nGet ready for an incredible experience!\n\n⏰ *Starts at:* ${timeFormatted}\n📍 *Venue:* ${evt.venue}\n🎒 *Reminder:* ${addl}\n\nHave your confirmation ready. We can't wait to see you there! 🚀`;
    }

    items.push({
      id: 'wa_short',
      category: 'whatsapp',
      categoryName: 'WhatsApp Messages',
      iconClass: 'fa-brands fa-whatsapp',
      iconTheme: 'whatsapp',
      title: 'Short Friendly WhatsApp Invitation',
      content: waShort,
      hasWhatsAppAction: true,
      categoryFilter: 'whatsapp'
    });

    items.push({
      id: 'wa_detailed',
      category: 'whatsapp',
      categoryName: 'WhatsApp Messages',
      iconClass: 'fa-brands fa-whatsapp',
      iconTheme: 'whatsapp',
      title: 'Detailed WhatsApp Invitation with Emojis & Bold Format',
      content: waDetailed,
      hasWhatsAppAction: true,
      categoryFilter: 'whatsapp'
    });

    items.push({
      id: 'wa_reminder',
      category: 'whatsapp',
      categoryName: 'WhatsApp Messages',
      iconClass: 'fa-solid fa-clock-rotate-left',
      iconTheme: 'whatsapp',
      title: 'WhatsApp Registration Deadline Reminder',
      content: waReminder,
      hasWhatsAppAction: true,
      categoryFilter: 'whatsapp'
    });

    items.push({
      id: 'wa_day',
      category: 'whatsapp',
      categoryName: 'WhatsApp Messages',
      iconClass: 'fa-solid fa-bell',
      iconTheme: 'whatsapp',
      title: 'Event-Day Morning WhatsApp Alert',
      content: waEventDay,
      hasWhatsAppAction: true,
      categoryFilter: 'whatsapp'
    });

    // =========================================================================
    // 5. EVENT REMINDERS (1 Week Before, 1 Day Before, Event Day, Deadline)
    // =========================================================================
    const dateOneWeek = this.getSuggestedDate(evt.eventDate, 7);
    const dateOneDay = this.getSuggestedDate(evt.eventDate, 1);
    const dateDeadline = this.getSuggestedDate(evt.eventDate, 2);

    let remWeek = "";
    let remDay = "";
    let remToday = "";
    let remDeadline = "";

    if (isTelugu) {
      remWeek = `[సిఫార్సు చేయబడిన పంపే తేదీ: ${dateOneWeek} (ఈవెంట్‌కు 1 వారం ముందు)]\n\nనమస్కారం! "${evt.eventName}" ప్రారంభం కావడానికి ఇంకో వారం మాత్రమే సమయం ఉంది! 🗓️\nతేదీ: ${formattedDate} (${timeFormatted})\nవేదిక: ${evt.venue}\nమీరు ఇంకా నమోదు చేసుకోకపోతే వెంటనే నమోదు చేసుకోండి: ${regLink}`;

      remDay = `[సిఫార్సు చేయబడిన పంపే తేదీ: ${dateOneDay} (ఈవెంట్‌కు 1 రోజు ముందు)]\n\nరేపే మన ఈవెంట్! "${evt.eventName}" రేపు ఉదయం ${timeFormatted} గంటలకు ప్రారంభం కానుంది. 📍 వేదిక: ${evt.venue}. మీ అన్ని సన్నాహాలు పూర్తి చేసుకుని రండి! వివరాలకు: ${contact}`;

      remToday = `[సిఫార్సు చేయబడిన పంపే తేదీ: ఈవెంట్ రోజే]\n\nఈరోజే "${evt.eventName}"! ఈవెంట్ వేదిక: ${evt.venue}, సమయం: ${timeFormatted}. సమయానికి చేరుకోవాలని కోరుతున్నాము. 🚀`;

      remDeadline = `[సిఫార్సు చేయబడిన పంపే తేదీ: ${dateDeadline} (గడువు సమీపించినప్పుడు)]\n\nఅత్యవసరం: "${evt.eventName}" రిజిస్ట్రేషన్ గడువు త్వరలోనే ముగుస్తుంది. ఆలస్యం చేయకుండా మీ సీటును బుక్ చేసుకోండి: ${regLink}`;
    } else if (isHindi) {
      remWeek = `[सुझावित प्रेषण तिथि: ${dateOneWeek} (कार्यक्रम से 1 सप्ताह पूर्व)]\n\nनमस्ते! "${evt.eventName}" शुरू होने में केवल 1 सप्ताह का समय शेष है! 🗓️\nदिनांक: ${formattedDate} (${timeFormatted})\nस्थान: ${evt.venue}\nयदि आपने अभी तक पंजीकरण नहीं किया है, तो कृपया यहां करें: ${regLink}`;

      remDay = `[सुझावित प्रेषण तिथि: ${dateOneDay} (कार्यक्रम से 1 दिन पूर्व)]\n\nकल है कार्यक्रम! "${evt.eventName}" कल ${timeFormatted} बजे शुरू हो रहा है। 📍 स्थान: ${evt.venue}। सभी आवश्यक सामग्री के साथ समय पर पहुंचे। सहायता हेतु: ${contact}`;

      remToday = `[सुझावित प्रेषण तिथि: कार्यक्रम के दिन सुबह]\n\nआज का दिन महत्वपूर्ण है! "${evt.eventName}" आज आयोजित हो रहा है। स्थान: ${evt.venue}, समय: ${timeFormatted}। आपसे मिलने की प्रतीक्षा है! 🚀`;

      remDeadline = `[सुझावित प्रेषण तिथि: ${dateDeadline} (अंतिम तिथि से पहले)]\n\nअंतिम अवसर: "${evt.eventName}" का पंजीकरण शीघ्र समाप्त हो रहा है। अपनी भागीदारी अभी सुनिश्चित करें: ${regLink}`;
    } else {
      remWeek = `[Suggested Dispatch Date: ${dateOneWeek} – Exactly 1 Week Before Event]\n\nHello there! Just 7 days to go until "${evt.eventName}"! 🗓️\n\nMark your calendar for ${formattedDate} (${timeFormatted}) at ${evt.venue}.\n\nWe are gearing up for an incredible session for ${audience}.\nMake sure your spot is confirmed:\n🔗 Registration Link: ${regLink}\n\nOrganized by ${evt.organizer}`;

      remDay = `[Suggested Dispatch Date: ${dateOneDay} – Exactly 1 Day Before Event]\n\nTomorrow is the day! ⏰ "${evt.eventName}" kicks off tomorrow at ${timeFormatted}.\n\n• Venue / Link: ${evt.venue}\n• What to bring / prepare: ${addl}\n• Organizer Support: ${contact}\n\nGet plenty of rest and come ready to engage! See you tomorrow.`;

      remToday = `[Suggested Dispatch Date: Event-Day Morning]\n\nGood morning! Today is "${evt.eventName}"! 🚀\n\n• Scheduled Start: ${timeFormatted}\n• Venue: ${evt.venue}\n• Check-in info: Please arrive 15 minutes early.\n\nWe look forward to an unforgettable session with all of you!`;

      remDeadline = `[Suggested Dispatch Date: ${dateDeadline} – Registration Deadline Alert]\n\nFINAL CALL: Registration for "${evt.eventName}" closes very soon! ⏳\n\nDon't miss the chance to join ${audience} for ${evt.description.slice(0, 80)}...\n\nLock in your seat now before the portal closes:\n👉 ${regLink}`;
    }

    items.push({
      id: 'rem_week',
      category: 'reminders',
      categoryName: 'Event Reminders',
      iconClass: 'fa-solid fa-calendar-week',
      iconTheme: 'reminder',
      title: 'One-Week-Before Event Reminder',
      content: remWeek,
      categoryFilter: 'reminders'
    });

    items.push({
      id: 'rem_day',
      category: 'reminders',
      categoryName: 'Event Reminders',
      iconClass: 'fa-solid fa-calendar-day',
      iconTheme: 'reminder',
      title: 'One-Day-Before Event Reminder',
      content: remDay,
      categoryFilter: 'reminders'
    });

    items.push({
      id: 'rem_today',
      category: 'reminders',
      categoryName: 'Event Reminders',
      iconClass: 'fa-solid fa-hourglass-start',
      iconTheme: 'reminder',
      title: 'Event-Day Morning Reminder',
      content: remToday,
      categoryFilter: 'reminders'
    });

    items.push({
      id: 'rem_deadline',
      category: 'reminders',
      categoryName: 'Event Reminders',
      iconClass: 'fa-solid fa-triangle-exclamation',
      iconTheme: 'reminder',
      title: 'Registration Deadline Final Call Reminder',
      content: remDeadline,
      categoryFilter: 'reminders'
    });

    // =========================================================================
    // 6. FREQUENTLY ASKED QUESTIONS (FAQs) - All 7 Required Questions
    // =========================================================================
    let faqText = "";
    if (isTelugu) {
      faqText = `తరచుగా అడిగే ప్రశ్నలు (FAQs) – ${evt.eventName}\n\n` +
        `ప్ర. 1: ఈ ఈవెంట్ దేని గురించి?\n` +
        `జవాబు: ${evt.description}\n\n` +
        `ప్ర. 2: ఇందులో ఎవరు పాల్గొనవచ్చు?\n` +
        `జవాబు: ఈ కార్యక్రమం ${audience} కోసం నిర్వహించబడుతుంది.\n\n` +
        `ప్ర. 3: ఈవెంట్ ఎప్పుడు మరియు ఎక్కడ జరుగుతుంది?\n` +
        `జవాబు: తేదీ: ${formattedDate}, సమయం: ${timeFormatted}, వేదిక: ${evt.venue}.\n\n` +
        `ప్ర. 4: నేను ఎలా రిజిస్టర్ చేసుకోవాలి?\n` +
        `జవాబు: అధికారిక రిజిస్ట్రేషన్ లింక్ ద్వారా నమోదు చేసుకోవచ్చు: ${regLink}\n\n` +
        `ప్ర. 5: రిజిస్ట్రేషన్ ఫీజు ఎంత?\n` +
        `జవాబు: ${evt.additionalInfo.toLowerCase().includes('free') ? 'ఈ ఈవెంట్‌లో పాల్గొనడం పూర్తిగా ఉచితం!' : evt.additionalInfo || '[నిర్వాహకుల సూచన: ఫీజు వివరాలను అదనపు సమాచారంలో తెలపండి]'}\n\n` +
        `ప్ర. 6: పాల్గొనేవారు వెంట ఏమి తీసుకురావాలి?\n` +
        `జవాబు: ${evt.additionalInfo || 'కళాశాల గుర్తింపు కార్డు (ID Card), ల్యాప్‌టాప్/నోట్‌బుక్ (అవసరమైతే).'}\n\n` +
        `ప్ర. 7: సహాయం కొరకు ఎవరిని సంప్రదించాలి?\n` +
        `జవాబు: ఏవైనా ప్రశ్నలున్నచో నిర్వాహకులను సంప్రదించండి: ${contact}`;
    } else if (isHindi) {
      faqText = `अक्सर पूछे जाने वाले प्रश्न (FAQs) – ${evt.eventName}\n\n` +
        `प्र. 1: यह कार्यक्रम किस बारे में है?\n` +
        `उत्तर: ${evt.description}\n\n` +
        `प्र. 2: इसमें कौन भाग ले सकता है?\n` +
        `उत्तर: यह कार्यक्रम विशेष रूप से ${audience} के लिए खुला है।\n\n` +
        `प्र. 3: कार्यक्रम कब और कहां आयोजित होगा?\n` +
        `उत्तर: दिनांक: ${formattedDate}, समय: ${timeFormatted}, स्थान: ${evt.venue}।\n\n` +
        `प्र. 4: पंजीकरण कैसे करें?\n` +
        `उत्तर: आप दिए गए आधिकारिक लिंक पर जाकर फॉर्म भर सकते हैं: ${regLink}\n\n` +
        `प्र. 5: क्या कोई पंजीकरण शुल्क है?\n` +
        `उत्तर: ${evt.additionalInfo.toLowerCase().includes('free') ? 'यह कार्यक्रम सभी योग्य प्रतिभागियों के लिए निःशुल्क है!' : evt.additionalInfo || '[आयोजक नोट: शुल्क विवरण अतिरिक्त निर्देश में दर्ज करें]'}\n\n` +
        `प्र. 6: प्रतिभागियों को अपने साथ क्या लाना चाहिए?\n` +
        `उत्तर: ${evt.additionalInfo || 'छात्र पहचान पत्र (ID Card) तथा आवश्यकतानुसार लैपटॉप/स्टेशनरी।'}\n\n` +
        `प्र. 7: सहायता के लिए किससे संपर्क करें?\n` +
        `उत्तर: किसी भी प्रश्न या सहायता हेतु संपर्क करें: ${contact}`;
    } else {
      faqText = `FREQUENTLY ASKED QUESTIONS (FAQs) – ${evt.eventName}\n\n` +
        `Q1: What is the event about?\n` +
        `A: ${evt.description}\n\n` +
        `Q2: Who can participate?\n` +
        `A: This event is specifically open to ${audience}.\n\n` +
        `Q3: When and where is the event taking place?\n` +
        `A: The event will be held on ${formattedDate} from ${timeFormatted} at ${evt.venue}.\n\n` +
        `Q4: How do I register?\n` +
        `A: You can register online through the official link: ${regLink}\n\n` +
        `Q5: Is there a registration fee?\n` +
        `A: ${evt.additionalInfo.toLowerCase().includes('free') ? 'Participation is completely free of charge!' : (evt.additionalInfo.toLowerCase().includes('fee') || evt.additionalInfo.toLowerCase().includes('ticket') ? evt.additionalInfo : 'Please check the registration link for fee/pass details: ' + regLink)}\n\n` +
        `Q6: What should participants bring?\n` +
        `A: ${evt.additionalInfo ? evt.additionalInfo : 'Please bring your valid Student/College ID card and a notebook or laptop if required.'}\n\n` +
        `Q7: Who can I contact for help or inquiries?\n` +
        `A: You can reach out directly to the organizing committee (${evt.organizer}) at: ${contact}`;
    }

    items.push({
      id: 'faq_all',
      category: 'faqs',
      categoryName: 'Frequently Asked Questions (FAQs)',
      iconClass: 'fa-solid fa-circle-question',
      iconTheme: 'faq',
      title: 'Complete Event FAQs (7 Essential Questions Answered)',
      content: faqText,
      categoryFilter: 'faqs'
    });

    this.state.generatedItems = items;
    this.renderGeneratedCards(items);
    this.updateDashboardHeader(evt);
  },

  /**
   * Update Generated Content Dashboard Header Summary
   */
  updateDashboardHeader(evt) {
    const titleEl = document.getElementById('gen-event-title');
    const orgEl = document.getElementById('gen-event-org');
    const dateEl = document.getElementById('gen-event-date');
    const catEl = document.getElementById('gen-event-category');
    const toneEl = document.getElementById('gen-event-tone');
    const langEl = document.getElementById('gen-event-lang');

    if (titleEl) titleEl.textContent = evt.eventName;
    if (orgEl) orgEl.textContent = evt.organizer;
    if (dateEl) dateEl.textContent = this.formatDate(evt.eventDate);
    if (catEl) catEl.textContent = evt.category;
    if (toneEl) toneEl.textContent = evt.tone || 'Friendly';
    if (langEl) langEl.textContent = evt.language || 'English';
  },

  /**
   * Render Generated Content Cards in DOM
   */
  renderGeneratedCards(items) {
    const grid = document.getElementById('generated-cards-container');
    if (!grid) return;

    grid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `content-card card-filter-${item.categoryFilter}`;
      card.id = `card-${item.id}`;

      const charCount = item.content.length;
      const wordCount = item.content.trim().split(/\s+/).filter(Boolean).length;

      // Card Header
      let cardHTML = `
        <div class="card-top-bar">
          <div class="card-title-wrap">
            <div class="card-type-icon ${item.iconTheme}">
              <i class="${item.iconClass}"></i>
            </div>
            <div>
              <div class="card-title">${item.title}</div>
              <div class="card-stats">
                <span id="chars-${item.id}">${charCount}</span> chars • 
                <span id="words-${item.id}">${wordCount}</span> words
              </div>
            </div>
          </div>
          <span class="badge-tag">${item.categoryName}</span>
        </div>
        <div class="card-body">
          <pre class="content-display-text" id="display-${item.id}">${this.escapeHTML(item.content)}</pre>
          <textarea class="content-edit-textarea" id="edit-${item.id}">${this.escapeHTML(item.content)}</textarea>
        </div>
        <div class="card-footer-toolbar">
          <div class="action-buttons-group">
            <button class="btn btn-secondary btn-sm" onclick="EventMateApp.copyCardText('${item.id}')" id="copy-btn-${item.id}" title="Copy to clipboard">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
            <button class="btn btn-secondary btn-sm" onclick="EventMateApp.toggleEditCard('${item.id}')" id="edit-btn-${item.id}" title="Edit text">
              <i class="fa-regular fa-pen-to-square"></i> Edit
            </button>
            <button class="btn btn-ghost btn-sm" onclick="EventMateApp.regenerateCard('${item.id}')" title="Regenerate this section">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
          <div class="action-buttons-group">
      `;

      // Context Action: WhatsApp
      if (item.hasWhatsAppAction) {
        cardHTML += `
          <button class="btn btn-whatsapp btn-sm" onclick="EventMateApp.openInWhatsApp('${item.id}')" title="Preview and open in WhatsApp">
            <i class="fa-brands fa-whatsapp"></i> Open in WhatsApp
          </button>
        `;
      }

      // Context Action: Email
      if (item.hasEmailAction) {
        cardHTML += `
          <button class="btn btn-email btn-sm" onclick="EventMateApp.openEmailDraft('${item.id}')" title="Create Email Draft in your email app">
            <i class="fa-regular fa-envelope"></i> Create Email Draft
          </button>
        `;
      }

      cardHTML += `
          </div>
        </div>
      `;

      card.innerHTML = cardHTML;
      grid.appendChild(card);
    });

    this.updateTabCounters();
  },

  /**
   * Escape HTML utility
   */
  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Copy Card Content to Clipboard
   */
  async copyCardText(itemId) {
    const item = this.state.generatedItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      await navigator.clipboard.writeText(item.content);
      const copyBtn = document.getElementById(`copy-btn-${itemId}`);
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="fa-solid fa-check text-emerald-500"></i> Copied!`;
        copyBtn.classList.add('bg-emerald-50', 'text-emerald-600', 'border-emerald-300');
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.classList.remove('bg-emerald-50', 'text-emerald-600', 'border-emerald-300');
        }, 2000);
      }
      this.showToast(`Copied "${item.title}" to clipboard!`, 'success');
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = item.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast("Copied to clipboard!", "success");
    }
  },

  /**
   * Toggle In-Place Card Editor
   */
  toggleEditCard(itemId) {
    const displayEl = document.getElementById(`display-${itemId}`);
    const editEl = document.getElementById(`edit-${itemId}`);
    const editBtn = document.getElementById(`edit-btn-${itemId}`);
    const item = this.state.generatedItems.find(i => i.id === itemId);

    if (!displayEl || !editEl || !item) return;

    const isEditing = editEl.classList.contains('active');

    if (isEditing) {
      // Save changes
      item.content = editEl.value;
      displayEl.textContent = item.content;
      displayEl.style.display = 'block';
      editEl.classList.remove('active');
      editBtn.innerHTML = `<i class="fa-regular fa-pen-to-square"></i> Edit`;

      // Update counters
      const charCount = item.content.length;
      const wordCount = item.content.trim().split(/\s+/).filter(Boolean).length;
      document.getElementById(`chars-${itemId}`).textContent = charCount;
      document.getElementById(`words-${itemId}`).textContent = wordCount;

      this.showToast("Edits saved!", "info");
    } else {
      // Enter edit mode
      editEl.value = item.content;
      displayEl.style.display = 'none';
      editEl.classList.add('active');
      editEl.focus();
      editBtn.innerHTML = `<i class="fa-solid fa-check"></i> Done`;
    }
  },

  /**
   * Regenerate Single Card (adds fresh hooks/phrasing)
   */
  regenerateCard(itemId) {
    const item = this.state.generatedItems.find(i => i.id === itemId);
    if (!item || !this.state.currentEvent) return;

    const evt = this.state.currentEvent;
    const formattedDate = this.formatDate(evt.eventDate);

    // Provide dynamic alternative variations
    if (itemId === 'cap_ig') {
      item.content = `🔥 YOU DON'T WANT TO MISS THIS! 🔥\n\n${evt.eventName} is officially taking place on ${formattedDate}!\n\nOrganized by ${evt.organizer}, this is your ultimate chance to connect, learn, and excel.\n\n📍 Location: ${evt.venue}\n⏰ Starts: ${this.formatTime(evt.startTime)}\n\n👉 Secure your registration before spaces run out:\n${evt.registrationLink || '[Registration Link]'}\n\n#${evt.category.toLowerCase()} #EventMate #MustAttend`;
    } else if (itemId === 'cap_x') {
      item.content = `🚀 Mark your calendar: ${evt.eventName} is coming on ${formattedDate}!\nOrganized by ${evt.organizer} at ${evt.venue}.\nSeats are filling up fast! 👇\n${evt.registrationLink || '[Registration Link]'}`;
    } else if (itemId === 'wa_short') {
      item.content = `Hey everyone! 🌟 Quick reminder that *${evt.eventName}* is happening on *${formattedDate}* at *${evt.venue}*.\n\nMake sure to grab your spot here before it's full: ${evt.registrationLink || '[Link]'}\nSee you there!`;
    } else {
      // General variation: refresh with slight prompt
      this.generateAllContent(evt);
      this.showToast("Regenerated content successfully!", "info");
      return;
    }

    // Update view
    const displayEl = document.getElementById(`display-${itemId}`);
    const editEl = document.getElementById(`edit-${itemId}`);
    if (displayEl) displayEl.textContent = item.content;
    if (editEl) editEl.value = item.content;

    document.getElementById(`chars-${itemId}`).textContent = item.content.length;
    document.getElementById(`words-${itemId}`).textContent = item.content.trim().split(/\s+/).filter(Boolean).length;

    this.showToast(`Refreshed "${item.title}"!`, "info");
  },

  /**
   * Open in WhatsApp (Click-to-Chat with URL Encoding)
   */
  openInWhatsApp(itemId) {
    const item = this.state.generatedItems.find(i => i.id === itemId);
    if (!item) return;

    const encodedText = encodeURIComponent(item.content);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    // Explain review before sending
    window.open(whatsappUrl, '_blank');
    this.showToast("Opened WhatsApp preview. You can select your contact/group to send!", "success");
  },

  /**
   * Create Email Draft (mailto: with Subject & Body Encoding)
   */
  openEmailDraft(itemId) {
    const item = this.state.generatedItems.find(i => i.id === itemId);
    if (!item) return;

    const subject = encodeURIComponent(item.emailSubject || `Invitation: ${this.state.currentEvent?.eventName}`);
    const body = encodeURIComponent(item.emailBody || item.content);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

    window.location.href = mailtoUrl;
    this.showToast("Opening your email application with pre-filled draft...", "info");
  },

  /**
   * Filter Generated Content by Category
   */
  filterGeneratedContent(category) {
    this.state.activeCategoryFilter = category;

    // Update tab UI
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-filter') === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Show/hide cards
    const cards = document.querySelectorAll('.content-card');
    cards.forEach(card => {
      if (category === 'all' || card.classList.contains(`card-filter-${category}`)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  },

  /**
   * Update Content Tab Counters
   */
  updateTabCounters() {
    const counts = {
      all: this.state.generatedItems.length,
      captions: this.state.generatedItems.filter(i => i.categoryFilter === 'captions').length,
      announcements: this.state.generatedItems.filter(i => i.categoryFilter === 'announcements').length,
      email: this.state.generatedItems.filter(i => i.categoryFilter === 'email').length,
      whatsapp: this.state.generatedItems.filter(i => i.categoryFilter === 'whatsapp').length,
      reminders: this.state.generatedItems.filter(i => i.categoryFilter === 'reminders').length,
      faqs: this.state.generatedItems.filter(i => i.categoryFilter === 'faqs').length
    };

    Object.keys(counts).forEach(cat => {
      const badge = document.getElementById(`count-badge-${cat}`);
      if (badge) badge.textContent = counts[cat];
    });
  },

  /**
   * Download All Content as a Single Formatted Text File
   */
  downloadAllContent() {
    if (!this.state.currentEvent || !this.state.generatedItems.length) {
      this.showToast("No content to download. Please generate event communication first.", "warning");
      return;
    }

    const evt = this.state.currentEvent;
    let fileContent = `========================================================================\n`;
    fileContent += `EVENT MATE – SMART EVENT COMMUNICATION KIT\n`;
    fileContent += `========================================================================\n\n`;
    fileContent += `Event Name: ${evt.eventName}\n`;
    fileContent += `Category: ${evt.category}\n`;
    fileContent += `Organizer: ${evt.organizer}\n`;
    fileContent += `Date: ${this.formatDate(evt.eventDate)}\n`;
    fileContent += `Time: ${evt.startTime} ${evt.endTime ? '- ' + evt.endTime : ''}\n`;
    fileContent += `Venue: ${evt.venue}\n`;
    fileContent += `Registration Link: ${evt.registrationLink || 'N/A'}\n`;
    fileContent += `Contact: ${evt.contactInfo || 'N/A'}\n`;
    fileContent += `Generated At: ${new Date().toLocaleString()}\n\n`;
    fileContent += `========================================================================\n\n`;

    this.state.generatedItems.forEach((item, index) => {
      fileContent += `------------------------------------------------------------------------\n`;
      fileContent += `[${index + 1}] ${item.categoryName.toUpperCase()} – ${item.title.toUpperCase()}\n`;
      fileContent += `------------------------------------------------------------------------\n\n`;
      fileContent += `${item.content}\n\n\n`;
    });

    fileContent += `========================================================================\n`;
    fileContent += `Generated with Event Mate – One Event. Every Message. Instantly.\n`;
    fileContent += `========================================================================\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = evt.eventName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    link.href = url;
    link.download = `EventMate_${safeTitle}_Communications.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast("All communication content downloaded successfully!", "success");
  },

  /**
   * Save Event & Content (Local Storage & Firebase)
   */
  async saveEvent(eventData, generatedItems, notify = true) {
    // Save to LocalStorage
    const existingIndex = this.state.savedEvents.findIndex(e => e.id === eventData.id);
    const eventRecord = {
      ...eventData,
      generatedItems: generatedItems,
      savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.state.savedEvents[existingIndex] = eventRecord;
    } else {
      this.state.savedEvents.unshift(eventRecord);
    }

    try {
      localStorage.setItem('eventmate_saved_events', JSON.stringify(this.state.savedEvents));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // Save to Firebase if authenticated
    if (this.state.isFirebaseConnected && this.state.currentUser) {
      try {
        await window.FirebaseService.saveEventToFirestore(this.state.currentUser.uid, eventRecord);
      } catch (err) {
        console.error("Firebase sync error:", err);
      }
    }

    this.updateDashboardStats();
    if (notify) {
      this.showToast(`Saved "${eventData.eventName}" to your events!`, "success");
    }
  },

  /**
   * Load Saved Events from LocalStorage
   */
  loadSavedEvents() {
    try {
      const data = localStorage.getItem('eventmate_saved_events');
      if (data) {
        this.state.savedEvents = JSON.parse(data);
      } else {
        // Pre-seed with one sample event so dashboard looks lively on first boot
        this.seedInitialSampleEvents();
      }
    } catch (e) {
      this.state.savedEvents = [];
    }
    this.renderSavedEventsList();
  },

  /**
   * Seed Initial Sample Event
   */
  seedInitialSampleEvents() {
    const sample = {
      ...this.presets.hackathon,
      id: 'evt_sample_hackathon',
      createdAt: new Date().toISOString()
    };
    this.generateAllContent(sample);
    sample.generatedItems = [...this.state.generatedItems];
    this.state.savedEvents = [sample];
    localStorage.setItem('eventmate_saved_events', JSON.stringify(this.state.savedEvents));
  },

  /**
   * Render Saved Events in My Events Section
   */
  renderSavedEventsList() {
    const listEl = document.getElementById('saved-events-grid');
    const emptyEl = document.getElementById('empty-events-state');
    if (!listEl) return;

    if (!this.state.savedEvents.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    listEl.innerHTML = '';

    this.state.savedEvents.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'saved-event-card';

      const formattedDate = this.formatDate(evt.eventDate);
      const pieceCount = evt.generatedItems ? evt.generatedItems.length : 16;

      card.innerHTML = `
        <div class="saved-event-header">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span class="badge-tag">${evt.category}</span>
            <span class="meta-chip"><i class="fa-solid fa-file-lines"></i> ${pieceCount} Pieces</span>
          </div>
          <h3 class="saved-event-title">${this.escapeHTML(evt.eventName)}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${this.escapeHTML(evt.organizer)}</p>
        </div>
        <div class="saved-event-details">
          <div><i class="fa-regular fa-calendar mr-1 text-indigo-500"></i> ${formattedDate}</div>
          <div><i class="fa-regular fa-clock mr-1 text-indigo-500"></i> ${this.formatTime(evt.startTime)}</div>
          <div><i class="fa-solid fa-location-dot mr-1 text-indigo-500"></i> ${this.escapeHTML(evt.venue.slice(0, 45))}${evt.venue.length > 45 ? '...' : ''}</div>
        </div>
        <div class="saved-event-actions">
          <button class="btn btn-primary btn-sm" onclick="EventMateApp.loadSavedEvent('${evt.id}')" title="View & Manage Generated Content">
            <i class="fa-solid fa-eye"></i> View Content
          </button>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="EventMateApp.editSavedEvent('${evt.id}')" title="Edit Event Details">
              <i class="fa-regular fa-pen-to-square"></i> Edit
            </button>
            <button class="btn btn-ghost btn-sm text-red-500" onclick="EventMateApp.confirmDeleteEvent('${evt.id}')" title="Delete Event">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;

      listEl.appendChild(card);
    });
  },

  /**
   * Load Saved Event into Generated Content View
   */
  loadSavedEvent(eventId) {
    const evt = this.state.savedEvents.find(e => e.id === eventId);
    if (!evt) return;

    this.state.currentEvent = evt;
    if (evt.generatedItems && evt.generatedItems.length) {
      this.state.generatedItems = evt.generatedItems;
      this.renderGeneratedCards(evt.generatedItems);
      this.updateDashboardHeader(evt);
    } else {
      this.generateAllContent(evt);
    }

    this.navigateTo('generated');
    this.showToast(`Loaded "${evt.eventName}"!`, "info");
  },

  /**
   * Edit Saved Event (Loads details back into form)
   */
  editSavedEvent(eventId) {
    const evt = this.state.savedEvents.find(e => e.id === eventId);
    if (!evt) return;

    this.state.currentEvent = evt;
    document.getElementById('eventName').value = evt.eventName;
    document.getElementById('category').value = evt.category;
    document.getElementById('organizer').value = evt.organizer;
    document.getElementById('eventDate').value = evt.eventDate;
    document.getElementById('startTime').value = evt.startTime;
    document.getElementById('endTime').value = evt.endTime || '';
    document.getElementById('venue').value = evt.venue;
    document.getElementById('description').value = evt.description;
    document.getElementById('targetAudience').value = evt.targetAudience || '';
    document.getElementById('registrationLink').value = evt.registrationLink || '';
    document.getElementById('contactInfo').value = evt.contactInfo || '';
    document.getElementById('additionalInfo').value = evt.additionalInfo || '';
    document.getElementById('tone').value = evt.tone || 'Friendly';
    document.getElementById('language').value = evt.language || 'English';

    this.navigateTo('create');
    this.showToast("Loaded event into form for editing.", "info");
  },

  /**
   * Confirm Delete Event
   */
  confirmDeleteEvent(eventId) {
    const evt = this.state.savedEvents.find(e => e.id === eventId);
    if (!evt) return;

    const modal = document.getElementById('modal-delete-confirm');
    const deleteBtn = document.getElementById('btn-confirm-delete-action');
    const titleEl = document.getElementById('delete-event-name-display');

    if (titleEl) titleEl.textContent = evt.eventName;
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        this.deleteEvent(eventId);
        this.closeModal('modal-delete-confirm');
      };
    }

    if (modal) modal.classList.add('active');
  },

  /**
   * Delete Event
   */
  async deleteEvent(eventId) {
    this.state.savedEvents = this.state.savedEvents.filter(e => e.id !== eventId);
    localStorage.setItem('eventmate_saved_events', JSON.stringify(this.state.savedEvents));

    if (this.state.isFirebaseConnected && this.state.currentUser) {
      try {
        await window.FirebaseService.deleteEventFromFirestore(this.state.currentUser.uid, eventId);
      } catch (err) {
        console.error("Firebase deletion error:", err);
      }
    }

    this.renderSavedEventsList();
    this.updateDashboardStats();
    this.showToast("Event deleted successfully.", "info");
  },

  /**
   * Update Dashboard Counters
   */
  updateDashboardStats() {
    const totalEvents = this.state.savedEvents.length;
    let totalPieces = 0;
    this.state.savedEvents.forEach(e => {
      totalPieces += (e.generatedItems ? e.generatedItems.length : 16);
    });

    const statEvents = document.getElementById('stat-total-events');
    const statPieces = document.getElementById('stat-total-pieces');
    if (statEvents) statEvents.textContent = totalEvents;
    if (statPieces) statPieces.textContent = totalPieces;
  },

  /**
   * Initialize Optional Firebase Integration
   */
  async initFirebaseIntegration() {
    if (window.FirebaseService && window.FirebaseService.isConfigured()) {
      const connected = await window.FirebaseService.init();
      if (connected) {
        this.state.isFirebaseConnected = true;
        this.updateAuthPill(true, "Firebase Connected");

        window.FirebaseService.onAuthStateChanged(async (user) => {
          this.state.currentUser = user;
          if (user) {
            this.updateAuthPill(true, user.email);
            // Fetch events from Firestore
            const cloudEvents = await window.FirebaseService.fetchEventsFromFirestore(user.uid);
            if (cloudEvents && cloudEvents.length) {
              this.state.savedEvents = cloudEvents;
              this.renderSavedEventsList();
              this.updateDashboardStats();
            }
          } else {
            this.updateAuthPill(true, "Signed Out (Firebase)");
          }
        });
        return;
      }
    }

    // Default to Demo Mode
    this.state.isFirebaseConnected = false;
    this.updateAuthPill(false, "Demo Mode (Local)");
  },

  /**
   * Update Authentication Status Pill in Navbar
   */
  updateAuthPill(isConnected, label) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot) {
      dot.className = isConnected ? 'status-dot connected' : 'status-dot demo';
    }
    if (text) {
      text.textContent = label;
    }
  },

  /**
   * Open Status & Demo Mode Info Modal
   */
  openStatusModal() {
    const modal = document.getElementById('modal-status-info');
    if (modal) modal.classList.add('active');
  },

  /**
   * Close Any Modal
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  /**
   * Toast Notification Controller
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        if (typeof toast.remove === 'function') {
          toast.remove();
        } else if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3200);
  }
};

// Bind globally for inline event handlers and window access
window.EventMateApp = EventMateApp;

// Auto-boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  EventMateApp.init();
});
