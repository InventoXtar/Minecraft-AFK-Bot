const mineflayer = require('mineflayer');
const config = require('./config.json');

let bot;
let phase = 0;

const STEP_INTERVAL = 1500;
const RUN_TIME = 6 * 60 * 1000; // 6 minutes safe window

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

    setTimeout(() => {
      bot.setControlState('sneak', true);
    }, 2000);

    movementLoop();

    // auto shutdown before Actions kills it
    setTimeout(() => {
      console.log("🔁 Restart cycle");
      shutdown();
    }, RUN_TIME);
  });

  bot.on('end', () => {
    console.log("⛔ Disconnected");
    process.exit(0);
  });

  bot.on('error', err => {
    console.log("⚠️ Error:", err);
  });
}

function movementLoop() {
  if (!bot || !bot.entity) return;

  switch (phase) {
    case 0:
      bot.setControlState('forward', true);
      bot.setControlState('back', false);
      break;

    case 1:
      bot.setControlState('forward', false);
      bot.setControlState('back', true);
      break;

    case 2:
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      break;

    case 3:
      bot.clearControlStates();
      break;
  }

  phase = (phase + 1) % 4;
  setTimeout(movementLoop, STEP_INTERVAL);
}

function shutdown() {
  try {
    bot.clearControlStates();
    bot.quit();
  } catch (e) {}

  setTimeout(() => process.exit(0), 2000);
}

startBot();
