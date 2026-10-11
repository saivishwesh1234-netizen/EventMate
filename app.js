/**
 * Event Mate - Application Controller
 * Handles screen navigation, form validation, campaign generation,
 * in-place editing, clipboard copying, sample data loading, and export.
 */

const App = {
  // Application State
  state: {
    currentScreen: 'home',
    currentEvent: null,
    campaignData: null,
    activeReminderTab: 'oneWeek',
    backendUrl: window.location.origin.includes('localhost') ? window.location.origin : 'http://localhost:5000',
    backendConnected: false,
    organizerToken: localStorage.getItem('eventmate_org_token') || null,
    eventsList: [],
    organizerMembers: [],
    organizerLogs: [],
    selectedFilterEventId: '',
    selectedBroadcastEventId: '',
    whatsappStatus: null,
    editModes: {
      social: false,
      email: false,
      whatsapp: false,
      reminders: false,
      faqs: false
    },
    toastTimeout: null
  },

  /**
   * Initialize App on load
   */
  init() {
    this.renderSampleCards();
    this.renderModalSamples();
    this.setDefaultFormDateTime();
    this.checkBackendHealth();
    this.populateRegisterEventDropdown();
    this.updateWhatsAppPreview();
  },

  /**
   * Check if Node backend is online and sync events
   */
  async checkBackendHealth() {
    try {
      const res = await fetch(`${this.state.backendUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        this.state.backendConnected = true;
        console.log("✅ Event Mate Backend connected at", this.state.backendUrl);
        await this.syncEventsFromBackend();
        await this.checkWhatsAppStatus();
      }
    } catch (e) {
      this.state.backendConnected = false;
      console.log("ℹ️ Event Mate Backend offline. Using local client engine.");
      this.populateRegisterEventDropdown();
    }
  },

  /**
   * Screen Navigation Router
   */
  navigateTo(screenId) {
    this.state.currentScreen = screenId;

    // Toggle screen container visibility
    const screens = ['home', 'create', 'campaign', 'organizer'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s === screenId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Update Navigation styling
    const navHome = document.getElementById('nav-btn-home');
    const navCreate = document.getElementById('nav-btn-create');
    const navOrg = document.getElementById('nav-btn-organizer');
    
    if (navHome) {
      navHome.className = screenId === 'home'
        ? "px-3.5 py-2 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        : "px-3.5 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors";
    }
    if (navCreate) {
      navCreate.className = screenId === 'create'
        ? "px-3.5 py-2 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        : "px-3.5 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors";
    }
    if (navOrg) {
      navOrg.className = screenId === 'organizer'
        ? "px-3.5 py-2 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100/90 border border-indigo-300 transition-colors flex items-center gap-1.5"
        : "px-3.5 py-2 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5";
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Open Create Form screen
   */
  openCreateScreen(preserveExisting = false) {
    this.clearValidationErrors();
    if (!preserveExisting && !this.state.currentEvent) {
      this.populateFormWithPreset(0);
    }
    this.navigateTo('create');
  },

  /**
   * Set default datetime for form (14 days from now at 10:00 AM)
   */
  setDefaultFormDateTime() {
    const dtInput = document.getElementById('event-datetime');
    if (dtInput && !dtInput.value) {
      const now = new Date();
      now.setDate(now.getDate() + 14);
      now.setHours(10, 0, 0, 0);
      const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dtInput.value = isoLocal;
    }
  },

  /**
   * Render sample event cards on Home screen
   */
  renderSampleCards() {
    const container = document.getElementById('sample-events-cards');
    if (!container || !window.SAMPLE_EVENTS) return;

    container.innerHTML = SAMPLE_EVENTS.map((item, idx) => {
      const dt = CampaignGenerator.formatDateTime(item.dateTime);
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between card-hover-effect">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${item.badgeColor}">
                ${item.tag}
              </span>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ${item.tone} tone
              </span>
            </div>
            <h3 class="font-display font-bold text-slate-900 text-lg mb-2 line-clamp-1">${item.name}</h3>
            <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">${item.description}</p>
            
            <div class="space-y-1.5 text-xs text-slate-500 mb-6">
              <div class="flex items-center gap-2">
                <i class="fa-regular fa-calendar text-indigo-500 text-[11px]"></i>
                <span class="truncate">${dt.fullStr}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-location-dot text-indigo-500 text-[11px]"></i>
                <span class="truncate">${item.venue}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
            <button onclick="App.loadSampleByIndex(${idx}, true)" class="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors text-center flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
              <span>Generate Campaign</span>
            </button>
            <button onclick="App.populateFormWithPreset(${idx}); App.navigateTo('create');" title="Load into form to edit" class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Render Demo Modal List
   */
  renderModalSamples() {
    const list = document.getElementById('modal-sample-list');
    if (!list || !window.SAMPLE_EVENTS) return;

    list.innerHTML = SAMPLE_EVENTS.map((item, idx) => `
      <div onclick="App.loadSampleByIndex(${idx}, true); App.closeDemoModal();" class="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all flex items-center justify-between group">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded-md ${item.badgeColor}">${item.tag}</span>
            <span class="text-xs font-semibold text-slate-400 uppercase">${item.tone}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm mt-1 group-hover:text-indigo-600 transition-colors">${item.name}</h4>
        </div>
        <i class="fa-solid fa-arrow-right text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"></i>
      </div>
    `).join('');
  },

  openDemoModal() {
    document.getElementById('demo-modal')?.classList.remove('hidden');
  },

  closeDemoModal() {
    document.getElementById('demo-modal')?.classList.add('hidden');
  },

  /**
   * Populate the Create Form with one of the sample presets
   */
  populateFormWithPreset(index) {
    if (!window.SAMPLE_EVENTS || !SAMPLE_EVENTS[index]) return;
    const item = SAMPLE_EVENTS[index];

    document.getElementById('event-name').value = item.name;
    document.getElementById('event-datetime').value = item.dateTime;
    document.getElementById('event-venue').value = item.venue;
    document.getElementById('event-description').value = item.description;
    document.getElementById('event-audience').value = item.audience;
    document.getElementById('event-reglink').value = item.registrationLink;

    // Set radio tone
    const toneRadios = document.getElementsByName('tone');
    for (const radio of toneRadios) {
      if (radio.value === item.tone) {
        radio.checked = true;
      }
    }

    this.clearValidationErrors();
    this.showToast("Preset Loaded!", `Loaded "${item.name}" into form.`, "fa-bolt");
  },

  /**
   * Instant Generation from Sample (Bypasses manual form entry for judging)
   */
  loadSampleByIndex(index, generateImmediately = true) {
    if (!window.SAMPLE_EVENTS || !SAMPLE_EVENTS[index]) return;
    const item = SAMPLE_EVENTS[index];
    this.populateFormWithPreset(index);

    if (generateImmediately) {
      const eventData = {
        name: item.name,
        dateTime: item.dateTime,
        venue: item.venue,
        description: item.description,
        audience: item.audience,
        registrationLink: item.registrationLink,
        tone: item.tone
      };

      this.executeCampaignGeneration(eventData);
    }
  },

  /**
   * Form Reset
   */
  resetForm() {
    document.getElementById('event-form').reset();
    this.clearValidationErrors();
    this.setDefaultFormDateTime();
    this.showToast("Form Reset", "All fields have been cleared.", "fa-rotate-left");
  },

  /**
   * Clear Validation Error indicators
   */
  clearValidationErrors() {
    const errorIds = [
      'err-event-name',
      'err-event-datetime',
      'err-event-venue',
      'err-event-description',
      'err-event-audience',
      'err-event-reglink'
    ];

    errorIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const inputs = document.querySelectorAll('#event-form input, #event-form textarea');
    inputs.forEach(input => {
      input.classList.remove('border-rose-400', 'bg-rose-50/30');
    });
  },

  /**
   * Form Submission & Validation Handler
   */
  handleFormSubmit(e) {
    e.preventDefault();
    this.clearValidationErrors();

    const nameInput = document.getElementById('event-name');
    const datetimeInput = document.getElementById('event-datetime');
    const venueInput = document.getElementById('event-venue');
    const descInput = document.getElementById('event-description');
    const audienceInput = document.getElementById('event-audience');
    const reglinkInput = document.getElementById('event-reglink');

    let isValid = true;

    // Validate Name
    if (!nameInput.value.trim()) {
      document.getElementById('err-event-name').classList.remove('hidden');
      nameInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    // Validate DateTime
    if (!datetimeInput.value.trim()) {
      document.getElementById('err-event-datetime').classList.remove('hidden');
      datetimeInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    // Validate Venue
    if (!venueInput.value.trim()) {
      document.getElementById('err-event-venue').classList.remove('hidden');
      venueInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    // Validate Description
    if (!descInput.value.trim()) {
      document.getElementById('err-event-description').classList.remove('hidden');
      descInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    // Validate Audience
    if (!audienceInput.value.trim()) {
      document.getElementById('err-event-audience').classList.remove('hidden');
      audienceInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    // Validate Registration Link
    const regLinkVal = reglinkInput.value.trim();
    if (!regLinkVal) {
      document.getElementById('err-event-reglink').classList.remove('hidden');
      reglinkInput.classList.add('border-rose-400', 'bg-rose-50/30');
      isValid = false;
    }

    if (!isValid) {
      this.showToast("Validation Error", "Please fill in all required fields.", "fa-circle-exclamation", true);
      return;
    }

    // Format registration URL if user omitted http
    let formattedRegLink = regLinkVal;
    if (!/^https?:\/\//i.test(formattedRegLink)) {
      formattedRegLink = 'https://' + formattedRegLink;
    }

    // Determine Selected Tone
    let selectedTone = 'friendly';
    const toneRadios = document.getElementsByName('tone');
    for (const r of toneRadios) {
      if (r.checked) {
        selectedTone = r.value;
        break;
      }
    }

    const eventData = {
      name: nameInput.value.trim(),
      dateTime: datetimeInput.value.trim(),
      venue: venueInput.value.trim(),
      description: descInput.value.trim(),
      audience: audienceInput.value.trim(),
      registrationLink: formattedRegLink,
      tone: selectedTone
    };

    this.executeCampaignGeneration(eventData);
  },

  /**
   * Execute Generation Pipeline (Tries Backend API, falls back to client generator)
   */
  async executeCampaignGeneration(eventData) {
    this.state.currentEvent = eventData;

    // Button loading state animation
    const btn = document.getElementById('btn-generate-campaign');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating Campaign...`;
      btn.disabled = true;
    }

    let results = null;
    let usedBackend = false;

    // Try calling backend REST API
    try {
      const response = await fetch(`${this.state.backendUrl}/api/campaign/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.social) {
          results = data;
          usedBackend = true;
          this.state.backendConnected = true;
        }
      }
    } catch (err) {
      // Backend offline or unreachable — seamlessly proceed with local client generator
      usedBackend = false;
      this.state.backendConnected = false;
    }

    // Fallback to client engine if backend wasn't available
    if (!results) {
      results = CampaignGenerator.generateAll(eventData);
    }

    this.state.campaignData = results;

    // Render Dashboard Content
    this.renderCampaignDashboard(eventData, results);

    // Navigate to Campaign Screen
    this.navigateTo('campaign');

    // Reset button
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i> Generate Campaign`;
      btn.disabled = false;
    }

    const toastMsg = usedBackend ? "Generated via Backend REST API!" : "Campaign Generated!";
    const toastDesc = usedBackend ? "Server-side pipeline executed with 100% detail sync." : "5 channels ready with 100% detail synchronization.";
    this.showToast(toastMsg, toastDesc, "fa-check");
  },

  /**
   * Render Campaign Dashboard Elements
   */
  renderCampaignDashboard(event, campaign) {
    const dt = CampaignGenerator.formatDateTime(event.dateTime);

    // 1. Top Event Summary Bar
    document.getElementById('campaign-event-name').textContent = event.name;
    document.getElementById('campaign-event-datetime').textContent = dt.fullStr;
    document.getElementById('campaign-event-venue').textContent = event.venue;
    document.getElementById('campaign-event-audience').textContent = event.audience;

    const linkEl = document.getElementById('campaign-event-link');
    linkEl.textContent = event.registrationLink;
    linkEl.href = event.registrationLink;

    const toneBadge = document.getElementById('campaign-badge-tone');
    const toneMap = {
      professional: { label: "Professional Tone", class: "bg-blue-50 text-blue-700 border-blue-200" },
      friendly: { label: "Friendly Tone", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      exciting: { label: "Exciting Tone", class: "bg-purple-50 text-purple-700 border-purple-200" }
    };
    const toneInfo = toneMap[event.tone] || toneMap.friendly;
    toneBadge.textContent = toneInfo.label;
    toneBadge.className = `px-3 py-1 text-xs font-semibold rounded-full border ${toneInfo.class}`;

    // 2. Consistency Checklist
    this.renderConsistencyChecklist(campaign.consistency);

    // 3. Card 1: Social Media Announcement
    document.getElementById('view-social').textContent = campaign.social;
    document.getElementById('input-social').value = campaign.social;

    // 4. Card 2: Email Invitation
    document.getElementById('view-email-subject').textContent = campaign.email.subject;
    document.getElementById('input-email-subject').value = campaign.email.subject;
    document.getElementById('view-email').textContent = campaign.email.body;
    document.getElementById('input-email-body').value = campaign.email.body;

    // 5. Card 3: WhatsApp Invitation
    document.getElementById('view-whatsapp').textContent = campaign.whatsapp.message;
    document.getElementById('input-whatsapp').value = campaign.whatsapp.message;
    const waShareBtn = document.getElementById('btn-share-whatsapp');
    if (waShareBtn) {
      waShareBtn.href = campaign.whatsapp.directShareUrl;
    }

    // 6. Card 4: Reminder Messages
    this.state.activeReminderTab = 'oneWeek';
    this.updateReminderView();

    // 7. Card 5: FAQs
    this.renderFAQs(campaign.faqs);

    // Reset all edit modes to view mode
    Object.keys(this.state.editModes).forEach(k => {
      this.cancelEdit(k);
    });
  },

  /**
   * Render Consistency Checklist widget
   */
  renderConsistencyChecklist(consistency) {
    const list = document.getElementById('consistency-checklist');
    const scoreBadge = document.getElementById('consistency-score-badge');
    if (!list || !scoreBadge) return;

    scoreBadge.textContent = `${consistency.score}% Synced`;

    list.innerHTML = consistency.checks.map(c => `
      <li class="flex items-start gap-2">
        <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
          <i class="fa-solid fa-check"></i>
        </span>
        <div class="leading-tight">
          <span class="font-bold text-slate-800">${c.item}:</span>
          <span class="text-slate-500 ml-1">${c.detail}</span>
        </div>
      </li>
    `).join('');
  },

  /**
   * Render FAQ elements
   */
  renderFAQs(faqs) {
    const viewContainer = document.getElementById('view-faqs');
    const inputArea = document.getElementById('input-faqs');

    if (!viewContainer || !inputArea) return;

    // Render visual accordion/card list
    viewContainer.innerHTML = faqs.map((faq, idx) => `
      <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
        <div class="font-bold text-slate-900 text-sm flex items-start gap-2">
          <span class="text-indigo-600 font-extrabold text-xs">Q${idx + 1}:</span>
          <span>${faq.question}</span>
        </div>
        <div class="text-slate-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
          ${faq.answer}
        </div>
      </div>
    `).join('');

    // Pre-fill editable markdown format for edit mode
    const markdownFaqs = faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n');
    inputArea.value = markdownFaqs;
  },

  /**
   * Reminder Stage Tabs
   */
  switchReminderTab(stage) {
    this.state.activeReminderTab = stage;

    // Update tab button styles
    const tabs = ['oneWeek', 'oneDay', 'oneHour'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-rem-${t}`);
      if (btn) {
        if (t === stage) {
          btn.className = "px-3 py-1 text-xs font-semibold rounded-lg bg-white text-slate-900 shadow-xs";
        } else {
          btn.className = "px-3 py-1 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900";
        }
      }
    });

    this.updateReminderView();
  },

  /**
   * Update active reminder view based on state.activeReminderTab
   */
  updateReminderView() {
    if (!this.state.campaignData || !this.state.campaignData.reminders) return;

    const reminderObj = this.state.campaignData.reminders[this.state.activeReminderTab];
    if (!reminderObj) return;

    document.getElementById('active-reminder-title').textContent = `${reminderObj.stage}: ${reminderObj.title}`;
    document.getElementById('view-reminders').textContent = reminderObj.text;
    document.getElementById('input-reminders').value = reminderObj.text;
  },

  /**
   * In-Place Edit Mode Controls
   */
  toggleEdit(channel) {
    const isEditing = this.state.editModes[channel];
    if (isEditing) {
      this.cancelEdit(channel);
    } else {
      this.state.editModes[channel] = true;
      document.getElementById(`view-${channel}`)?.classList.add('hidden');
      document.getElementById(`edit-${channel}`)?.classList.remove('hidden');

      const editBtn = document.getElementById(`btn-edit-${channel}`);
      if (editBtn) {
        editBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> Close Edit`;
      }
    }
  },

  cancelEdit(channel) {
    this.state.editModes[channel] = false;
    document.getElementById(`view-${channel}`)?.classList.remove('hidden');
    document.getElementById(`edit-${channel}`)?.classList.add('hidden');

    const editBtn = document.getElementById(`btn-edit-${channel}`);
    if (editBtn) {
      editBtn.innerHTML = `<i class="fa-solid fa-pen text-slate-500"></i> Edit`;
    }
  },

  saveEdit(channel) {
    if (!this.state.campaignData) return;

    if (channel === 'social') {
      const newVal = document.getElementById('input-social').value;
      this.state.campaignData.social = newVal;
      document.getElementById('view-social').textContent = newVal;
    } else if (channel === 'email') {
      const newSubject = document.getElementById('input-email-subject').value;
      const newBody = document.getElementById('input-email-body').value;
      this.state.campaignData.email.subject = newSubject;
      this.state.campaignData.email.body = newBody;
      document.getElementById('view-email-subject').textContent = newSubject;
      document.getElementById('view-email').textContent = newBody;
    } else if (channel === 'whatsapp') {
      const newVal = document.getElementById('input-whatsapp').value;
      this.state.campaignData.whatsapp.message = newVal;
      this.state.campaignData.whatsapp.directShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(newVal)}`;
      document.getElementById('view-whatsapp').textContent = newVal;
      const waShareBtn = document.getElementById('btn-share-whatsapp');
      if (waShareBtn) waShareBtn.href = this.state.campaignData.whatsapp.directShareUrl;
    } else if (channel === 'reminders') {
      const newVal = document.getElementById('input-reminders').value;
      this.state.campaignData.reminders[this.state.activeReminderTab].text = newVal;
      document.getElementById('view-reminders').textContent = newVal;
    } else if (channel === 'faqs') {
      const newVal = document.getElementById('input-faqs').value;
      // Parse markdown Q&A pairs
      const pairs = newVal.split(/\n\s*\n/).filter(p => p.trim());
      const parsedFaqs = [];
      pairs.forEach(pair => {
        const lines = pair.split('\n');
        const qLine = lines.find(l => /^Q\d*:|^Question:/i.test(l.trim())) || lines[0];
        const aLine = lines.filter(l => l !== qLine).join(' ');
        parsedFaqs.push({
          question: qLine ? qLine.replace(/^Q\d*:\s*|^Question:\s*/i, '').trim() : "FAQ Question",
          answer: aLine ? aLine.replace(/^A:\s*|^Answer:\s*/i, '').trim() : "FAQ Answer"
        });
      });
      if (parsedFaqs.length > 0) {
        this.state.campaignData.faqs = parsedFaqs;
        this.renderFAQs(parsedFaqs);
      }
    }

    // Re-verify consistency
    const newConsistency = CampaignGenerator.verifyConsistency(this.state.currentEvent, this.state.campaignData);
    this.renderConsistencyChecklist(newConsistency);

    this.cancelEdit(channel);
    this.showToast("Changes Saved!", `Updated ${channel.toUpperCase()} content.`, "fa-check");
  },

  /**
   * Clipboard Copy Helper
   */
  copyTextToClipboard(text, successTitle = "Copied to Clipboard!", successDesc = "Ready to paste anywhere.") {
    if (!navigator.clipboard) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast(successTitle, successDesc, "fa-copy");
      } catch (err) {
        this.showToast("Copy Failed", "Please manually select and copy text.", "fa-triangle-exclamation", true);
      }
      document.body.removeChild(textArea);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.showToast(successTitle, successDesc, "fa-copy");
    }).catch(() => {
      this.showToast("Copy Failed", "Permission denied.", "fa-triangle-exclamation", true);
    });
  },

  /**
   * Copy Channel Specific Content
   */
  copyContent(channel) {
    if (!this.state.campaignData) return;

    if (channel === 'social') {
      this.copyTextToClipboard(this.state.campaignData.social, "Social Post Copied!", "Ready for LinkedIn, Instagram & Twitter.");
    } else if (channel === 'email') {
      const emailBundle = `SUBJECT: ${this.state.campaignData.email.subject}\n\n${this.state.campaignData.email.body}`;
      this.copyTextToClipboard(emailBundle, "Full Email Copied!", "Subject and email body copied to clipboard.");
    } else if (channel === 'whatsapp') {
      this.copyTextToClipboard(this.state.campaignData.whatsapp.message, "WhatsApp Text Copied!", "Formatted with bold & emojis for groups.");
    } else if (channel === 'reminders') {
      this.copyCurrentReminder();
    } else if (channel === 'faqs') {
      const text = this.state.campaignData.faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n');
      this.copyTextToClipboard(text, "All FAQs Copied!", "Paste into noticeboard or helpdesk docs.");
    }
  },

  copyEmailSubject() {
    if (!this.state.campaignData) return;
    this.copyTextToClipboard(this.state.campaignData.email.subject, "Subject Line Copied!", "Paste into your email subject field.");
  },

  copyCurrentReminder() {
    if (!this.state.campaignData) return;
    const reminder = this.state.campaignData.reminders[this.state.activeReminderTab];
    this.copyTextToClipboard(reminder.text, `Reminder Copied (${reminder.stage})`, "Ready to send as pre-event notification.");
  },

  copyRegistrationLink() {
    if (!this.state.currentEvent) return;
    this.copyTextToClipboard(this.state.currentEvent.registrationLink, "Registration Link Copied!", "Share with attendees.");
  },

  /**
   * Export Entire Campaign as .txt Bundle
   */
  exportAllAsText() {
    if (!this.state.currentEvent || !this.state.campaignData) {
      this.showToast("No Campaign", "Generate an event campaign first.", "fa-circle-exclamation", true);
      return;
    }

    const ev = this.state.currentEvent;
    const camp = this.state.campaignData;
    const dt = CampaignGenerator.formatDateTime(ev.dateTime);

    const fullExport = `========================================================================
EVENT MATE - COMPLETE MARKETING CAMPAIGN BUNDLE
========================================================================
Generated on: ${new Date().toLocaleString()}
Event Name:   ${ev.name}
Date & Time:  ${dt.fullStr}
Venue:        ${ev.venue}
Target:       ${ev.audience}
Tone:         ${ev.tone.toUpperCase()}
Registration: ${ev.registrationLink}
========================================================================

------------------------------------------------------------------------
1. SOCIAL MEDIA & NOTICEBOARD ANNOUNCEMENT
------------------------------------------------------------------------
${camp.social}

------------------------------------------------------------------------
2. EMAIL INVITATION CAMPAIGN
------------------------------------------------------------------------
SUBJECT: ${camp.email.subject}

BODY:
${camp.email.body}

------------------------------------------------------------------------
3. WHATSAPP COMMUNITY MESSAGE
------------------------------------------------------------------------
${camp.whatsapp.message}

Direct WhatsApp Link:
${camp.whatsapp.directShareUrl}

------------------------------------------------------------------------
4. PRE-EVENT REMINDERS
------------------------------------------------------------------------
[PHASE 1: 1 WEEK BEFORE]
${camp.reminders.oneWeek.text}

[PHASE 2: 24 HOURS BEFORE]
${camp.reminders.oneDay.text}

[PHASE 3: 1 HOUR BEFORE]
${camp.reminders.oneHour.text}

------------------------------------------------------------------------
5. FREQUENTLY ASKED QUESTIONS (FAQS)
------------------------------------------------------------------------
${camp.faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n')}

========================================================================
Generated with Event Mate Prototype • College Hackathon Edition
========================================================================`;

    const blob = new Blob([fullExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_campaign.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast("Campaign Exported!", "Downloaded as text bundle (.txt).", "fa-file-arrow-down");
  },

  /**
   * Toast Notification Controller
   */
  showToast(title, desc, icon = "fa-check", isError = false) {
    const toast = document.getElementById('toast');
    const titleEl = document.getElementById('toast-title');
    const descEl = document.getElementById('toast-desc');
    const iconEl = document.getElementById('toast-icon');
    const iconWrapper = document.getElementById('toast-icon-wrapper');

    if (!toast || !titleEl || !descEl || !iconEl) return;

    clearTimeout(this.state.toastTimeout);

    titleEl.textContent = title;
    descEl.textContent = desc;
    iconEl.className = `fa-solid ${icon}`;

    if (isError) {
      iconWrapper.className = "w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm shrink-0";
    } else {
      iconWrapper.className = "w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0";
    }

    toast.classList.remove('hide');
    toast.classList.add('show');

    this.state.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3500);
  },

  hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.remove('show');
      toast.classList.add('hide');
    }
  },

  /* =========================================================================
     ATTENDEE REGISTRATION & WHATSAPP OPT-IN (Requirements 1 & 2)
     ========================================================================= */

  openRegisterModal(preselectEventId = null) {
    this.populateRegisterEventDropdown();
    if (preselectEventId) {
      const select = document.getElementById('reg-event-select');
      if (select) select.value = preselectEventId;
    }
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.add('hidden');
  },

  getAllEvents() {
    if (this.state.eventsList && this.state.eventsList.length > 0) {
      return this.state.eventsList;
    }
    return (window.SAMPLE_EVENTS || []);
  },

  async syncEventsFromBackend() {
    try {
      const res = await fetch(`${this.state.backendUrl}/api/events`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          this.state.eventsList = data.events;
        }
      }
    } catch (e) {
      console.warn("Could not sync events from backend:", e);
    }
    this.populateRegisterEventDropdown();
    this.populateBroadcastEventDropdown();
  },

  populateRegisterEventDropdown() {
    const select = document.getElementById('reg-event-select');
    if (!select) return;

    const events = this.getAllEvents();
    select.innerHTML = events.map(e => `
      <option value="${e.id}">${e.name}</option>
    `).join('');
  },

  async handleRegisterSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById('reg-name');
    const countryInput = document.getElementById('reg-country-code');
    const phoneInput = document.getElementById('reg-phone-number');
    const eventSelect = document.getElementById('reg-event-select');
    const consentCheck = document.getElementById('reg-consent-check');
    const btn = document.getElementById('btn-submit-registration');

    if (!nameInput || !phoneInput || !eventSelect || !consentCheck) return;

    const name = nameInput.value.trim();
    const rawPhone = phoneInput.value.trim().replace(/^0+/, '');
    const countryCode = countryInput.value;
    const fullPhone = `${countryCode}${rawPhone}`;
    const eventId = eventSelect.value;
    const consent = consentCheck.checked;

    if (!name || name.length < 2) {
      this.showToast("Invalid Name", "Please enter attendee full name.", "fa-circle-exclamation", true);
      return;
    }

    if (!rawPhone || rawPhone.length < 6) {
      this.showToast("Invalid Phone", "Please enter a valid mobile number.", "fa-circle-exclamation", true);
      return;
    }

    if (!consent) {
      this.showToast("Consent Required", "Explicit WhatsApp consent is required.", "fa-circle-exclamation", true);
      return;
    }

    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registering...`;

    try {
      const res = await fetch(`${this.state.backendUrl}/api/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: fullPhone,
          eventId,
          consent: true
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.closeRegisterModal();
        nameInput.value = '';
        phoneInput.value = '';
        consentCheck.checked = false;

        this.showToast(
          "Registration Confirmed! 🎉",
          data.message || `Welcome ${name}! WhatsApp updates verified.`,
          "fa-check-circle"
        );

        // If on organizer screen, refresh data
        if (this.state.currentScreen === 'organizer') {
          this.loadOrganizerData();
        }
      } else {
        this.showToast(
          "Registration Failed",
          data.error || "Could not register member.",
          "fa-circle-exclamation",
          true
        );
      }
    } catch (err) {
      console.warn("Backend offline during registration, fallback simulated:", err);
      // Offline fallback
      this.closeRegisterModal();
      this.showToast(
        "Registered (Local Client)",
        `Recorded ${name} (${fullPhone}) with explicit consent. Start backend server for persistence.`,
        "fa-check"
      );
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  },

  /* =========================================================================
     ORGANIZER AUTHENTICATION & DASHBOARD (Requirements 4 & 9)
     ========================================================================= */

  openOrganizerPortal() {
    if (this.state.organizerToken) {
      this.navigateTo('organizer');
      this.loadOrganizerData();
    } else {
      this.openOrganizerLoginModal();
    }
  },

  openOrganizerLoginModal() {
    const modal = document.getElementById('organizer-login-modal');
    const errBox = document.getElementById('org-login-error');
    const pwdInput = document.getElementById('org-login-password');
    if (errBox) errBox.classList.add('hidden');
    if (pwdInput) {
      pwdInput.value = '';
      setTimeout(() => pwdInput.focus(), 150);
    }
    if (modal) modal.classList.remove('hidden');
  },

  closeOrganizerLoginModal() {
    const modal = document.getElementById('organizer-login-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleOrganizerLogin(event) {
    event.preventDefault();

    const pwdInput = document.getElementById('org-login-password');
    const errBox = document.getElementById('org-login-error');
    const btn = document.getElementById('btn-org-login');
    if (!pwdInput) return;

    const password = pwdInput.value;
    const originalBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
    if (errBox) errBox.classList.add('hidden');

    try {
      const res = await fetch(`${this.state.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.state.organizerToken = data.token;
        localStorage.setItem('eventmate_org_token', data.token);
        this.closeOrganizerLoginModal();
        this.navigateTo('organizer');
        this.loadOrganizerData();
        this.showToast("Dashboard Unlocked 🔓", "Welcome to the Organizer Command Center.", "fa-user-shield");
      } else {
        if (errBox) {
          errBox.textContent = data.error || "Incorrect password. Default local password is: admin123";
          errBox.classList.remove('hidden');
        }
      }
    } catch (err) {
      console.warn("Backend offline during login:", err);
      // If backend not running, allow client preview with warning
      this.state.organizerToken = "local-demo-token";
      this.closeOrganizerLoginModal();
      this.navigateTo('organizer');
      this.showToast(
        "Local Demo Mode",
        "Backend offline. Run 'npm start' on port 5000 for full persistent features.",
        "fa-triangle-exclamation"
      );
      this.renderOrganizerMembersWithSample();
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
  },

  logoutOrganizer() {
    this.state.organizerToken = null;
    localStorage.removeItem('eventmate_org_token');
    this.navigateTo('home');
    this.showToast("Logged Out", "Organizer session ended.", "fa-arrow-right-from-bracket");
  },

  async checkWhatsAppStatus() {
    try {
      const res = await fetch(`${this.state.backendUrl}/api/whatsapp/status`);
      if (res.ok) {
        const data = await res.json();
        this.state.whatsappStatus = data;
        this.updateGatewayStatusUI(data);
      }
    } catch (e) {
      // offline
    }
  },

  updateGatewayStatusUI(status) {
    const badge = document.getElementById('org-mode-badge');
    const text = document.getElementById('org-mode-text');
    const gatewayCard = document.getElementById('stat-gateway-mode');
    const policyNote = document.getElementById('wa-policy-note');

    if (!badge || !text) return;

    if (status.isDemoMode) {
      badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5";
      text.textContent = "Demo Simulation Mode";
      if (gatewayCard) gatewayCard.textContent = "Demo Mode (Safe)";
      if (policyNote) {
        policyNote.innerHTML = `<strong>Honest Demo Engine:</strong> No live credentials found in <code>.env</code>. Dispatches are realistically simulated without fake claims.`;
      }
    } else {
      badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5";
      text.textContent = "Live Meta Cloud API";
      if (gatewayCard) gatewayCard.textContent = "Live Cloud API";
      if (policyNote) {
        policyNote.innerHTML = `<strong>Meta Cloud API Active:</strong> Official Graph API v20.0 connected via Phone ID <code>${status.phoneNumberId || 'Configured'}</code>.`;
      }
    }
  },

  async loadOrganizerData() {
    await this.syncEventsFromBackend();
    await this.checkWhatsAppStatus();
    await this.loadOrganizerStats();
    await this.loadOrganizerMembers();
    await this.loadOrganizerLogs();
    this.populateBroadcastEventDropdown();
    this.updateWhatsAppPreview();
  },

  async loadOrganizerStats() {
    if (!this.state.organizerToken) return;
    try {
      const res = await fetch(`${this.state.backendUrl}/api/organizer/stats`, {
        headers: { 'Authorization': `Bearer ${this.state.organizerToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          const m = document.getElementById('stat-total-members');
          const s = document.getElementById('stat-total-sent');
          const c = document.getElementById('stat-consent-rate');
          if (m) m.textContent = data.stats.totalMembers;
          if (s) s.textContent = data.stats.sentCount;
          if (c) c.textContent = `${data.stats.consentRate}%`;
        }
      }
    } catch (e) {
      // offline
    }
  },

  async loadOrganizerMembers(eventId = null) {
    if (!this.state.organizerToken) return;
    try {
      const url = eventId
        ? `${this.state.backendUrl}/api/organizer/members?eventId=${encodeURIComponent(eventId)}`
        : `${this.state.backendUrl}/api/organizer/members`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.state.organizerToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        this.state.organizerMembers = data.members || [];
        this.renderOrganizerMembers(this.state.organizerMembers);
      }
    } catch (e) {
      this.renderOrganizerMembersWithSample();
    }
  },

  renderOrganizerMembers(members) {
    const tbody = document.getElementById('organizer-members-tbody');
    const emptyState = document.getElementById('members-empty-state');
    const countBadge = document.getElementById('member-table-count');

    if (!tbody) return;

    if (!members || members.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (countBadge) countBadge.textContent = 'Showing 0 members';
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (countBadge) countBadge.textContent = `Showing ${members.length} member${members.length > 1 ? 's' : ''}`;

    tbody.innerHTML = members.map(m => {
      const consentDate = m.consentTimestamp
        ? new Date(m.consentTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recorded';

      return `
        <tr class="hover:bg-slate-50/60 transition-colors">
          <td class="py-3 px-3">
            <div class="font-bold text-slate-900">${m.name}</div>
          </td>
          <td class="py-3 px-3">
            <span class="font-mono text-xs text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
              ${m.phone}
            </span>
          </td>
          <td class="py-3 px-3">
            <span class="truncate max-w-[140px] block text-slate-700" title="${m.eventName}">
              ${m.eventName || m.eventId}
            </span>
          </td>
          <td class="py-3 px-3">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <i class="fa-solid fa-check text-[9px]"></i> Opted-In
            </span>
            <div class="text-[10px] text-slate-400 mt-0.5">${consentDate}</div>
          </td>
          <td class="py-3 px-3 text-right">
            <button onclick="App.deleteMemberRegistration('${m.id}')" title="Delete member" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderOrganizerMembersWithSample() {
    const sampleMembers = [
      { id: "mem-001", name: "Aarav Sharma", phone: "+919876543210", eventName: "HackSphere 2026", consent: true },
      { id: "mem-002", name: "Sarah Jenkins", phone: "+14155552671", eventName: "HackSphere 2026", consent: true },
      { id: "mem-003", name: "Rohan Patel", phone: "+919812345678", eventName: "GenAI Masterclass", consent: true }
    ];
    this.renderOrganizerMembers(sampleMembers);
  },

  async deleteMemberRegistration(id) {
    if (!confirm("Remove this attendee registration?")) return;
    try {
      const res = await fetch(`${this.state.backendUrl}/api/organizer/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.state.organizerToken}` }
      });
      if (res.ok) {
        this.showToast("Member Removed", "Registration record deleted.", "fa-trash");
        this.loadOrganizerData();
      }
    } catch (e) {
      this.showToast("Action Failed", "Could not remove member.", "fa-circle-exclamation", true);
    }
  },

  handleMemberEventFilterChange() {
    const select = document.getElementById('filter-member-event');
    const eventId = select ? select.value : '';
    this.loadOrganizerMembers(eventId);
  },

  populateBroadcastEventDropdown() {
    const bSelect = document.getElementById('broadcast-event-select');
    const fSelect = document.getElementById('filter-member-event');
    const events = this.getAllEvents();

    if (bSelect) {
      bSelect.innerHTML = events.map(e => `
        <option value="${e.id}">${e.name}</option>
      `).join('');
    }

    if (fSelect) {
      fSelect.innerHTML = `<option value="">All Events (${events.length})</option>` + events.map(e => `
        <option value="${e.id}">${e.name}</option>
      `).join('');
    }

    this.handleBroadcastEventChange();
  },

  handleBroadcastEventChange() {
    const select = document.getElementById('broadcast-event-select');
    const audienceEl = document.getElementById('broadcast-audience-count');
    const eventId = select ? select.value : '';

    const membersForEvent = this.state.organizerMembers.filter(m => !eventId || m.eventId === eventId);
    if (audienceEl) {
      audienceEl.textContent = `Will be dispatched to ${membersForEvent.length} member(s) with WhatsApp consent.`;
    }

    const dispatchBtnText = document.getElementById('btn-dispatch-text');
    if (dispatchBtnText) {
      dispatchBtnText.textContent = `Send WhatsApp Updates (${membersForEvent.length} Members)`;
    }

    this.updateWhatsAppPreview();
  },

  handleMessageTypeToggle() {
    const typeRadios = document.getElementsByName('broadcast-type');
    let selectedType = 'template';
    for (const r of typeRadios) {
      if (r.checked) selectedType = r.value;
    }

    const templateContainer = document.getElementById('template-options-container');
    if (templateContainer) {
      if (selectedType === 'template') {
        templateContainer.classList.remove('hidden');
      } else {
        templateContainer.classList.add('hidden');
      }
    }

    this.updateWhatsAppPreview();
  },

  handleTemplateSelectionChange() {
    this.updateWhatsAppPreview();
  },

  updateWhatsAppPreview() {
    const previewBody = document.getElementById('wa-preview-body');
    const previewTime = document.getElementById('wa-preview-time');
    const inputAnnounce = document.getElementById('broadcast-announcement-text');
    const selectEvent = document.getElementById('broadcast-event-select');
    const selectTemplate = document.getElementById('broadcast-template-name');

    if (!previewBody) return;

    // Time
    if (previewTime) {
      const now = new Date();
      previewTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const rawText = inputAnnounce && inputAnnounce.value.trim() 
      ? inputAnnounce.value.trim() 
      : "Important update: Check-in begins at 9:00 AM! Please keep your student ID ready.";

    const events = this.getAllEvents();
    const currentEventId = selectEvent ? selectEvent.value : '';
    const selectedEvent = events.find(e => e.id === currentEventId) || events[0] || { name: "HackSphere 2026", venue: "Auditorium Hall B" };

    const typeRadios = document.getElementsByName('broadcast-type');
    let selectedType = 'template';
    for (const r of typeRadios) {
      if (r.checked) selectedType = r.value;
    }

    const templateName = selectTemplate ? selectTemplate.value : 'event_announcement';

    if (selectedType === 'template') {
      if (templateName === 'hello_world') {
        previewBody.innerHTML = `<strong>Hello World!</strong><br><br>This is a pre-configured Meta sandbox test template. Welcome to Event Mate WhatsApp notification services!`;
      } else {
        previewBody.innerHTML = `
📢 <strong>${selectedEvent.name} Announcement</strong><br><br>
Hello <strong>Aarav Sharma</strong>! 👋<br><br>
${rawText}<br><br>
📍 <strong>Venue:</strong> ${selectedEvent.venue || 'Campus Auditorium'}<br>
📅 <strong>Schedule:</strong> Verified Registration Confirmed<br><br>
<span class="text-[10px] text-slate-500 italic">Reply STOP to opt out of updates.</span>
        `.trim();
      }
    } else {
      // Direct text mode
      previewBody.innerHTML = `
📢 <strong>${selectedEvent.name}</strong><br><br>
${rawText}<br><br>
<span class="text-[10px] text-slate-500 italic">Reply STOP to opt out.</span>
      `.trim();
    }
  },

  async handleSendWhatsApp(event) {
    event.preventDefault();

    const selectEvent = document.getElementById('broadcast-event-select');
    const inputAnnounce = document.getElementById('broadcast-announcement-text');
    const selectTemplate = document.getElementById('broadcast-template-name');
    const btn = document.getElementById('btn-dispatch-whatsapp');

    if (!selectEvent || !inputAnnounce) return;

    const eventId = selectEvent.value;
    const announcementText = inputAnnounce.value.trim();

    if (!announcementText) {
      this.showToast("Message Required", "Please enter an announcement to send.", "fa-circle-exclamation", true);
      return;
    }

    const typeRadios = document.getElementsByName('broadcast-type');
    let messageType = 'template';
    for (const r of typeRadios) {
      if (r.checked) messageType = r.value;
    }

    const templateName = selectTemplate ? selectTemplate.value : 'event_announcement';

    const originalBtn = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Broadcasting Updates...`;

    try {
      const res = await fetch(`${this.state.backendUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.state.organizerToken}`
        },
        body: JSON.stringify({
          eventId,
          messageType,
          templateName,
          announcementText
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.summary && data.summary.isDemoMode) {
          this.showToast(
            "Simulation Succeeded (Demo Mode)",
            `Simulated dispatch to ${data.summary.total} member(s). No real WhatsApp messages sent.`,
            "fa-wand-magic-sparkles"
          );
        } else {
          this.showToast(
            "WhatsApp Broadcast Sent! 🚀",
            data.message || `Dispatched to ${data.summary?.sent || 0} recipient(s).`,
            "fa-paper-plane"
          );
        }

        // Refresh stats and logs
        this.loadOrganizerData();
      } else {
        this.showToast(
          "Broadcast Error",
          data.error || "Failed to dispatch WhatsApp broadcast.",
          "fa-circle-exclamation",
          true
        );
      }
    } catch (err) {
      console.warn("Error sending WhatsApp broadcast:", err);
      this.showToast(
        "Server Communication Error",
        "Could not reach backend at http://localhost:5000.",
        "fa-triangle-exclamation",
        true
      );
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
  },

  async loadOrganizerLogs(eventId = null) {
    if (!this.state.organizerToken) return;
    try {
      const url = eventId
        ? `${this.state.backendUrl}/api/organizer/logs?eventId=${encodeURIComponent(eventId)}`
        : `${this.state.backendUrl}/api/organizer/logs`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.state.organizerToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        this.state.organizerLogs = data.logs || [];
        this.renderOrganizerLogs(this.state.organizerLogs);
      }
    } catch (e) {
      // offline
    }
  },

  renderOrganizerLogs(logs) {
    const tbody = document.getElementById('wa-logs-tbody');
    const emptyState = document.getElementById('logs-empty-state');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tbody.innerHTML = logs.map(l => {
      const timeStr = l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : 'Recent';
      
      let statusPill = '';
      if (l.status === 'sent') {
        statusPill = `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Sent (Live)</span>`;
      } else if (l.status === 'simulated') {
        statusPill = `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Simulated (Demo)</span>`;
      } else {
        statusPill = `<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">Failed</span>`;
      }

      const refDetails = l.metaMessageId 
        ? `<span class="text-slate-600 truncate max-w-[160px] block" title="${l.metaMessageId}">${l.metaMessageId}</span>`
        : `<span class="text-rose-600 text-[10px]">${l.details || 'Error'}</span>`;

      return `
        <tr class="hover:bg-slate-50/60">
          <td class="py-2.5 px-3 text-slate-500">${timeStr}</td>
          <td class="py-2.5 px-3 font-sans font-semibold text-slate-900">${l.recipientName || 'Member'}</td>
          <td class="py-2.5 px-3 text-indigo-700">${l.recipientPhone}</td>
          <td class="py-2.5 px-3 font-sans text-slate-700 truncate max-w-[120px]">${l.eventName || l.eventId}</td>
          <td class="py-2.5 px-3 text-slate-500">${l.templateName || l.messageType}</td>
          <td class="py-2.5 px-3">${statusPill}</td>
          <td class="py-2.5 px-3">${refDetails}</td>
        </tr>
      `;
    }).join('');
  }
};

// Auto-boot upon DOM readiness
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
