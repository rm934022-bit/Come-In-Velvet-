// ============================================================================
// Come In, Velvet! — GameMaker RPG-Style Interrogation UI & Guestbook
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

    this.elVelvetBubble = document.getElementById('qm-velvet-bubble');
    this.elVelvetText = document.getElementById('qm-velvet-text');
    this.elEvidenceProp = document.getElementById('qm-evidence-prop');
    this.elGuestBubble = document.getElementById('qm-guest-bubble');
    this.elSpeaker = document.getElementById('qm-speaker-label');
    this.elSpeech = document.getElementById('qm-speech-text');
    this.elScanBeam = document.getElementById('qm-scan-beam');

    this.elCluesStrip = document.getElementById('qm-clues-strip');
    this.elHourLabel = document.getElementById('qm-hour-label');
    this.elRulesPopover = document.getElementById('qm-rules-popover');
    this.elRulesContent = document.getElementById('qm-rules-content');

    // Step dots & buttons
    this.stepDot1 = document.getElementById('step-dot-1');
    this.stepDot2 = document.getElementById('step-dot-2');
    this.stepDot3 = document.getElementById('step-dot-3');
    this.btnNextQuestion = document.getElementById('btn-next-question');
    this.btnPeekRules = document.getElementById('btn-peek-rules');

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

    // Interrogation Step State
    this.activeGuest = null;
    this.currentStep = 0; // 0 = greeting, 1 = id, 2 = pass, 3 = inspect
    this.typewriterFullText = '';
    this.typewriterIndex = 0;
    this.typewriterTimer = null;
    this.guestReaction = 'neutral'; // 'neutral' | 'good' | 'sus'

    this.bindEvents();
  }

  bindEvents() {
    this.btnNextQuestion.addEventListener('click', () => this.advanceStep());
    this.stepDot1.addEventListener('click', () => this.askQuestion('id'));
    this.stepDot2.addEventListener('click', () => this.askQuestion('pass'));
    this.stepDot3.addEventListener('click', () => this.askQuestion('inspect'));

    this.btnPeekRules.addEventListener('click', () => {
      this.elRulesPopover.classList.toggle('hidden');
      this.btnPeekRules.classList.toggle('open');
    });

    this.elGuestBubble.addEventListener('click', () => {
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

  openQuestionModal(guest, hourIndex, timeString) {
    this.activeGuest = guest;
    this.currentStep = guest.lastStep || 0;
    this.guestReaction = 'neutral';
    this.modal.classList.remove('hidden');
    this.elRulesPopover.classList.add('hidden');
    this.btnPeekRules.classList.remove('open');

    this.elName.textContent = guest.askedId ? guest.name.toUpperCase() : 'UNKNOWN';
    this.elCostume.textContent = guest.costume.toUpperCase();
    this.elHourLabel.textContent = timeString;
    this.elVelvetMood.textContent = 'GATEKEEPER';
    this.elScanBeam.classList.add('hidden');

    this.elVelvetBubble.classList.add('hidden');
    this.elEvidenceProp.classList.add('hidden');
    this.elSpeaker.textContent = `${guest.costume.toUpperCase()} VISITOR:`;
    this.startTypewriter('* ' + guest.greeting);

    this.updateStepDots();
    this.updateNextButtonLabel();
    this.renderClues();
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

  startTypewriter(text) {
    this.stopTypewriter();
    this.typewriterFullText = text;
    this.typewriterIndex = 0;
    this.elSpeech.textContent = '';

    this.elGuestCard.classList.add('talking');

    const stepChar = () => {
      if (this.typewriterIndex < this.typewriterFullText.length) {
        this.typewriterIndex += 2;
        this.elSpeech.textContent = this.typewriterFullText.slice(0, this.typewriterIndex);
        if (this.typewriterIndex % 6 === 0) {
          window.SFX.talkBlip(this.guestReaction === 'sus' ? 0.85 : 1.08);
        }
        this.typewriterTimer = setTimeout(stepChar, 22);
      } else {
        this.finishTypewriter();
      }
    };
    stepChar();
  }

  finishTypewriter() {
    this.stopTypewriter();
    this.elSpeech.textContent = this.typewriterFullText;
    this.elGuestCard.classList.remove('talking');
  }

  stopTypewriter() {
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }
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

    this.elVelvetBubble.classList.remove('hidden');
    this.triggerCardAnimation(this.elVelvetCard, 'happy-hop');

    this.elEvidenceProp.classList.remove('hidden', 'prop-ok', 'prop-sus');
    this.elScanBeam.classList.add('hidden');

    if (type === 'id') {
      this.currentStep = 1;
      g.lastStep = 1;
      g.askedId = true;

      this.elVelvetText.textContent = '"Hold it right there! Name and invitation ticket, please!"';
      this.elName.textContent = g.name.toUpperCase();
      this.elSpeaker.textContent = `${g.name.toUpperCase()} (${g.costume.toUpperCase()}):`;

      const lvlIdx = this.game.currentLevelIndex || 0;
      const numPart = parseInt(g.ticketCode.split('-')[1], 10);
      let ticketOk = true;
      if (lvlIdx === 0) {
        ticketOk = g.ticketCode.startsWith('VV-') && !isNaN(numPart) && numPart % 2 === 0;
      } else if (lvlIdx === 1) {
        ticketOk = g.ticketCode.startsWith('AL-') && !isNaN(numPart) && numPart % 2 !== 0;
      } else {
        ticketOk = g.ticketCode.startsWith('CW-') && !isNaN(numPart) && numPart % 3 === 0;
      }

      const vipMatch = window.GameData.VIP_ROSTER.find(v => v.name === g.name);
      const hourIdx = this.game.getHourIndex();
      const effectiveTier = Math.max(hourIdx, lvlIdx);
      const costumeOk = effectiveTier < 2 || (vipMatch && vipMatch.costume === g.costume);
      const stepOk = ticketOk && costumeOk;

      g.step1Ok = stepOk;
      this.guestReaction = stepOk ? 'good' : 'sus';
      this.elVelvetMood.textContent = stepOk ? 'ID VERIFIED' : 'SUSPICIOUS ID!';

      this.elEvidenceProp.classList.add(stepOk ? 'prop-ok' : 'prop-sus');
      if (!ticketOk) {
        this.elEvidenceProp.textContent = `[TICKET: ${g.ticketCode}] -- COUNTERFEIT CODE!`;
      } else if (!costumeOk) {
        this.elEvidenceProp.textContent = `[ROSTER MISMATCH] ${g.name} = ${vipMatch.costume.toUpperCase()}!`;
      } else {
        this.elEvidenceProp.textContent = `[TICKET: ${g.ticketCode}] GUEST: ${g.name.toUpperCase()} (OK)`;
      }

      this.addClue(
        'id',
        stepOk
          ? `ID: ${g.ticketCode} OK`
          : !ticketOk
          ? `FAKE TICKET: ${g.ticketCode}`
          : `IMPOSTOR COSTUME`,
        stepOk
      );

      this.triggerCardAnimation(this.elGuestCard, stepOk ? 'happy-hop' : 'sus-shake');
      this.startTypewriter('* ' + g.idResponse);
    } else if (type === 'pass') {
      this.currentStep = 2;
      g.lastStep = 2;
      g.askedPass = true;

      this.elVelvetText.textContent = '"Lean in close... What is tonight\'s secret password?"';
      this.elSpeaker.textContent = `${(g.askedId ? g.name : g.costume).toUpperCase()} WHISPERS:`;

      const stepOk = g.knowsPassword;
      const passStr = g.expectedPassword || 'BLOOD MOON';
      g.step2Ok = stepOk;
      this.guestReaction = stepOk ? 'good' : 'sus';
      this.elVelvetMood.textContent = stepOk ? 'PASS MATCHED' : 'WRONG PASS!';

      this.elEvidenceProp.classList.add(stepOk ? 'prop-ok' : 'prop-sus');
      this.elEvidenceProp.textContent = stepOk
        ? `[PASSWORD: "${passStr}"] -- VERIFIED`
        : '[PASSWORD FAILED] -- DOES NOT KNOW CODE!';

      this.addClue(
        'pass',
        stepOk ? `PASS: ${passStr}` : 'WRONG PASSWORD!',
        stepOk
      );

      this.triggerCardAnimation(this.elGuestCard, stepOk ? 'happy-hop' : 'sus-shake');
      this.startTypewriter('* ' + g.passwordLine);
    } else if (type === 'inspect') {
      this.currentStep = 3;
      g.lastStep = 3;
      g.askedInspect = true;

      this.elVelvetText.textContent = '"Hold still! Let me check your boots and outfit..."';
      this.elSpeaker.textContent = `${(g.askedId ? g.name : g.costume).toUpperCase()}:`;
      this.elScanBeam.classList.remove('hidden');

      const stepOk = !g.hasMuddyBoots;
      g.step3Ok = stepOk;
      this.guestReaction = stepOk ? 'good' : 'sus';
      this.elVelvetMood.textContent = stepOk ? 'BOOTS CLEAN' : 'MUDDY BOOTS!';

      this.elEvidenceProp.classList.add(stepOk ? 'prop-ok' : 'prop-sus');
      this.elEvidenceProp.textContent = stepOk
        ? `[FOOTWEAR: ${g.shoes.toUpperCase()}] -- CLEAN`
        : '[VIOLATION: MUDDY SWAMP BOOTS DETECTED!]';

      this.addClue(
        'inspect',
        stepOk ? 'BOOTS: CLEAN' : 'MUDDY BOOTS!',
        stepOk
      );

      this.triggerCardAnimation(this.elGuestCard, stepOk ? 'happy-hop' : 'sus-shake');
      this.startTypewriter('* ' + g.inspectResponse);
    }

    this.updateStepDots();
    this.updateNextButtonLabel();
    this.renderClues();
  }

  updateStepDots() {
    const g = this.activeGuest;
    if (!g) return;

    const applyDot = (dot, stepNum, asked, ok) => {
      dot.className = 'step-dot';
      if (this.currentStep === stepNum) {
        dot.classList.add('active');
      } else if (asked) {
        dot.classList.add(ok ? 'done-ok' : 'done-sus');
      }
    };

    applyDot(this.stepDot1, 1, g.askedId, g.step1Ok);
    applyDot(this.stepDot2, 2, g.askedPass, g.step2Ok);
    applyDot(this.stepDot3, 3, g.askedInspect, g.step3Ok);
  }

  updateNextButtonLabel() {
    const g = this.activeGuest;
    if (!g) return;

    this.btnNextQuestion.classList.remove('complete');
    if (!g.askedId) {
      this.btnNextQuestion.textContent = '► STEP 1/3: ASK NAME & TICKET [SPACE]';
    } else if (!g.askedPass) {
      this.btnNextQuestion.textContent = '► STEP 2/3: ASK PASSWORD [SPACE]';
    } else if (!g.askedInspect) {
      this.btnNextQuestion.textContent = '► STEP 3/3: CHECK BOOTS [SPACE]';
    } else {
      this.btnNextQuestion.classList.add('complete');
      this.btnNextQuestion.textContent = '* ALL CHECKED -- MAKE VERDICT [F / X]';
    }
  }

  addClue(key, text, isGood) {
    if (!this.activeGuest) return;
    const existingIdx = this.activeGuest.cluesFound.findIndex(c => c.key === key);
    if (existingIdx !== -1) {
      this.activeGuest.cluesFound[existingIdx] = { key, text, isGood };
    } else {
      this.activeGuest.cluesFound.push({ key, text, isGood });
    }
  }

  renderClues() {
    this.elCluesStrip.innerHTML = '';
    if (!this.activeGuest || this.activeGuest.cluesFound.length === 0) {
      const span = document.createElement('span');
      span.className = 'clue-placeholder';
      span.textContent = 'PRESS [SPACE] OR [1][2][3] TO INTERROGATE';
      this.elCluesStrip.appendChild(span);
      return;
    }

    for (const c of this.activeGuest.cluesFound) {
      const pill = document.createElement('span');
      pill.className = `clue-pill ${c.isGood ? 'good' : 'sus'}`;
      pill.textContent = `${c.isGood ? '[OK]' : '[!]'} ${c.text}`;
      this.elCluesStrip.appendChild(pill);
    }
  }

  renderMiniRules(hourIndex) {
    const lvlIdx = this.game.currentLevelIndex || 0;
    const rules = window.GameData.getRulesForHour(hourIndex, lvlIdx);
    let html = '';
    for (const r of rules) {
      html += `<div class="rule-item"><strong>${r.title}</strong><br/>${r.desc}</div>`;
    }

    if (Math.max(hourIndex, lvlIdx) >= 2) {
      html += `<div class="rule-item"><strong>VIP ROSTER COSTUMES:</strong><br/>`;
      html += window.GameData.VIP_ROSTER.map(
        v => `<div class="gb-guest-row"><span class="gb-guest-name">${v.name}</span><span class="gb-guest-costume">${v.costume}</span></div>`
      ).join('');
      html += `</div>`;
    }
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
      <p style="margin-bottom:4px;">* <kbd>SPACE</kbd> Ask next question in dialogue</p>
      <p style="margin-bottom:4px;">* <kbd>SHIFT</kbd> Morph into Vampire Bat</p>
      <p>* <kbd>J</kbd> / <kbd>CLICK</kbd> Sonic Swoop &amp; Catch Crasher</p>
    </div>`;

    this.gbBody.innerHTML = html;
  }

  drawPortraits() {
    if (!this.activeGuest) return;
    const t = this.game.animTime;

    // 1. Draw Animated Velvet Portrait on Left
    const vCtx = this.velvetCtx;
    vCtx.clearRect(0, 0, 96, 96);
    const dummyVelvet = {
      x: 48,
      y: 66,
      vx: 0,
      facing: 1,
      isBat: false,
      swoopTimer: 0
    };
    window.GameData.drawVelvetSprite(vCtx, dummyVelvet, t);

    if (this.currentStep === 3) {
      vCtx.save();
      vCtx.translate(72, 42 + Math.sin(t * 8) * 4);
      vCtx.strokeStyle = '#ffcb47';
      vCtx.lineWidth = 2.5;
      vCtx.beginPath();
      vCtx.arc(0, 0, 9, 0, Math.PI * 2);
      vCtx.moveTo(6, 6);
      vCtx.lineTo(13, 13);
      vCtx.stroke();
      vCtx.restore();
    }

    // 2. Draw Animated Guest Portrait on Right
    const gCtx = this.portraitCtx;
    gCtx.clearRect(0, 0, 106, 106);

    const portraitGuest = Object.assign({}, this.activeGuest, {
      facing: -1,
      vx: this.isTyping() ? 25 : 0
    });
    window.GameData.drawGuestSprite(gCtx, 53, 66, portraitGuest, t, 1.55);

    if (this.currentStep === 1) {
      const ty = 44 + Math.sin(t * 7) * 3;
      gCtx.fillStyle = this.activeGuest.step1Ok ? '#3cd688' : '#e83b55';
      gCtx.strokeStyle = '#000';
      gCtx.lineWidth = 2;
      gCtx.fillRect(10, ty, 30, 16);
      gCtx.strokeRect(10, ty, 30, 16);
    }

    if (this.guestReaction === 'sus') {
      const dropY = (t * 28) % 18;
      gCtx.fillStyle = '#5ce1ff';
      gCtx.fillRect(22, 22 + dropY, 4, 6);
      gCtx.fillRect(80, 26 + ((dropY + 9) % 18), 4, 6);
    } else if (this.guestReaction === 'good') {
      const pulse = 0.6 + 0.4 * Math.sin(t * 10);
      gCtx.fillStyle = `rgba(60, 214, 136, ${pulse})`;
      gCtx.fillRect(18, 22, 5, 5);
      gCtx.fillRect(84, 20, 5, 5);
    }
  }
}

window.UIController = UIController;
