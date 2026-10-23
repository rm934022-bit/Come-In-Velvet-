// ============================================================================
// Come In, Velvet! — Game Data, Guest Generator, Rules & Character Renderer
// ============================================================================

const VIP_ROSTER = [
  { name: 'Barnaby Gourds', costume: 'Pumpkin Kin', favTreat: 'Caramel Apple' },
  { name: 'Lady Boo-trice', costume: 'Sheet Ghostie', favTreat: 'Ghost Mints' },
  { name: 'Lord Ribcage', costume: 'Dapper Skelly', favTreat: 'Calcium Punch' },
  { name: 'Barker Moon', costume: 'Werepup', favTreat: 'Bone Biscuit' },
  { name: 'Patchwork Purr', costume: 'Franken-Kitty', favTreat: 'Sparkberry Pie' },
  { name: 'Luna Flutter', costume: 'Goth Moth', favTreat: 'Lamp Nectar' },
  { name: 'Pipkin Patch', costume: 'Pumpkin Kin', favTreat: 'Spiced Cider' },
  { name: 'Casperina', costume: 'Sheet Ghostie', favTreat: 'Cloud Taffy' }
];

const COSTUME_TYPES = [
  'Pumpkin Kin',
  'Sheet Ghostie',
  'Dapper Skelly',
  'Werepup',
  'Franken-Kitty',
  'Goth Moth'
];

const ITEMS_CLEAN = [
  'Silk Bowtie',
  'Silver Candelabra',
  'Velvet Gift Box',
  'Pumpkin Lantern',
  'Crystal Goblet',
  'Rose Bouquet'
];

const LEVEL_META = [
  {
    id: 0,
    shortName: 'LVL 1: GRAND BALLROOM',
    title: 'STAGE 1 -- THE GRAND BALLROOM',
    subtitle: 'Swinging Chandeliers & Bounce Ottomans',
    password: 'BLOOD MOON',
    desc: 'Classic 3-floor manor reception with bouncy chandeliers and balcony window sneaks.'
  },
  {
    id: 1,
    shortName: 'LVL 2: ALCHEMY WING',
    title: 'STAGE 2 -- HAUNTED ALCHEMY CONSERVATORY',
    subtitle: 'Moving Platforms, Warp Mirrors & Steam Vents',
    password: 'WITCHING HOUR',
    desc: 'Gothic greenhouse & lab featuring gliding platforms, teleportation mirrors, and cauldron vents!'
  },
  {
    id: 2,
    shortName: 'LVL 3: CLOCKWORK BELFRY',
    title: 'STAGE 3 -- CLOCKWORK BELFRY ROOFTOPS',
    subtitle: 'Updraft Wind Streams, Rotating Cogs & Twin Portals',
    password: 'NIGHTSHADE',
    desc: 'High-altitude clocktower featuring vertical wind updrafts, moving brass cogs, and rooftop crashers!'
  }
];

const WRONG_PASSWORDS = [
  '"Uhh... Open Sesame?"',
  '"Full Moon Fever?"',
  '"Spooky Scary Skeletons?"',
  '"Trick or Treat... I think?"',
  '"Hocus Pocus... maybe?"'
];

function getRightPasswords(pass) {
  return [
    `"The secret password is ${pass}, of course!"`,
    `"Whispering: ${pass}! Happy Halloween, Velvet!"`,
    `"${pass}! Wouldn't miss your party for the world!"`
  ];
}

function getRulesForHour(hourIndex, levelIndex = 0) {
  const lvl = LEVEL_META[levelIndex] || LEVEL_META[0];
  const effectiveTier = Math.max(hourIndex, levelIndex);

  const rules = [
    {
      title: 'Rule #1: Secret Password',
      desc: `All guests must know this stage's password: "${lvl.password}".`
    },
    {
      title: 'Rule #2: Footwear Check',
      desc: 'NO Muddy Swamp Boots allowed inside!'
    }
  ];

  if (effectiveTier >= 1) {
    rules.push({
      title: 'Rule #3: Official Ticket Code',
      desc: 'Valid tickets start with "VV-" and end in an EVEN number (e.g., VV-204).'
    });
  }

  if (effectiveTier >= 2) {
    rules.push({
      title: 'Rule #4: VIP Costume Match',
      desc: 'Impostors are stealing names! Guest\'s Costume must match the VIP Roster!'
    });
  }

  return rules;
}

function generateDoorGuest(hourIndex, levelIndex = 0) {
  const lvl = LEVEL_META[levelIndex] || LEVEL_META[0];
  const effectiveTier = Math.max(hourIndex, levelIndex);

  const isInvited = Math.random() < 0.46;
  const vip = VIP_ROSTER[Math.floor(Math.random() * VIP_ROSTER.length)];

  let name = vip.name;
  let costume = vip.costume;
  let item = ITEMS_CLEAN[Math.floor(Math.random() * ITEMS_CLEAN.length)];
  let shoes = 'Polished Dress Shoes';
  let hasMuddyBoots = false;

  const evenDigits = [0, 2, 4, 6, 8];
  const oddDigits = [1, 3, 5, 7, 9];
  const midDigits = Math.floor(10 + Math.random() * 89);
  let ticketCode = `VV-${midDigits}${evenDigits[Math.floor(Math.random() * evenDigits.length)]}`;

  let knowsPassword = true;
  const rightList = getRightPasswords(lvl.password);
  let passwordLine = rightList[Math.floor(Math.random() * rightList.length)];
  let violationReason = null;

  if (!isInvited) {
    const possibleFlaws = ['wrong_password', 'muddy_boots'];
    if (effectiveTier >= 1) possibleFlaws.push('fake_ticket', 'fake_ticket');
    if (effectiveTier >= 2) possibleFlaws.push('wrong_costume', 'wrong_costume');

    const flaw = possibleFlaws[Math.floor(Math.random() * possibleFlaws.length)];

    if (flaw === 'wrong_password') {
      knowsPassword = false;
      passwordLine = WRONG_PASSWORDS[Math.floor(Math.random() * WRONG_PASSWORDS.length)];
      violationReason = `Did not know the secret password ("${lvl.password}")!`;
    } else if (flaw === 'muddy_boots') {
      hasMuddyBoots = true;
      shoes = 'Muddy Swamp Boots (Dripping Bog Slime!)';
      violationReason = 'Wearing Muddy Swamp Boots!';
    } else if (flaw === 'fake_ticket') {
      if (Math.random() < 0.5) {
        ticketCode = `XX-${midDigits}${evenDigits[0]}`;
        violationReason = `Counterfeit ticket prefix (${ticketCode} instead of VV-)!`;
      } else {
        const odd = oddDigits[Math.floor(Math.random() * oddDigits.length)];
        ticketCode = `VV-${midDigits}${odd}`;
        violationReason = `Invalid ticket number (${ticketCode} ends in an ODD digit)!`;
      }
    } else if (flaw === 'wrong_costume') {
      const otherCostumes = COSTUME_TYPES.filter(c => c !== vip.costume);
      costume = otherCostumes[Math.floor(Math.random() * otherCostumes.length)];
      violationReason = `Impostor! ${vip.name} is supposed to be a ${vip.costume}, not a ${costume}!`;
    }
  }

  const greetings = [
    `"Good evening, Velvet! Is the party jumping yet?"`,
    `"Ooooh, the manor looks delightfully spooky tonight!"`,
    `"Brrr! It's chilly outside. Can I come in?"`,
    `"Hey Velvet! I brought my best spooky vibes!"`
  ];

  const idResponses = isInvited || violationReason !== `Impostor! ${vip.name} is supposed to be a ${vip.costume}, not a ${costume}!`
    ? `"I'm ${name}! Here is my invitation ticket: ${ticketCode}."`
    : `"Er... I am totally ${name}! Pay no attention to my ${costume} outfit! Ticket: ${ticketCode}."`;

  const inspectResponses = hasMuddyBoots
    ? `"Ack! Don't look at my feet! I took a shortcut through the Haunted Bog..."`
    : `"Just wearing my finest ${costume} attire, holding a ${item}, and ${shoes}!"`;

  return {
    id: 'guest_' + Math.random().toString(36).slice(2, 9),
    name,
    costume,
    item,
    shoes,
    hasMuddyBoots,
    ticketCode,
    knowsPassword,
    expectedPassword: lvl.password,
    passwordLine,
    isInvited,
    violationReason,
    greeting: greetings[Math.floor(Math.random() * greetings.length)],
    idResponse: idResponses,
    inspectResponse: inspectResponses,
    cluesFound: [],
    askedId: false,
    askedPass: false,
    askedInspect: false
  };
}

// ============================================================================
// Procedural Spooky-Cute 2D Character & Portrait Renderer
// ============================================================================

function drawGuestSprite(ctx, x, y, guest, animTime = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (guest.facing || 1), scale);

  const bob = Math.sin(animTime * 6 + (guest.bobOffset || 0)) * 2.5;
  const isFleeing = guest.state === 'fleeing' || guest.state === 'chaos' || guest.state === 'sneaking';

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet / Shoes
  const legSwing = (guest.vx && Math.abs(guest.vx) > 5) ? Math.sin(animTime * 16) * 6 : 0;
  ctx.fillStyle = guest.hasMuddyBoots ? '#5c4318' : '#1d112b';
  ctx.beginPath();
  ctx.roundRect(-11 + legSwing, 13, 8, 9, 3);
  ctx.roundRect(3 - legSwing, 13, 8, 9, 3);
  ctx.fill();

  // Muddy puddle drops if muddy boots
  if (guest.hasMuddyBoots) {
    ctx.fillStyle = '#73531d';
    ctx.beginPath();
    ctx.arc(-8 + legSwing, 20, 3.5, 0, Math.PI * 2);
    ctx.arc(7 - legSwing, 20, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body cloak / suit depending on costume
  const costumeColors = {
    'Pumpkin Kin': { body: '#3b1e54', trim: '#ff8c2b', head: '#ff7b1c' },
    'Sheet Ghostie': { body: '#e9e4ff', trim: '#a594f9', head: '#f5f2ff' },
    'Dapper Skelly': { body: '#1f192e', trim: '#e0d8f0', head: '#f2edf9' },
    'Werepup': { body: '#6e3b3b', trim: '#d98a4e', head: '#8c584c' },
    'Franken-Kitty': { body: '#2c4a3e', trim: '#5ef2b4', head: '#6ddba8' },
    'Goth Moth': { body: '#331c4a', trim: '#ff66b5', head: '#50346b' }
  };
  const pal = costumeColors[guest.costume] || costumeColors['Pumpkin Kin'];

  // Body
  ctx.fillStyle = isFleeing ? '#8c1d40' : pal.body;
  ctx.beginPath();
  ctx.moveTo(-14, 15 + bob * 0.4);
  ctx.quadraticCurveTo(0, -8 + bob, 14, 15 + bob * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.trim;
  ctx.stroke();

  // Head
  ctx.save();
  ctx.translate(0, -10 + bob);

  if (guest.costume === 'Pumpkin Kin') {
    // Pumpkin ridges
    ctx.fillStyle = '#ff7b1c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c44900';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Stem
    ctx.fillStyle = '#38a856';
    ctx.beginPath();
    ctx.roundRect(-3, -17, 6, 6, 2);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = isFleeing ? '#ff1e42' : '#ffe866';
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(-4, -7);
    ctx.lineTo(-2, -1);
    ctx.closePath();
    ctx.moveTo(8, -3);
    ctx.lineTo(4, -7);
    ctx.lineTo(2, -1);
    ctx.closePath();
    ctx.fill();
  } else if (guest.costume === 'Sheet Ghostie') {
    ctx.fillStyle = '#f5f2ff';
    ctx.beginPath();
    ctx.arc(0, -2, 14, Math.PI, 0);
    ctx.lineTo(14, 14);
    ctx.quadraticCurveTo(7, 10, 0, 14);
    ctx.quadraticCurveTo(-7, 10, -14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b49ffc';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Cute ghost eyes & blush
    ctx.fillStyle = isFleeing ? '#ff1e42' : '#231138';
    ctx.beginPath();
    ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 110, 165, 0.55)';
    ctx.beginPath();
    ctx.arc(-8, 2, 2.5, 0, Math.PI * 2);
    ctx.arc(8, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (guest.costume === 'Dapper Skelly') {
    ctx.fillStyle = '#f5f0ff';
    ctx.beginPath();
    ctx.arc(0, -2, 13, 0, Math.PI * 2);
    ctx.roundRect(-7, 4, 14, 8, 3);
    ctx.fill();

    // Eye sockets
    ctx.fillStyle = isFleeing ? '#ff1e42' : '#2a1642';
    ctx.beginPath();
    ctx.arc(-5, -2, 3.3, 0, Math.PI * 2);
    ctx.arc(5, -2, 3.3, 0, Math.PI * 2);
    ctx.fill();

    // Top hat
    ctx.fillStyle = '#1d1033';
    ctx.fillRect(-13, -14, 26, 3);
    ctx.fillRect(-9, -25, 18, 11);
    ctx.fillStyle = '#ff4d94';
    ctx.fillRect(-9, -16, 18, 2.5);
  } else if (guest.costume === 'Werepup') {
    // Wolf ears
    ctx.fillStyle = '#8c584c';
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-15, -19);
    ctx.lineTo(-4, -12);
    ctx.moveTo(12, -6);
    ctx.lineTo(15, -19);
    ctx.lineTo(4, -12);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & nose
    ctx.fillStyle = isFleeing ? '#ff1e42' : '#ffd15c';
    ctx.beginPath();
    ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#241118';
    ctx.beginPath();
    ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (guest.costume === 'Franken-Kitty') {
    // Neck bolts
    ctx.fillStyle = '#9aa8b8';
    ctx.fillRect(-17, 1, 34, 4);

    // Cat ears
    ctx.fillStyle = '#6ddba8';
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-13, -18);
    ctx.lineTo(-3, -12);
    ctx.moveTo(12, -6);
    ctx.lineTo(13, -18);
    ctx.lineTo(3, -12);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Stitch mark
    ctx.strokeStyle = '#1f4d39';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(2, -4);
    ctx.stroke();

    ctx.fillStyle = isFleeing ? '#ff1e42' : '#1b2e26';
    ctx.beginPath();
    ctx.arc(-5, -1, 2.4, 0, Math.PI * 2);
    ctx.arc(5, -1, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Goth Moth
    ctx.strokeStyle = '#ff80bf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -11);
    ctx.quadraticCurveTo(-12, -22, -16, -18);
    ctx.moveTo(4, -11);
    ctx.quadraticCurveTo(12, -22, 16, -18);
    ctx.stroke();

    ctx.fillStyle = '#50346b';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isFleeing ? '#ff1e42' : '#ff99d6';
    ctx.beginPath();
    ctx.ellipse(-5, -1, 3.2, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -1, 3.2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // If this guest is exposed as a Gatecrasher, draw mischievous red imp horns!
  if (isFleeing) {
    ctx.fillStyle = '#ff2a55';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-18, -24, -6, -22);
    ctx.closePath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(18, -24, 6, -22);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

function drawVelvetSprite(ctx, velvet, animTime) {
  ctx.save();
  ctx.translate(velvet.x, velvet.y);

  // Shadow on floor below Velvet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 22, velvet.isBat ? 12 : 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(velvet.facing, 1);

  if (velvet.isBat) {
    // ========================================================================
    // VELVET IN VAMPIRE BAT FORM 🦇
    // ========================================================================
    const wingFlap = Math.sin(animTime * 28) * 14;

    // Sonic aura if swoop dashing
    if (velvet.swoopTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 242, 175, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(animTime * 40) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Purple glow
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
    grad.addColorStop(0, 'rgba(186, 104, 255, 0.5)');
    grad.addColorStop(1, 'rgba(186, 104, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Left & Right Bat Wings
    ctx.fillStyle = '#4a1c7d';
    ctx.strokeStyle = '#c47aff';
    ctx.lineWidth = 1.8;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-18, -14 - wingFlap, -28, -4 - wingFlap * 0.7);
    ctx.quadraticCurveTo(-20, 6, -14, 8);
    ctx.quadraticCurveTo(-10, 4, -6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(18, -14 - wingFlap, 28, -4 - wingFlap * 0.7);
    ctx.quadraticCurveTo(20, 6, 14, 8);
    ctx.quadraticCurveTo(10, 4, 6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fluffy Bat Body
    ctx.fillStyle = '#291147';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cute Bat Ears
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-11, -17);
    ctx.lineTo(-2, -9);
    ctx.moveTo(8, -6);
    ctx.lineTo(11, -17);
    ctx.lineTo(2, -9);
    ctx.fill();

    // Glowing Eyes & Tiny Fangs
    ctx.fillStyle = '#ff5ca8';
    ctx.beginPath();
    ctx.arc(-3.5, -1, 2.3, 0, Math.PI * 2);
    ctx.arc(3.5, -1, 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.lineTo(-1.5, 6);
    ctx.lineTo(0, 3);
    ctx.moveTo(0, 3);
    ctx.lineTo(1.5, 6);
    ctx.lineTo(3, 3);
    ctx.fill();

    ctx.restore();
    return;
  }

  // ==========================================================================
  // VELVET IN GATEKEEPER WITCH-VAMPIRE FORM 🎃
  // ==========================================================================
  const isMoving = Math.abs(velvet.vx) > 12;
  const runCycle = isMoving ? Math.sin(animTime * 18) : 0;
  const bob = isMoving ? Math.abs(Math.cos(animTime * 18)) * 2.5 : Math.sin(animTime * 4) * 1.5;

  // Flowing Velvet Cape behind her
  const capeWave = Math.sin(animTime * 10) * 3 - Math.min(12, Math.abs(velvet.vx) * 0.04);
  ctx.fillStyle = '#6e1b59';
  ctx.beginPath();
  ctx.moveTo(-6, -6 - bob);
  ctx.quadraticCurveTo(-22 + capeWave, 6, -18 + capeWave, 19);
  ctx.lineTo(8, 17);
  ctx.closePath();
  ctx.fill();

  // Boots
  ctx.fillStyle = '#1b0c2e';
  ctx.beginPath();
  ctx.roundRect(-8 + runCycle * 6, 13, 7, 9, 2);
  ctx.roundRect(2 - runCycle * 6, 13, 7, 9, 2);
  ctx.fill();

  // Velvet Dress / Coat
  ctx.fillStyle = '#3b1561';
  ctx.strokeStyle = '#ff66b5';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-12, 15 - bob * 0.5);
  ctx.lineTo(-7, -6 - bob);
  ctx.lineTo(7, -6 - bob);
  ctx.lineTo(12, 15 - bob * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cute Vampire Collar / Bow
  ctx.fillStyle = '#ff4d94';
  ctx.beginPath();
  ctx.arc(0, -3 - bob, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.save();
  ctx.translate(0, -13 - bob);

  // Hair (lavender-silver bob)
  ctx.fillStyle = '#e0c7ff';
  ctx.beginPath();
  ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
  ctx.fill();

  // Face
  ctx.fillStyle = '#fae8ff';
  ctx.beginPath();
  ctx.arc(1, 1, 10.5, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Eyes
  ctx.fillStyle = '#7e1fff';
  ctx.beginPath();
  ctx.ellipse(-2.5, 1, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(5, 1, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye sparkles
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-1.8, 0, 0.9, 0, Math.PI * 2);
  ctx.arc(5.7, 0, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks & tiny cute fang smile
  ctx.fillStyle = 'rgba(255, 92, 168, 0.45)';
  ctx.beginPath();
  ctx.arc(-5, 4, 2.2, 0, Math.PI * 2);
  ctx.arc(7.5, 4, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Spooky-cute Gatekeeper Witch Hat
  ctx.fillStyle = '#240d40';
  ctx.strokeStyle = '#9e47ff';
  ctx.lineWidth = 1.6;
  // Brim
  ctx.beginPath();
  ctx.ellipse(0, -9, 17, 4.5, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cone
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.quadraticCurveTo(-2, -28, -9, -29);
  ctx.quadraticCurveTo(5, -24, 10, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hat Ribbon & Gold Buckle
  ctx.fillStyle = '#ff8c3b';
  ctx.fillRect(-9, -13, 18, 3.5);
  ctx.fillStyle = '#ffd15c';
  ctx.fillRect(-2.5, -14, 5, 5);

  ctx.restore();

  // Swoop / Catch Net Sparkle Aura when attacking
  if (velvet.swoopTimer > 0) {
    ctx.strokeStyle = '#38f2af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(6, 0, 26, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  }

  ctx.restore();
}

window.GameData = {
  VIP_ROSTER,
  COSTUME_TYPES,
  LEVEL_META,
  getRulesForHour,
  generateDoorGuest,
  drawGuestSprite,
  drawVelvetSprite
};
