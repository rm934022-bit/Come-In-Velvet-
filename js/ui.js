// ============================================================================
// Come In, Velvet! — Chat Interrogation & Manual Detective Clipboard UI
// ============================================================================

class UIController {
  constructor(game) {
    this.game = game;

    // Main Modal Elements
    this.modal = document.getElementById('question-modal');
    this.portraitCanvas = document.getElementById('qm-portrait');
    this.portraitCtx = this.portraitCanvas.getContext('2d');
    this.velvetCanvas = document.getElementById('qm-velvet-portrait');
    this.velvetCtx = this.velvetCanvas.getContext('2d');

    this.elVelvetCard = document.getElementById('qm-velvet-card');
    this.elGuestCard = document.getElementById('qm-guest-card');
    this.elVelvetMood = document.getElementById('qm-velvet-mood');

    this.elName = document.getElementById('qm-guest-name');
    this.elCostume = document.getElementById('qm-guest-costume');
    this.elScanBeam = document.getElementById('qm-scan-beam');

    this.elHourLabel = document.getElementById('qm-hour-label');
    this.elChatLog = document.getElementById('qm-chat-log');
    this.elRulesContent = document.getElementById('qm-rules-content');

    // 3 Chat Question Option Buttons
    this.stepDot1 = document.getElementById('step-dot-1');
    this.stepDot2 = document.getElementById('step-dot-2');
    this.stepDot3 = document.getElementById('step-dot-3');
    this.qStatus1 = document.getElementById('q-status-1');
    this.qStatus2 = document.getElementById('q-status-2');
    this.qStatus3 = document.getElementById('q-status-3');

    // 3 Manual Clipboard Claim Rows & Notepad Marks
    this.claimRow1 = document.getElementById('claim-row-1');
    this.claimRow2 = document.getElementById('claim-row-2');
    this.claimRow3 = document.getElementById('claim-row-3');
    this.evBody1 = document.getElementById('ev-body-1');
    this.evBody2 = document.getElementById('ev-body-2');
    this.evBody3 = document.getElementById('ev-body-3');
    this.evMark1 = document.getElementById('ev-mark-1');
    this.evMark2 = document.getElementById('ev-mark-2');
    this.evMark3 = document.getElementById('ev-mark-3');

    this.btnAdmit = document.getElementById('btn-admit');
    this.btnReject = document.getElementById('btn-reject');
    this.btnCloseModal = document.getElementById('qm-close');

    // Guestbook Drawer & Header Buttons
    this.drawer = document.getElementById('guestbook-drawer');
    this.gbBody = document.getElementById('gb-body');
    this.btnGuestbook = document.getElementById('btn-guestbook');
    this.btnCloseGb = document.getElementById('gb-close');
    this.btnMute = document.getElementById('btn-mute');
    this.btnRestart = document.getElementById('btn-restart');

    // Interrogation State
    this.activeGuest = null;
    this.currentStep = 0; // 0 = greeting, 1 = id, 2 = pass, 3 = inspect
    this.typewriterFullText = '';
    this.typewriterIndex = 0;
    this.typewriterTimer = null;
    this.activeTypingEl = null;

    this.bindEvents();
  }

  bindEvents() {
    this.stepDot1.addEventListener('click', () => this.askQuestion('id'));
    this.stepDot2.addEventListener('click', () => this.askQuestion('pass'));
    this.stepDot3.addEventListener('click', () => this.askQuestion('inspect'));

    // Clickable Manual Detective Marks ([?] -> [✓] -> [✕])
    this.claimRow1.addEventListener('click', () => this.cycleManualMark(1));
    this.claimRow2.addEventListener('click', () => this.cycleManualMark(2));
    this.claimRow3.addEventListener('click', () => this.cycleManualMark(3));

    // Clicking chat log finishes typewriter immediately
    this.elChatLog.addEventListener('click', () => {
      if (this.isTyping()) {
        this.finishTypewriter();
      }
    });

    this.btnAdmit.addEventListener('click', () => this.game.resolveDoorGuest(true));
    this.btnReject.addEventListener('click', () => this.game.resolveDoorGuest(false));
    this.btnCloseModal.addEventListener('click', () => this.closeQuestionModal());

    this.btnGuestbook.addEventListener('click', () => this.toggleGuestbook());
    this.btnCloseGb.addEventListener('click', () => this.drawer.classList.add('hidden'));

    this.btnMute.addEventListener('click', () => {
      const muted = window.SFX.toggleMute();
      this.btnMute.textContent = muted ? '[M] SOUND: OFF' : '[M] SOUND: ON';
    });

    this.btnRestart.addEventListener('click', () => {
      this.closeQuestionModal();
      this.game.startNewNight();
    });
  }

  cycleManualMark(slot) {
    if (!this.activeGuest) return;
    if (!this.activeGuest.manualMarks) {
      this.activeGuest.manualMarks = { 1: 0, 2: 0, 3: 0 };
    }
    this.activeGuest.manualMarks[slot] = (this.activeGuest.manualMarks[slot] + 1) % 3;
    window.SFX.talkBlip(1.25);
    this.updateEvidenceCards();
  }

  openQuestionModal(guest, hourIndex, timeString) {
    this.activeGuest = guest;
    this.currentStep = guest.lastStep || 0;
    this.modal.classList.remove('hidden');

    this.elName.textContent = guest.askedId ? guest.name.toUpperCase() : 'UNKNOWN VISITOR';
    this.elCostume.textContent = `OUTFIT: ${guest.costume.toUpperCase()}`;
    this.elHourLabel.textContent = timeString;
    this.elVelvetMood.textContent = 'INTERROGATING';
    this.elScanBeam.classList.add('hidden');

    if (!guest.manualMarks) {
      guest.manualMarks = { 1: 0, 2: 0, 3: 0 };
    }

    if (!guest.chatHistory || guest.chatHistory.length === 0) {
      guest.chatHistory = [
        {
          sender: 'velvet',
          speaker: 'VELVET (GATEKEEPER)',
          text: '"Halt right there! Step up to the gate and answer my questions before entering."'
        },
        {
          sender: 'guest',
          speaker: `${guest.costume.toUpperCase()} VISITOR`,
          text: guest.greeting,
          evidence: null
        }
      ];
      this.renderChatLog(true);
    } else {
      this.renderChatLog(false);
    }

    this.updateEvidenceCards();
    this.renderMiniRules(hourIndex);
    this.drawPortraits();
  }

  closeQuestionModal() {
    this.stopTypewriter();
    this.activeGuest = null;
    this.modal.classList.add('hidden');
  }

  isModalOpen() {
    return !this.modal.classList.contains('hidden');
  }

  isTyping() {
    return this.typewriterTimer !== null;
  }

  renderChatLog(animateLast = false) {
    const g = this.activeGuest;
    if (!g || !g.chatHistory) return;

    this.stopTypewriter();
    this.elChatLog.innerHTML = '';

    g.chatHistory.forEach((msg, idx) => {
      const isLast = idx === g.chatHistory.length - 1;
      const bubble = document.createElement('div');
      bubble.className = `chat-msg ${msg.sender === 'velvet' ? 'velvet-msg' : 'guest-msg'}`;

      const senderEl = document.createElement('span');
      senderEl.className = 'chat-sender';
      senderEl.textContent = msg.speaker;
      bubble.appendChild(senderEl);

      const textEl = document.createElement('div');
      textEl.className = 'chat-text';
      bubble.appendChild(textEl);

      if (msg.evidence) {
        const evCard = document.createElement('div');
        evCard.className = 'chat-evidence-card';
        evCard.textContent = msg.evidence;
        bubble.appendChild(evCard);
      }

      this.elChatLog.appendChild(bubble);

      if (isLast && animateLast && msg.sender === 'guest') {
        this.startTypewriter(msg.text, textEl);
      } else {
        textEl.textContent = msg.text;
      }
    });

    this.elChatLog.scrollTop = this.elChatLog.scrollHeight;
  }

  startTypewriter(text, targetEl) {
    this.stopTypewriter();
    this.typewriterFullText = text;
    this.typewriterIndex = 0;
    this.activeTypingEl = targetEl;
    if (this.activeTypingEl) {
      this.activeTypingEl.textContent = '';
    }

    this.elGuestCard.classList.add('talking');

    const stepChar = () => {
      if (this.typewriterIndex < this.typewriterFullText.length) {
        this.typewriterIndex += 2;
        if (this.activeTypingEl) {
          this.activeTypingEl.textContent = this.typewriterFullText.slice(0, this.typewriterIndex);
        }
        this.elChatLog.scrollTop = this.elChatLog.scrollHeight;
        if (this.typewriterIndex % 6 === 0) {
          window.SFX.talkBlip(1.04);
        }
        this.typewriterTimer = setTimeout(stepChar, 20);
      } else {
        this.finishTypewriter();
      }
    };
    stepChar();
  }

  finishTypewriter() {
    if (this.activeTypingEl) {
      this.activeTypingEl.textContent = this.typewriterFullText;
    }
    this.stopTypewriter();
    if (this.elChatLog) {
      this.elChatLog.scrollTop = this.elChatLog.scrollHeight;
    }
  }

  stopTypewriter() {
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.activeTypingEl = null;
    this.elGuestCard.classList.remove('talking');
  }

  advanceStep() {
    if (!this.activeGuest) return;

    if (this.isTyping()) {
      this.finishTypewriter();
      return;
    }

    if (!this.activeGuest.askedId) {
      this.askQuestion('id');
    } else if (!this.activeGuest.askedPass) {
      this.askQuestion('pass');
    } else if (!this.activeGuest.askedInspect) {
      this.askQuestion('inspect');
    } else {
      const nextMap = { 1: 'pass', 2: 'inspect', 3: 'id' };
      this.askQuestion(nextMap[this.currentStep] || 'id');
    }
  }

  triggerCardAnimation(el, className) {
    el.classList.remove('sus-shake', 'happy-hop');
    void el.offsetWidth;
    el.classList.add(className);
  }

  askQuestion(type) {
    const g = this.activeGuest;
    if (!g) return;

    if (!g.chatHistory) {
      g.chatHistory = [];
    }

    this.triggerCardAnimation(this.elVelvetCard, 'happy-hop');
    this.elScanBeam.classList.add('hidden');

    if (type === 'id') {
      this.currentStep = 1;
      g.lastStep = 1;
      g.askedId = true;

      this.elName.textContent = g.name.toUpperCase();
      this.elCostume.textContent = `OUTFIT: ${g.costume.toUpperCase()}`;
      this.elVelvetMood.textContent = 'CHECKING ID';

      g.step1Detail = `${g.name} (${g.costume}) • Ticket: ${g.ticketCode}`;

      g.chatHistory.push({
        sender: 'velvet',
        speaker: 'VELVET (YOU)',
        text: '"What is your full name, and can I see your invitation ticket?"'
      });
      g.chatHistory.push({
        sender: 'guest',
        speaker: `${g.name.toUpperCase()} (${g.costume.toUpperCase()})`,
        text: g.idResponse,
        evidence: `CLAIMED ID: ${g.name}  |  OUTFIT: ${g.costume}  |  TICKET: ${g.ticketCode}`
      });

      this.triggerCardAnimation(this.elGuestCard, 'happy-hop');
      this.renderChatLog(true);
    } else if (type === 'pass') {
      this.currentStep = 2;
      g.lastStep = 2;
      g.askedPass = true;

      this.elVelvetMood.textContent = 'CHECKING PASS';
      const claimedPass = g.passwordClaim || g.expectedPassword || '???';
      g.step2Detail = `Said: "${claimedPass}"`;

      const guestLabel = g.askedId ? `${g.name.toUpperCase()} (${g.costume.toUpperCase()})` : `${g.costume.toUpperCase()} VISITOR`;

      g.chatHistory.push({
        sender: 'velvet',
        speaker: 'VELVET (YOU)',
        text: '"Lean in close... What is tonight\'s secret manor password?"'
      });
      g.chatHistory.push({
        sender: 'guest',
        speaker: guestLabel,
        text: g.passwordLine,
        evidence: `WHISPERED PASSWORD: "${claimedPass}"`
      });

      this.triggerCardAnimation(this.elGuestCard, 'happy-hop');
      this.renderChatLog(true);
    } else if (type === 'inspect') {
      this.currentStep = 3;
      g.lastStep = 3;
      g.askedInspect = true;

      this.elVelvetMood.textContent = 'SCANNING ATTIRE';
      this.elScanBeam.classList.remove('hidden');

      g.step3Detail = `Shoes: ${g.shoes} • Item: ${g.item}`;
      const guestLabel = g.askedId ? `${g.name.toUpperCase()} (${g.costume.toUpperCase()})` : `${g.costume.toUpperCase()} VISITOR`;

      g.chatHistory.push({
        sender: 'velvet',
        speaker: 'VELVET (YOU)',
        text: '"Hold still a second! Let me inspect your footwear and outfit."'
      });
      g.chatHistory.push({
        sender: 'guest',
        speaker: guestLabel,
        text: g.inspectResponse,
        evidence: `INSPECTED FOOTWEAR: ${g.shoes}  |  HOLDING: ${g.item}`
      });

      this.triggerCardAnimation(this.elGuestCard, 'happy-hop');
      this.renderChatLog(true);
    }

    this.updateEvidenceCards();
  }

  updateEvidenceCards() {
    const g = this.activeGuest;
    if (!g) return;

    const marks = g.manualMarks || { 1: 0, 2: 0, 3: 0 };

    const syncQuestionBtn = (btnEl, statusEl, stepNum, asked) => {
      btnEl.classList.toggle('active', this.currentStep === stepNum);
      btnEl.classList.toggle('asked', !!asked);
      statusEl.textContent = asked ? 'ASKED ✓' : 'ASK ›';
    };

    syncQuestionBtn(this.stepDot1, this.qStatus1, 1, g.askedId);
    syncQuestionBtn(this.stepDot2, this.qStatus2, 2, g.askedPass);
    syncQuestionBtn(this.stepDot3, this.qStatus3, 3, g.askedInspect);

    const syncClaimRow = (rowEl, bodyEl, markEl, slot, asked, detailText, defaultText) => {
      rowEl.classList.remove('recorded', 'mark-ok', 'mark-sus');
      if (asked) {
        rowEl.classList.add('recorded');
        bodyEl.textContent = detailText;
      } else {
        bodyEl.textContent = defaultText;
      }

      const m = marks[slot] || 0;
      if (m === 1) {
        rowEl.classList.add('mark-ok');
        markEl.textContent = '[✓]';
      } else if (m === 2) {
        rowEl.classList.add('mark-sus');
        markEl.textContent = '[✕]';
      } else {
        markEl.textContent = '[?]';
      }
    };

    syncClaimRow(
      this.claimRow1,
      this.evBody1,
      this.evMark1,
      1,
      g.askedId,
      g.step1Detail || '',
      'Not asked yet — press [1]'
    );

    syncClaimRow(
      this.claimRow2,
      this.evBody2,
      this.evMark2,
      2,
      g.askedPass,
      g.step2Detail || '',
      'Not asked yet — press [2]'
    );

    syncClaimRow(
      this.claimRow3,
      this.evBody3,
      this.evMark3,
      3,
      g.askedInspect,
      g.step3Detail || '',
      'Not inspected yet — press [3]'
    );
  }

  renderMiniRules(hourIndex) {
    const lvlIdx = this.game.currentLevelIndex || 0;
    const meta = window.GameData.LEVEL_META[lvlIdx] || window.GameData.LEVEL_META[0];
    let html = `
      <div class="rule-item">
        <strong>1. SECRET PASSWORD:</strong> Must say <code>"${meta.password}"</code><br/>
        <strong>2. TICKET CODE:</strong> Starts with <code>VV-</code> + ends in <strong>EVEN</strong> digit (0,2,4,6,8)<br/>
        <strong>3. FOOTWEAR:</strong> <strong>NO</strong> Muddy / Bog-Slime / Marsh Boots
      </div>
      <div class="rule-item">
        <strong>4. OFFICIAL VIP ROSTER (NAME = OUTFIT):</strong>
    `;
    html += window.GameData.VIP_ROSTER.map(
      v => `<div class="gb-guest-row"><span class="gb-guest-name">${v.name}</span><span class="gb-guest-costume">${v.costume}</span></div>`
    ).join('');
    html += `</div>`;
    this.elRulesContent.innerHTML = html;
  }

  toggleGuestbook() {
    this.updateGuestbookContent(this.game.getHourIndex());
    this.drawer.classList.toggle('hidden');
  }

  updateGuestbookContent(hourIndex) {
    const lvlIdx = this.game.currentLevelIndex || 0;
    const rules = window.GameData.getRulesForHour(hourIndex, lvlIdx);
    let html = `<div class="gb-section"><h4>ACTIVE SECURITY ORDERS</h4>`;
    for (const r of rules) {
      html += `<div class="gb-rule-row"><strong>${r.title}:</strong><br/>${r.desc}</div>`;
    }
    html += `</div>`;

    html += `<div class="gb-section"><h4>VIP GUEST ROSTER (NAME = COSTUME)</h4>`;
    for (const vip of window.GameData.VIP_ROSTER) {
      html += `<div class="gb-guest-row"><span class="gb-guest-name">${vip.name}</span><span class="gb-guest-costume">${vip.costume}</span></div>`;
    }
    html += `</div>`;

    html += `<div class="gb-section"><h4>CONTROLS MANUAL</h4>
      <p style="margin-bottom:4px;">* <kbd>E</kbd> Interrogate guest at Front Door</p>
      <p style="margin-bottom:4px;">* <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> / <kbd>SPACE</kbd> Ask Questions in Chat</p>
      <p style="margin-bottom:4px;">* <kbd>SHIFT</kbd> Morph into Vampire Bat</p>
      <p>* <kbd>J</kbd> / <kbd>CLICK</kbd> Sonic Swoop &amp; Catch Crasher</p>
    </div>`;

    this.gbBody.innerHTML = html;
  }

  drawPortraits() {
    if (!this.activeGuest) return;
    const t = this.game.animTime;

    // 1. Draw Animated Velvet Portrait on Left (60x60)
    const vCtx = this.velvetCtx;
    vCtx.clearRect(0, 0, 60, 60);
    const dummyVelvet = {
      x: 30,
      y: 44,
      vx: 0,
      facing: 1,
      isBat: false,
      swoopTimer: 0
    };
    window.GameData.drawVelvetSprite(vCtx, dummyVelvet, t);

    // 2. Draw Animated Guest Portrait on Right (64x64) — Neutral, no auto-spoilers!
    const gCtx = this.portraitCtx;
    gCtx.clearRect(0, 0, 64, 64);

    const portraitGuest = Object.assign({}, this.activeGuest, {
      facing: -1,
      vx: this.isTyping() ? 25 : 0
    });
    window.GameData.drawGuestSprite(gCtx, 32, 42, portraitGuest, t, 1.05);
  }
}

window.UIController = UIController;
