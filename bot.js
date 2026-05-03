const mineflayer = require('mineflayer');
const config = require('./config.json');

let bot;
let currentState = 'idle';
let lastChatTime = Date.now();

const RUN_TIME = 6 * 60 * 1000;

// ------------------ helpers ------------------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ------------------ chat ------------------
const chatPools = {
  self: [
    "hmm",
    "ok",
    "wait",
    "brb",
    "one sec",
    "uhh",
    "alr",
    "..."
  ],

  social: [
    "hey",
    "hello",
    "hi",
    "yo",
    "hey there"
  ],

  thoughts: [
    "just chilling",
    "not sure what to do",
    "idk what I'm doing",
    "this place is quiet"
  ]
};

function otherPlayersOnline() {
  return Object.keys(bot.players).some(name => name !== bot.username);
}

function randomChat() {
  const hasPlayers = otherPlayersOnline();

  let pool;

  if (!hasPlayers) {
    pool = Math.random() < 0.7 ? chatPools.self : chatPools.thoughts;
  } else {
    pool = Math.random() < 0.6 ? chatPools.social : chatPools.self;
  }

  const msg = pool[Math.floor(Math.random() * pool.length)];
  bot.chat(msg);
}

function maybeChat() {
  const hasPlayers = otherPlayersOnline();

  const min = hasPlayers ? 90000 : 180000;
  const max = hasPlayers ? 240000 : 420000;

  const now = Date.now();

  if (now - lastChatTime > rand(min, max)) {
    if (Math.random() < (hasPlayers ? 0.7 : 0.4)) {
      randomChat();
      lastChatTime = now;
    }
  }
}

// ------------------ look ------------------
function randomLook() {
  if (!bot?.entity) return;

  const yaw = bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
  const pitch = (Math.random() - 0.5) * (Math.PI / 3);

  bot.look(yaw, pitch, true);
}

// ------------------ state ------------------
function chooseState() {
  const roll = Math.random();
  if (roll < 0.5) return 'active';
  if (roll < 0.8) return 'semi';
  return 'idle';
}

// ------------------ main behavior ------------------
function performAction() {
  if (!bot?.entity) return;

  const delay = rand(800, 2500);

  if (Math.random() < 0.2) currentState = chooseState();

  if (Math.random() < 0.4) randomLook();

  maybeChat();

  // subtle human-like actions
  if (Math.random() < 0.08) {
    bot.setControlState('sneak', true);
    setTimeout(() => bot.setControlState('sneak', false), rand(1000, 4000));
  }

  if (Math.random() < 0.05) {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 300);
  }

  // ---- states ----
  if (currentState === 'idle') {
    bot.clearControlStates();
    return setTimeout(performAction, rand(3000, 8000));
  }

  if (currentState === 'semi') {
    if (Math.random() < 0.5) {
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), rand(200, 800));
    } else {
      bot.clearControlStates();
    }

    return setTimeout(performAction, delay);
  }

  const roll = Math.random();

  if (roll < 0.4) {
    bot.setControlState('forward', true);
    setTimeout(() => bot.setControlState('forward', false), rand(500, 2000));
  } else if (roll < 0.6) {
    bot.setControlState('back', true);
    setTimeout(() => bot.setControlState('back', false), rand(300, 1500));
  } else if (roll < 0.8) {
    bot.setControlState('left', true);
    setTimeout(() => bot.setControlState('left', false), rand(400, 1200));
  } else {
    bot.setControlState('right', true);
    setTimeout(() => bot.setControlState('right', false), rand(400, 1200));
  }

  setTimeout(performAction, delay);
}

// ------------------ bot ------------------
function startBot() {
  bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,
    auth: 'offline',
    version: false,
    viewDistance: config.botChunk
  });

  bot.on('spawn', () => {
    console.log("✅ Bot spawned");

    currentState = chooseState();
    lastChatTime = Date.now();

    setTimeout(() => performAction(), 2000);

    setTimeout(() => {
      console.log("🔁 Cycle restart...");
      shutdown();
    }, RUN_TIME);
  });

  // join message (delayed + realistic)
  bot.on('playerJoined', async (player) => {
    if (!player || player.username === bot.username) return;

    await sleep(rand(3000, 6000));

    if (Math.random() < 0.85) {
      bot.chat(`Hi ${player.username}, enjoy the gameee..`);
    }
  });

  bot.on('end', () => {
    console.log("⛔ Disconnected");
    process.exit(0);
  });

  bot.on('error', err => {
    console.log("⚠️ Error:", err);
  });
}

function shutdown() {
  try {
    bot.clearControlStates();
    bot.quit();
  } catch {}

  setTimeout(() => process.exit(0), 2000);
}

startBot();