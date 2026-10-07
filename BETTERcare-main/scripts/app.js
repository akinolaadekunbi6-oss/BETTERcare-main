(function () {
  'use strict';

  var storageKey = 'telecare-appointments';
  var consultationStorageKey = 'telecare-consultations';
  var prescriptionStorageKey = 'telecare-prescriptions';
  var body = document.body;
  var header = document.querySelector('.site-header');
  var nav = document.querySelector('.site-header nav');

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function getSession() {
    try {
      var session = JSON.parse(localStorage.getItem('telecare-session') || 'null');
      return session && typeof session.email === 'string' && session.email.trim() ? session : null;
    } catch (error) {
      return null;
    }
  }

  function showToast(message) {
    var toast = document.querySelector('.toast');
    if (!toast) {
      toast = createElement('div', 'toast');
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 4200);
  }

  function createModal(title, content, className) {
    var modal = createElement('div', 'modal-backdrop ' + (className || ''));
    modal.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" type="button" aria-label="Close">&times;</button><h2 id="modal-title"></h2><div class="modal-content"></div></div>';
    modal.querySelector('#modal-title').textContent = title;
    modal.querySelector('.modal-content').appendChild(content);
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.remove();
    });
    return modal;
  }

  function addHeaderTools() {
    if (!header || !nav) return;
    var menuButton = createElement('button', 'menu-toggle', 'Menu');
    menuButton.type = 'button';
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'main-navigation');
    nav.id = 'main-navigation';
    header.querySelector('.container').insertBefore(menuButton, nav);
    menuButton.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.textContent = isOpen ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.textContent = 'Menu';
      }
    });

    var tools = createElement('div', 'site-tools');
    var portalButton = createElement('button', 'tool-button', getSession() ? 'Dashboard' : 'Patient login');
    var accessButton = createElement('button', 'tool-button', 'Text size');
    var accessibilityMenu = createElement('details', 'accessibility-menu');
    var accessibilitySummary = createElement('summary', 'tool-button', 'Text & language');
    var accessibilityPanel = createElement('div', 'accessibility-panel');
    var languageSelect = document.createElement('select');
    languageSelect.className = 'language-select';
    languageSelect.setAttribute('aria-label', 'Language');
    languageSelect.innerHTML = '<option value="en">English</option><option value="fr">Francais</option><option value="es">Espanol</option>';
    [portalButton, accessButton].forEach(function (button) {
      button.type = 'button';
    });
    accessibilityPanel.appendChild(accessButton);
    accessibilityPanel.appendChild(languageSelect);
    accessibilityMenu.appendChild(accessibilitySummary);
    accessibilityMenu.appendChild(accessibilityPanel);
    tools.appendChild(portalButton);
    tools.appendChild(accessibilityMenu);
    header.querySelector('.container').appendChild(tools);
    portalButton.addEventListener('click', function () {
      window.location.href = getSession() ? 'dashboard.html' : 'login.html';
    });
    accessButton.addEventListener('click', toggleTextSize);
    var heroTriage = document.querySelector('#hero-triage');
    if (heroTriage) heroTriage.addEventListener('click', openTriage);
    var appointmentTriage = document.querySelector('#appointment-triage');
    if (appointmentTriage) appointmentTriage.addEventListener('click', openTriage);
    languageSelect.value = localStorage.getItem('telecare-language') || 'en';
    if (languageSelect.value !== 'en') setLanguage(languageSelect.value, true);
    languageSelect.addEventListener('change', function () { setLanguage(languageSelect.value); });
  }

  function toggleTextSize() {
    var enlarged = body.classList.toggle('large-text');
    localStorage.setItem('telecare-large-text', String(enlarged));
    showToast(enlarged ? 'Larger text enabled.' : 'Larger text disabled.');
  }

  function openPortal() {
    var wrapper = createElement('div');
    var appointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    var intro = createElement('p', null, 'Your local demo portal keeps appointment requests and quick links on this device.');
    wrapper.appendChild(intro);
    var list = createElement('div', 'portal-list');
    if (!appointments.length) {
      list.appendChild(createElement('p', 'empty-state', 'No appointment requests yet.'));
    } else {
      appointments.forEach(function (appointment) {
        var item = createElement('article', 'portal-item');
        item.innerHTML = '<strong>Appointment request</strong><span>' + appointment.date + ' at ' + appointment.time + '</span><small>' + appointment.department + ' · ' + appointment.visitType + '</small>';
        list.appendChild(item);
      });
    }
    wrapper.appendChild(list);
    var actions = createElement('div', 'modal-actions');
    var bookLink = createElement('a', 'btn btn-primary', 'Book an appointment');
    bookLink.href = 'appointments.html';
    actions.appendChild(bookLink);
    wrapper.appendChild(actions);
    createModal('Patient portal', wrapper, 'portal-modal');
  }

  function openTriage() {
    var wrapper = createElement('div');
    var questions = [
      { key: 'symptom', title: 'What brings you in today?', hint: 'Choose the closest match so we can suggest the right starting point.', options: [{ value: 'breathing', label: 'Trouble breathing or chest pain' }, { value: 'mental', label: 'Stress, anxiety, or low mood' }, { value: 'skin', label: 'Skin, allergy, or rash concern' }, { value: 'pain', label: 'Pain, fever, or other physical symptom' }, { value: 'sexual', label: 'Sexual or reproductive health' }] },
      { key: 'duration', title: 'How long has this been happening?', hint: 'This helps the care team understand the timing.', options: [{ value: 'today', label: 'Started today or suddenly' }, { value: 'days', label: 'A few days' }, { value: 'weeks', label: 'More than a week' }, { value: 'ongoing', label: 'Ongoing or recurring' }] },
      { key: 'severity', title: 'How is it affecting you right now?', hint: 'Select the option that best describes your current ability to function.', options: [{ value: 'severe', label: 'Severe: I feel unsafe or cannot function normally' }, { value: 'moderate', label: 'Moderate: it is affecting my day' }, { value: 'mild', label: 'Mild: I can continue most activities' }] }
    ];
    var answers = {};
    var step = 0;
    var content = createElement('div', 'triage-flow');
    var progress = createElement('div', 'triage-progress');
    var result = createElement('div', 'triage-result', '');
    result.setAttribute('aria-live', 'polite');
    var actions = createElement('div', 'modal-actions');
    var back = createElement('button', 'btn btn-outline', 'Back');
    back.type = 'button';
    var next = createElement('button', 'btn btn-primary', 'Continue');
    next.type = 'button';
    actions.appendChild(back);
    actions.appendChild(next);
    wrapper.appendChild(createElement('p', null, 'This guided intake is for care navigation, not a diagnosis. If you may be having a medical emergency, call emergency services or the 24/7 nurse triage line now.'));
    wrapper.appendChild(progress);
    wrapper.appendChild(content);
    wrapper.appendChild(result);
    wrapper.appendChild(actions);

    function renderQuestion() {
      var question = questions[step];
      progress.textContent = 'Step ' + (step + 1) + ' of ' + questions.length;
      content.innerHTML = '<h3>' + question.title + '</h3><p class="triage-hint">' + question.hint + '</p>';
      var options = createElement('div', 'triage-options');
      question.options.forEach(function (option) {
        var label = createElement('label', 'triage-option');
        label.innerHTML = '<input type="radio" name="triage-' + question.key + '" value="' + option.value + '"><span>' + option.label + '</span>';
        var input = label.querySelector('input');
        input.checked = answers[question.key] === option.value;
        input.addEventListener('change', function () { answers[question.key] = input.value; });
        options.appendChild(label);
      });
      content.appendChild(options);
      result.textContent = '';
      back.hidden = step === 0;
      next.textContent = step === questions.length - 1 ? 'See care route' : 'Continue';
    }

    function showResult() {
      var emergency = answers.symptom === 'breathing' || answers.severity === 'severe' || (answers.symptom === 'pain' && answers.duration === 'today');
      var route = emergency ? { title: 'Get urgent help now', message: 'Your answers may need urgent assessment. Do not wait for an online appointment. Call emergency services or the campus 24/7 nurse triage line, or go to the nearest emergency department.', department: '' } : answers.symptom === 'mental' ? { title: 'Start with Mental Health & Counselling', message: 'A confidential counselling appointment is a suitable next step. If you feel at risk of harming yourself or someone else, call emergency services now.', department: 'Mental health & counselling' } : answers.symptom === 'sexual' ? { title: 'Start with Sexual & Reproductive Health', message: 'A confidential consultation with the sexual and reproductive health team is a good next step.', department: 'Sexual & reproductive health' } : answers.symptom === 'skin' ? { title: 'Start with General Practice', message: 'General Practice can assess skin, allergy, and rash concerns and refer you if needed.', department: 'General practice' } : { title: 'Start with General Practice', message: 'A virtual consultation is a good starting point. The clinician can assess your symptoms and arrange follow-up if needed.', department: 'General practice' };
      localStorage.setItem('telecare-triage', JSON.stringify({ route: route.title, department: route.department, answers: answers, createdAt: new Date().toISOString() }));
      content.innerHTML = '<div class="triage-result-heading"><span class="eyebrow">Suggested next step</span><h3>' + route.title + '</h3></div><p>' + route.message + '</p>';
      progress.textContent = 'Assessment complete';
      result.textContent = 'Your answers are saved on this device so you can share the summary during booking.';
      actions.innerHTML = '';
      if (!emergency) {
        var link = createElement('a', 'btn btn-primary', 'Book recommended care');
        link.href = 'appointments.html' + (route.department ? '?department=' + encodeURIComponent(route.department) : '');
        actions.appendChild(link);
      }
      var close = createElement('button', 'btn btn-outline', emergency ? 'Close' : 'Finish');
      close.type = 'button';
      actions.appendChild(close);
      close.addEventListener('click', function () { modal.remove(); });
    }

    next.addEventListener('click', function () {
      if (!answers[questions[step].key]) { result.textContent = 'Choose an answer to continue.'; return; }
      if (step === questions.length - 1) showResult(); else { step += 1; renderQuestion(); }
    });
    back.addEventListener('click', function () { if (step > 0) { step -= 1; renderQuestion(); } });
    var modal = createModal('Smart symptom check', wrapper, 'triage-modal');
    renderQuestion();
  }

  function enhanceAppointmentForm() {
    var form = document.querySelector('form');
    if (!form || !document.querySelector('#visit-type')) return;
    var query = new URLSearchParams(window.location.search);
    var routedDepartment = query.get('department');
    var routedDoctor = query.get('doctor');
    var departmentSelect = form.querySelector('#department');
    var matchingDepartment = departmentSelect && Array.from(departmentSelect.options).find(function (option) {
      return option.value.toLowerCase() === (routedDepartment || '').toLowerCase() || option.textContent.toLowerCase() === (routedDepartment || '').toLowerCase();
    });
    if (matchingDepartment) departmentSelect.value = matchingDepartment.value || matchingDepartment.textContent;
    var doctorField = form.querySelector('#preferred-doctor');
    var doctorNote = form.querySelector('#doctor-booking-note');
    if (routedDoctor && doctorField) {
      doctorField.value = routedDoctor;
      if (doctorNote) {
        doctorNote.hidden = false;
        doctorNote.querySelector('strong').textContent = routedDoctor;
      }
    }
    var insurance = form.querySelector('#insurance');
    var costText = form.querySelector('#cost-preview-text');
    function updateCostEstimate() {
      var estimates = { 'Student health plan': 'Eligibility check: covered in demo · Estimated out-of-pocket: $0', 'Private insurance': 'Eligibility check: member number needed · Estimated out-of-pocket: $20–$45', 'Pay at clinic': 'Self-pay estimate: $35 virtual · $50 in-person', 'Need fee guidance': 'A coordinator will verify eligibility and share a cost estimate before confirmation.' };
      costText.textContent = estimates[insurance.value];
    }
    if (insurance && costText) { insurance.addEventListener('change', updateCostEstimate); updateCostEstimate(); }
    var reminder = document.createElement('div');
    reminder.className = 'form-row checkbox-row';
    reminder.innerHTML = '<label><input type="checkbox" id="reminders" checked> Send me appointment reminders by email and text</label>';
    var submitButton = form.querySelector('button[type="submit"]');
    form.insertBefore(reminder, submitButton);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var date = form.querySelector('#date').value;
      var time = form.querySelector('#time').value;
      var appointment = {
        date: date || 'To be confirmed',
        time: time || 'To be confirmed',
        department: form.querySelector('#department').value,
        visitType: form.querySelector('#visit-type').value,
        doctor: doctorField ? doctorField.value : '',
        insurance: form.querySelector('#insurance') ? form.querySelector('#insurance').value : 'Student health plan',
        reminders: form.querySelector('#reminders').checked
      };
      var saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      saved.push(appointment);
      localStorage.setItem(storageKey, JSON.stringify(saved));
      form.reset();
      showToast('Appointment request saved. Check the patient portal for details.');
    });
  }

  function openFeatureModal(title, message, buttonText) {
    var wrapper = createElement('div');
    wrapper.appendChild(createElement('p', null, message));
    var action = createElement('button', 'btn btn-primary', buttonText || 'Done');
    action.type = 'button';
    wrapper.appendChild(action);
    var modal = createModal(title, wrapper);
    action.addEventListener('click', function () { modal.remove(); showToast('Your request has been saved in this demo.'); });
  }

  function enhanceCareTools() {
    var videoButton = document.querySelector('#start-video');
    if (videoButton) videoButton.addEventListener('click', function () {
      var wrapper = createElement('div', 'video-room');
      wrapper.innerHTML = '<div class="video-preview"><div><strong>Live consultation room</strong><span>Camera and microphone are ready for your appointment.</span><span class="video-demo-label">Translation and captions demo</span></div></div><div class="video-status"><p><strong>Demo room</strong><br>Dr. Doyin Okonkwo<br>General Practice</p><div class="video-controls"><label for="translation-language">Translate speech to</label><select id="translation-language"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="ar">Arabic</option></select><label class="checkbox-row"><input type="checkbox" id="live-captions" checked> Show live captions</label><button type="button" class="btn btn-primary" id="join-video">Join room</button></div></div><div class="caption-panel" aria-live="polite"><div class="caption-heading"><strong>Live captions</strong><span id="caption-status">Waiting to join</span></div><p id="caption-text">Captions will appear here when the consultation starts.</p><p id="translation-text" class="translation-text">Translated speech will appear here.</p><button type="button" class="btn btn-outline" id="play-translation" disabled>Play translated audio</button></div><div class="prescription-panel"><div class="caption-heading"><strong>Integrated e-prescription</strong><span>Doctor workflow</span></div><p class="panel-help">Send a prescription to the preferred pickup or delivery pharmacy.</p><button type="button" class="btn btn-primary" id="open-prescription">Issue prescription</button></div>';
      wrapper.innerHTML += '<div class="care-tools-grid"><section class="care-tool-card waiting-room-panel"><div class="caption-heading"><strong>Digital waiting room</strong><span id="wait-status">Ready</span></div><p id="wait-time">Estimated wait: 3 minutes</p><p id="wait-tip">While you wait: prepare your medication list for the clinician.</p></section><section class="care-tool-card"><div class="caption-heading"><strong>Connected health</strong><span id="device-status">No device connected</span></div><div class="vitals-grid"><div><strong id="vital-heart">--</strong><small>Heart rate</small></div><div><strong id="vital-pressure">--</strong><small>Blood pressure</small></div><div><strong id="vital-glucose">--</strong><small>Glucose</small></div></div><button type="button" class="btn btn-outline" id="connect-device">Connect wearable</button></section><section class="care-tool-card"><div class="caption-heading"><strong>Family &amp; caregiver access</strong><span>Invite securely</span></div><div class="form-row"><label for="caregiver-name">Name</label><input id="caregiver-name" type="text" placeholder="Trusted person"></div><div class="form-row"><label for="caregiver-role">Role and permission</label><select id="caregiver-role"><option value="support">Support person · Can join and view visit</option><option value="translator">Translator · Can join and speak</option><option value="observer">Observer · Can view only</option></select></div><button type="button" class="btn btn-outline" id="invite-caregiver">Send invite</button><p id="caregiver-invite-status" class="form-footnote">No invite sent.</p></section><section class="care-tool-card connectivity-card"><div class="caption-heading"><strong>Connection mode</strong><span id="connection-status">Full video</span></div><p class="panel-help">Automatically switch to audio and text chat when bandwidth drops.</p><button type="button" class="btn btn-outline" id="toggle-low-bandwidth">Use low-bandwidth mode</button><div id="text-chat" class="text-chat" hidden><p><strong>Audio and text fallback ready.</strong> Your camera is paused to preserve the connection.</p></div></section></div>';
      var modal = createModal('Live video consultation', wrapper, 'video-modal');
      var joinButton = wrapper.querySelector('#join-video');
      var captions = wrapper.querySelector('#live-captions');
      var language = wrapper.querySelector('#translation-language');
      var captionStatus = wrapper.querySelector('#caption-status');
      var captionText = wrapper.querySelector('#caption-text');
      var translationText = wrapper.querySelector('#translation-text');
      var playTranslation = wrapper.querySelector('#play-translation');
      var captionPanel = wrapper.querySelector('.caption-panel');
      var prescriptionButton = wrapper.querySelector('#open-prescription');
      var connectDevice = wrapper.querySelector('#connect-device');
      var deviceStatus = wrapper.querySelector('#device-status');
      var caregiverInvite = wrapper.querySelector('#invite-caregiver');
      var caregiverStatus = wrapper.querySelector('#caregiver-invite-status');
      var lowBandwidth = wrapper.querySelector('#toggle-low-bandwidth');
      var connectionStatus = wrapper.querySelector('#connection-status');
      var textChat = wrapper.querySelector('#text-chat');
      var waitStatus = wrapper.querySelector('#wait-status');
      var waitTime = wrapper.querySelector('#wait-time');
      var waitTip = wrapper.querySelector('#wait-tip');
      var phrases = [
        { en: 'Tell me when your symptoms started.', es: 'Dime cuando comenzaron tus sintomas.', fr: 'Dites-moi quand vos symptomes ont commence.', ar: 'اخبرني متى بدأت الأعراض.' },
        { en: 'I will review that with you now.', es: 'Lo revisare contigo ahora.', fr: 'Je vais examiner cela avec vous maintenant.', ar: 'سأراجع ذلك معك الآن.' },
        { en: 'We can agree on the next step together.', es: 'Podemos acordar juntos el siguiente paso.', fr: 'Nous pouvons definir ensemble la prochaine etape.', ar: 'يمكننا الاتفاق على الخطوة التالية معًا.' }
      ];
      var phraseIndex = 0;
      var timer;

      function updateCaption() {
        var phrase = phrases[phraseIndex % phrases.length];
        captionText.textContent = 'Clinician: ' + phrase.en;
        translationText.textContent = language.options[language.selectedIndex].text + ': ' + phrase[language.value];
        phraseIndex += 1;
      }

      joinButton.addEventListener('click', function () {
        joinButton.disabled = true;
        joinButton.textContent = 'Consultation active';
        captionStatus.textContent = 'Listening';
        playTranslation.disabled = false;
        updateCaption();
        timer = window.setInterval(function () { if (modal.isConnected) updateCaption(); }, 4000);
      });
      captions.addEventListener('change', function () {
        captionPanel.hidden = !captions.checked;
        captionStatus.textContent = captions.checked ? 'Listening' : 'Captions off';
      });
      language.addEventListener('change', updateCaption);
      playTranslation.addEventListener('click', function () {
        if (!window.speechSynthesis) { showToast('Translated audio is not supported in this browser.'); return; }
        var utterance = new SpeechSynthesisUtterance(translationText.textContent.replace(/^[^:]+:\s*/, ''));
        utterance.lang = language.value === 'ar' ? 'ar-SA' : language.value === 'es' ? 'es-ES' : language.value === 'fr' ? 'fr-FR' : 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
      prescriptionButton.addEventListener('click', function () {
        var prescription = createElement('div', 'prescription-form');
        prescription.innerHTML = '<p class="modal-intro">This demo sends the prescription request to the selected pharmacy. A real prescription must be reviewed and signed by a licensed clinician.</p><div class="form-row"><label for="prescription-name">Medication and strength</label><input id="prescription-name" type="text" placeholder="e.g. Medication name, 10 mg" required></div><div class="form-row"><label for="prescription-directions">Directions</label><textarea id="prescription-directions" placeholder="Dose, frequency, and duration" required></textarea></div><div class="form-row"><label for="prescription-pharmacy">Send to</label><select id="prescription-pharmacy"><option value="Campus Clinic Pharmacy">Campus Clinic Pharmacy · Pickup</option><option value="Greenway Pharmacy">Greenway Pharmacy · Pickup</option><option value="Home delivery pharmacy">Home delivery pharmacy · Delivery</option></select></div><div class="form-row" id="delivery-address-row" hidden><label for="delivery-address">Delivery address</label><input id="delivery-address" type="text" placeholder="Address for pharmacy delivery"></div><div class="modal-actions"><button type="button" class="btn btn-primary" id="send-prescription">Send to pharmacy</button></div><p class="form-footnote">The patient will see the pharmacy destination and fulfillment status in their dashboard.</p>';
        var prescriptionModal = createModal('Issue e-prescription', prescription);
        var pharmacy = prescription.querySelector('#prescription-pharmacy');
        var addressRow = prescription.querySelector('#delivery-address-row');
        pharmacy.addEventListener('change', function () { addressRow.hidden = pharmacy.value !== 'Home delivery pharmacy'; });
        prescription.querySelector('#send-prescription').addEventListener('click', function () {
          var name = prescription.querySelector('#prescription-name');
          var directions = prescription.querySelector('#prescription-directions');
          if (!name.value.trim() || !directions.value.trim() || (pharmacy.value === 'Home delivery pharmacy' && !prescription.querySelector('#delivery-address').value.trim())) { showToast('Complete the prescription and pharmacy details first.'); return; }
          var saved = JSON.parse(localStorage.getItem(prescriptionStorageKey) || '[]');
          saved.unshift({ medication: name.value.trim(), directions: directions.value.trim(), pharmacy: pharmacy.value, address: prescription.querySelector('#delivery-address').value.trim(), status: pharmacy.value === 'Home delivery pharmacy' ? 'Preparing for delivery' : 'Ready for pharmacy pickup', createdAt: new Date().toISOString() });
          localStorage.setItem(prescriptionStorageKey, JSON.stringify(saved));
          prescriptionModal.remove();
          showToast('Prescription sent to ' + pharmacy.value + '.');
        });
      });
      connectDevice.addEventListener('click', function () {
        deviceStatus.textContent = 'Smartwatch connected';
        wrapper.querySelector('#vital-heart').textContent = '76 bpm';
        wrapper.querySelector('#vital-pressure').textContent = '118/76';
        wrapper.querySelector('#vital-glucose').textContent = '96 mg/dL';
        localStorage.setItem('telecare-vitals', JSON.stringify({ device: 'Smartwatch', heartRate: '76 bpm', bloodPressure: '118/76', glucose: '96 mg/dL', updatedAt: new Date().toISOString() }));
        connectDevice.textContent = 'Device connected';
        showToast('Wearable vitals synced for clinician review.');
      });
      caregiverInvite.addEventListener('click', function () {
        var name = wrapper.querySelector('#caregiver-name').value.trim();
        if (!name) { showToast('Enter a caregiver name first.'); return; }
        var role = wrapper.querySelector('#caregiver-role');
        caregiverStatus.textContent = 'Invite sent to ' + name + ' (' + role.options[role.selectedIndex].text + ').';
        localStorage.setItem('telecare-caregiver', JSON.stringify({ name: name, permission: role.value, status: 'Invite sent' }));
      });
      lowBandwidth.addEventListener('click', function () {
        var enabled = !lowBandwidth.classList.toggle('is-active');
        connectionStatus.textContent = enabled ? 'Full video' : 'Audio + text';
        lowBandwidth.textContent = enabled ? 'Use low-bandwidth mode' : 'Restore full video';
        textChat.hidden = enabled;
        showToast(enabled ? 'Full video restored.' : 'Low-bandwidth mode enabled.');
      });
      joinButton.addEventListener('click', function () {
        waitStatus.textContent = 'In consultation';
        waitTime.textContent = 'Your clinician is ready now';
        waitTip.textContent = 'Health education: keep your camera at eye level and speak clearly.';
      });
      var observer = new MutationObserver(function () { if (!modal.isConnected) { window.clearInterval(timer); observer.disconnect(); } });
      observer.observe(document.body, { childList: true });
    });
    var paymentButton = document.querySelector('#payment-help');
    if (paymentButton) paymentButton.addEventListener('click', function () { openFeatureModal('Payment and insurance', 'Your student health plan can be selected during booking. Private insurance claims may require a member number, while pay-at-clinic visits are settled at reception.', 'Close guidance'); });
    var feedbackButton = document.querySelector('#leave-feedback');
    if (feedbackButton) feedbackButton.addEventListener('click', function () { window.location.href = 'dashboard.html#feedback'; });
  }

  function enhanceAsyncConsultation() {
    var form = document.querySelector('#async-consultation-form');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var files = Array.from(form.querySelector('#async-media').files);
      if (files.length > 3) { showToast('Choose up to 3 files.'); return; }
      if (files.some(function (file) { return file.size > 20 * 1024 * 1024; })) { showToast('Each file must be 20 MB or smaller.'); return; }
      var submittedAt = new Date();
      var responseBy = new Date(submittedAt);
      responseBy.setDate(responseBy.getDate() + 1);
      if (responseBy.getDay() === 0) responseBy.setDate(responseBy.getDate() + 1);
      if (responseBy.getDay() === 6) responseBy.setDate(responseBy.getDate() + 2);
      var consultation = {
        category: form.querySelector('#async-category').value,
        description: form.querySelector('#async-description').value,
        files: files.map(function (file) { return file.name; }),
        status: 'Awaiting clinician review',
        submittedAt: submittedAt.toISOString(),
        responseBy: responseBy.toISOString()
      };
      var saved = JSON.parse(localStorage.getItem(consultationStorageKey) || '[]');
      saved.unshift(consultation);
      localStorage.setItem(consultationStorageKey, JSON.stringify(saved));
      form.reset();
      showToast('Case submitted. A clinician will respond within 1 business day.');
    });
  }

  function enhanceDashboardTools() {
    if (!document.querySelector('.dashboard-section')) return;
    var rating = 0;
    document.querySelectorAll('#dashboard-rating button').forEach(function (button) {
      button.addEventListener('click', function () {
        rating = Number(button.dataset.rating);
        document.querySelectorAll('#dashboard-rating button').forEach(function (item) { item.classList.toggle('is-selected', Number(item.dataset.rating) <= rating); });
      });
    });
    var submit = document.querySelector('#submit-feedback');
    if (submit) submit.addEventListener('click', function () {
      if (!rating) { showToast('Choose a star rating first.'); return; }
      var feedback = { rating: rating, note: document.querySelector('#feedback-note').value };
      localStorage.setItem('telecare-feedback', JSON.stringify(feedback));
      showToast('Thank you. Your feedback was saved.');
    });
    var markRead = document.querySelector('#mark-notifications');
    if (markRead) markRead.addEventListener('click', function () { document.querySelectorAll('.notification-item').forEach(function (item) { item.style.opacity = '.55'; }); showToast('Notifications marked as read.'); });
    var paymentSettings = document.querySelector('#payment-settings');
    if (paymentSettings) paymentSettings.addEventListener('click', function () { openFeatureModal('Payment settings', 'Payment details are protected and will be connected to the clinic payment provider in the production version.', 'Close'); });
  }

  function setLanguage(language, silent) {
    var labels = {
      en: { home: 'Home', telemedicine: 'Telemedicine', appointment: 'Book Appointment', doctors: 'Doctors', services: 'Services', resources: 'Lab Tests', contact: 'Contact', login: 'Patient login' },
      fr: { home: 'Accueil', telemedicine: 'Telemedecine', appointment: 'Prendre rendez-vous', doctors: 'Medecins', services: 'Services', resources: 'Analyses de laboratoire', contact: 'Contact', login: 'Connexion patient' },
      es: { home: 'Inicio', telemedicine: 'Telemedicina', appointment: 'Reservar cita', doctors: 'Medicos', services: 'Servicios', resources: 'Analisis de laboratorio', contact: 'Contacto', login: 'Acceso del paciente' }
    };
    var translation = labels[language] || labels.en;
    var navLabels = [translation.home, translation.telemedicine, translation.appointment, translation.doctors, translation.services, translation.resources];
    document.querySelectorAll('.nav-list a').forEach(function (link, index) {
      if (index < navLabels.length) link.textContent = navLabels[index];
      if (link.href.indexOf('login.html') !== -1 || link.href.indexOf('dashboard.html') !== -1) link.textContent = translation.login;
      if (link.href.indexOf('contact.html') !== -1) link.textContent = translation.contact;
    });
    document.documentElement.lang = language;
    localStorage.setItem('telecare-language', language);
    if (!silent) showToast(language === 'fr' ? 'Langue definie sur Francais.' : language === 'es' ? 'Idioma establecido en Espanol.' : 'Language set to English.');
  }

  function enhanceDoctors() {
    var grid = document.querySelector('.doctor-grid');
    if (!grid) return;
    var today = new Date().getDay();
    grid.querySelectorAll('.doctor').forEach(function (card, index) {
      var name = card.querySelector('h3').textContent.trim();
      var department = card.querySelector('.role-tag').textContent.trim();
      var availableDays = (card.dataset.availableDays || '').split(',').map(Number);
      var available = availableDays.indexOf(today) !== -1;
      var booking = createElement('div', 'doctor-booking');
      var status = createElement('span', 'doctor-status' + (available ? '' : ' is-unavailable'), available ? 'Available today' : 'Not available today');
      var button = createElement('button', 'btn btn-outline doctor-book-button', 'Book now');
      status.id = 'doctor-availability-' + index;
      status.setAttribute('role', 'status');
      button.type = 'button';
      button.setAttribute('aria-describedby', status.id);
      button.addEventListener('click', function () {
        if (!available) {
          showToast(name + ' is not available today.');
          return;
        }
        window.location.href = 'appointments.html?doctor=' + encodeURIComponent(name) + '&department=' + encodeURIComponent(department);
      });
      booking.appendChild(status);
      booking.appendChild(button);
      card.querySelector('.avail').insertAdjacentElement('afterend', booking);
    });
    var controls = createElement('div', 'filter-bar');
    controls.innerHTML = '<label for="doctor-filter">Filter clinicians</label><select id="doctor-filter"><option value="all">All departments</option><option value="General Practice">General Practice</option><option value="Mental Health & Counselling">Mental Health & Counselling</option><option value="Sexual & Reproductive Health">Sexual & Reproductive Health</option><option value="Physiotherapy">Physiotherapy</option></select>';
    grid.parentNode.insertBefore(controls, grid);
    controls.querySelector('select').addEventListener('change', function (event) {
      var value = event.target.value;
      grid.querySelectorAll('.doctor').forEach(function (card) {
        var role = card.querySelector('.role-tag').textContent;
        card.hidden = value !== 'all' && role !== value;
      });
    });
  }

  function enhanceAuth() {
    var loginForm = document.querySelector('#login-form');
    if (loginForm) {
      if (getSession()) window.location.href = 'dashboard.html';
      loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;
        var email = document.querySelector('#login-email').value;
        localStorage.setItem('telecare-session', JSON.stringify({ email: email }));
        window.location.href = 'dashboard.html';
      });
      var createAccount = document.querySelector('#create-account');
      if (createAccount) createAccount.addEventListener('click', function () { showToast('Demo account ready. Sign in with any email and a four-character password.'); });
      var forgotPassword = document.querySelector('#forgot-password');
      if (forgotPassword) forgotPassword.addEventListener('click', function () { showToast('Password reset is available when a secure backend is connected.'); });
    }

    var dashboard = document.querySelector('.dashboard-section');
    if (!dashboard) return;
    var session = getSession();
    document.querySelector('#dashboard-greeting').textContent = 'Welcome back';
    document.querySelector('#profile-email').textContent = session.email;
    var list = document.querySelector('#dashboard-appointments');
    var appointments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (appointments.length) {
      list.innerHTML = '';
      appointments.forEach(function (appointment) {
        var item = createElement('article', 'dashboard-appointment');
        item.innerHTML = '<strong>' + appointment.department + '</strong><span>' + appointment.date + ' at ' + appointment.time + '</span><small>' + appointment.visitType + ' · Reminder preference saved</small>';
        list.appendChild(item);
      });
    }
    var consultationList = document.querySelector('#dashboard-consultations');
    var consultations = JSON.parse(localStorage.getItem(consultationStorageKey) || '[]');
    if (consultationList && consultations.length) {
      consultationList.innerHTML = '';
      consultations.forEach(function (consultation) {
        var item = createElement('article', 'dashboard-appointment');
        var responseDate = new Date(consultation.responseBy).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        item.innerHTML = '<strong>' + consultation.category + '</strong><span>' + consultation.status + '</span><small>Response target: ' + responseDate + ' · ' + consultation.files.length + ' attachment(s)</small>';
        consultationList.appendChild(item);
      });
    }
    var prescriptionList = document.querySelector('#dashboard-prescriptions');
    var prescriptions = JSON.parse(localStorage.getItem(prescriptionStorageKey) || '[]');
    if (prescriptionList && prescriptions.length) {
      prescriptionList.innerHTML = '';
      prescriptions.forEach(function (prescription) {
        var item = createElement('article', 'dashboard-appointment');
        item.innerHTML = '<strong>' + prescription.medication + '</strong><span>' + prescription.status + '</span><small>' + prescription.pharmacy + ' · Directions available in your secure record</small>';
        prescriptionList.appendChild(item);
      });
    }
    var vitals = JSON.parse(localStorage.getItem('telecare-vitals') || 'null');
    var vitalsPanel = document.querySelector('#dashboard-vitals');
    if (vitals && vitalsPanel) {
      vitalsPanel.innerHTML = '<div class="vitals-grid"><div><strong>' + vitals.heartRate + '</strong><small>Heart rate</small></div><div><strong>' + vitals.bloodPressure + '</strong><small>Blood pressure</small></div><div><strong>' + vitals.glucose + '</strong><small>Glucose</small></div></div><small class="form-footnote">' + vitals.device + ' · Updated just now</small>';
    }
    var caregiver = JSON.parse(localStorage.getItem('telecare-caregiver') || 'null');
    var caregiverPanel = document.querySelector('#dashboard-caregiver-status');
    if (caregiver && caregiverPanel) caregiverPanel.textContent = 'Invite sent to ' + caregiver.name + '. Permission: ' + caregiver.permission + '.';
    var manageDevices = document.querySelector('#manage-devices');
    if (manageDevices) manageDevices.addEventListener('click', function () { openFeatureModal('Connected health devices', 'Device pairing is simulated in this demo. A production version would use a secure wearable health-data connector and patient consent.', 'Close'); });
    document.querySelector('#logout-button').addEventListener('click', function () {
      localStorage.removeItem('telecare-session');
      window.location.href = 'login.html';
    });
    document.querySelector('#message-care').addEventListener('click', function () { showToast('Secure messaging will be available when the clinic backend is connected.'); });
    dashboard.querySelectorAll('[data-demo-action]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        showToast('This demo section is ready for secure records integration.');
      });
    });
  }

  function restorePreferences() {
    if (localStorage.getItem('telecare-large-text') === 'true') body.classList.add('large-text');
  }

  if (document.querySelector('.dashboard-section') && !getSession()) {
    window.location.replace('login.html');
    return;
  }

  addHeaderTools();
  enhanceAppointmentForm();
  enhanceDoctors();
  enhanceAuth();
  enhanceCareTools();
  enhanceAsyncConsultation();
  enhanceDashboardTools();
  restorePreferences();
}());
