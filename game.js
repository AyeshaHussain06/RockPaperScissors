const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const msgEl = document.getElementById("msg");
const modeSpan = document.getElementById("mode");
const oppSpan = document.getElementById("opp");
const resultSpan = document.getElementById("result");
const btnRestart = document.getElementById("btnRestart");

let mode = "title"; // "title" | "lounge" | "battle"

const player = {
  x: 380,
  y: 500,
  w: 40,
  h: 60,
  speed: 4
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

const npc = {
  x: 360,
  y: 150,
  w: 60,
  h: 80,
  speed: 2,
  dir: 1
};

let currentOpp = null;

const opponents = [
  { id: 0, name: "opponent 1", rect: { x: 180, y: 150, w: 60, h: 80 } },
  { id: 1, name: "opponent 2" }, // moving one uses npc rect
  { id: 2, name: "opponent 3", rect: { x: 560, y: 150, w: 60, h: 80 } }
];

const moves = ["rock", "paper", "scissors"];
let lastOutcome = null; // "win" | "lose" | "tie" | null
let lastMoves = { player: null, opp: null };

// animation state
let titleBounce = 0;
let buttonHover = -1;
let outcomeAnimProgress = 0; // 0 to 1 for outcome animations

// rock / paper / scissors button boxes (canvas coords)
const battleButtons = [
  { move: "rock",     x: 0, y: 0, w: 0, h: 0 },
  { move: "paper",    x: 0, y: 0, w: 0, h: 0 },
  { move: "scissors", x: 0, y: 0, w: 0, h: 0 }
];

function setMsg(text) {
  msgEl.textContent = text;
}

function setMode(newMode) {
  mode = newMode;
  modeSpan.textContent = mode;

  if (mode === "title") {
    setMsg("press space to start");
  } else if (mode === "lounge") {
    setMsg("arrows = move • Enter = challenge");
  } else if (mode === "battle") {
    setMsg("R / P / S or click a move");
  }
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function tryStartBattle() {
  if (mode !== "lounge") return;

  const p = { x: player.x, y: player.y, w: player.w, h: player.h };

  const left  = opponents[0].rect;
  const mid   = { x: npc.x, y: npc.y, w: npc.w, h: npc.h };
  const right = opponents[2].rect;

  const rects = [left, mid, right];

  for (let i = 0; i < rects.length; i++) {
    if (rectsOverlap(p, rects[i])) {
      currentOpp = i;
      oppSpan.textContent = opponents[i].name;
      lastOutcome = null;
      lastMoves = { player: null, opp: null };
      resultSpan.textContent = "—";
      outcomeAnimProgress = 0;
      setMode("battle");
      return;
    }
  }

  setMsg("get a bit closer to an opponent");
}

function randomOppMove() {
  return moves[Math.floor(Math.random() * moves.length)];
}

function beats(a, b) {
  return (
    (a === "rock"     && b === "scissors") ||
    (a === "paper"    && b === "rock")     ||
    (a === "scissors" && b === "paper")
  );
}

function doRound(playerMove) {
  if (mode !== "battle") return;

  const oppMove = randomOppMove();
  let outcome = "tie";

  if (playerMove !== oppMove) {
    outcome = beats(playerMove, oppMove) ? "win" : "lose";
  }

  lastOutcome = outcome;
  lastMoves = { player: playerMove, opp: oppMove };
  outcomeAnimProgress = 0; // restart animation

  if (outcome === "win") {
    setMsg("you won • Enter = back to lounge");
    resultSpan.textContent = "WIN";
  } else if (outcome === "lose") {
    setMsg("you lost • Enter = back to lounge");
    resultSpan.textContent = "LOSE";
  } else {
    setMsg("tie • pick again");
    resultSpan.textContent = "TIE";
  }
}

function resetGame() {
  currentOpp = null;
  lastOutcome = null;
  lastMoves = { player: null, opp: null };
  player.x = 380;
  player.y = 500;
  npc.x = 360;
  npc.dir = 1;
  oppSpan.textContent = "none";
  resultSpan.textContent = "—";
  outcomeAnimProgress = 0;
  setMode("title");
}

// rounded rect helper (for UI stuff, not cats)
function drawRoundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// easing function for smooth animations
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function drawTitle() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#E3D2BF");
  grad.addColorStop(1, "#F5EDE2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(199, 224, 212, 0.3)";
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.arc(700, 500, 100, 0, Math.PI * 2);
  ctx.fill();

  titleBounce += 0.05;
  const bounce = Math.sin(titleBounce) * 8;

  ctx.fillStyle = "#6A4C3B";
  ctx.font = "bold 52px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Rock Paper Scissors", canvas.width / 2, 200 + bounce);

  ctx.font = "22px system-ui";
  ctx.fillStyle = "#C78A55";
  ctx.fillText("Challenge the Cats", canvas.width / 2, 250 + bounce);

  const btnY = 340;
  const btnW = 220;
  const btnH = 60;
  const btnX = canvas.width / 2 - btnW / 2;

  ctx.fillStyle = "#C78A55";
  drawRoundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fill();

  ctx.strokeStyle = "#6A4C3B";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#F5EDE2";
  ctx.font = "bold 24px system-ui";
  ctx.fillText("PRESS SPACE", canvas.width / 2, btnY + btnH / 2);

  ctx.fillStyle = "#6A4C3B";
  ctx.font = "16px system-ui";
  ctx.fillText("Use arrow keys to move • Enter to challenge", canvas.width / 2, 480);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawLounge() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#C7E0D4");
  grad.addColorStop(0.7, "#E3D2BF");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(106, 76, 59, 0.1)";
  ctx.lineWidth = 2;
  for (let i = 0; i < canvas.width; i += 80) {
    for (let j = 300; j < canvas.height; j += 80) {
      ctx.strokeRect(i, j, 80, 80);
    }
  }

  ctx.fillStyle = "#6A4C3B";
  ctx.font = "bold 28px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("The Lounge", canvas.width / 2, 30);

  // left opponent (placeholder rectangle)
  ctx.fillStyle = "#A5A6AA";
  ctx.fillRect(
    opponents[0].rect.x,
    opponents[0].rect.y,
    opponents[0].rect.w,
    opponents[0].rect.h
  );

  // right opponent (placeholder rectangle)
  ctx.fillRect(
    opponents[2].rect.x,
    opponents[2].rect.y,
    opponents[2].rect.w,
    opponents[2].rect.h
  );

  // middle moving opponent (placeholder rectangle)
  ctx.fillStyle = "#E8B7C2";
  ctx.fillRect(npc.x, npc.y, npc.w, npc.h);

  // player (placeholder rectangle)
  ctx.fillStyle = "#6A4C3B";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  ctx.textAlign = "left";
  ctx.font = "14px system-ui";
  ctx.fillStyle = "#6A4C3B";
  ctx.fillText("move with arrows, press Enter near an opponent", 230, 560);
}

function drawBattle() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#F5EDE2");
  grad.addColorStop(1, "#E3D2BF");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // inset border so text doesn't overlap
  ctx.strokeStyle = "rgba(106, 76, 59, 0.15)";
  ctx.lineWidth = 28;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.fillStyle = "#6A4C3B";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("BATTLE", canvas.width / 2, 60);

  const name = currentOpp != null ? opponents[currentOpp].name : "opponent";
  ctx.font = "24px system-ui";
  ctx.fillText("vs " + name, canvas.width / 2, 105);

  // simple rectangle as opponent portrait
  const portraitSizeW = 160;
  const portraitSizeH = 160;
  const portraitX = canvas.width / 2 - portraitSizeW / 2;
  const portraitY = 140;

  ctx.fillStyle = "#E8B7C2";
  ctx.fillRect(portraitX, portraitY, portraitSizeW, portraitSizeH);

  // rock / paper / scissors buttons
  const baseY = 400;
  const boxW = 140;
  const boxH = 60;
  const gap = 30;
  const startX = 120;
  const labels = ["Rock (R)", "Paper (P)", "Scissors (S)"];

  ctx.font = "16px system-ui";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (boxW + gap);

    // store clickable area
    battleButtons[i].x = x;
    battleButtons[i].y = baseY;
    battleButtons[i].w = boxW;
    battleButtons[i].h = boxH;

    ctx.fillStyle = buttonHover === i ? "#C78A55" : "#E3D2BF";
    drawRoundRect(x, baseY, boxW, boxH, 10);
    ctx.fill();

    ctx.strokeStyle = "#6A4C3B";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#6A4C3B";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + boxW / 2, baseY + boxH / 2);
  }

  ctx.textAlign = "center";

  if (lastMoves.player && lastMoves.opp) {
    ctx.fillStyle = "#6A4C3B";
    ctx.font = "18px system-ui";
    ctx.fillText("You chose: " + lastMoves.player.toUpperCase(), canvas.width / 2, 340);
    ctx.fillText("Opponent chose: " + lastMoves.opp.toUpperCase(), canvas.width / 2, 365);
  }

  // IMPROVED OUTCOME ANIMATIONS
  if (lastOutcome === "win" || lastOutcome === "lose") {
    // animate progress from 0 to 1
    if (outcomeAnimProgress < 1) {
      outcomeAnimProgress += 0.04;
      if (outcomeAnimProgress > 1) outcomeAnimProgress = 1;
    }

    // fade in background
    const alpha = outcomeAnimProgress * 0.8;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // scale and bounce effect
    const scale = easeOutBack(outcomeAnimProgress);
    
    const text = lastOutcome === "win" ? "YOU WON!" : "GAME OVER";
    const color = lastOutcome === "win" ? "#C7E0D4" : "#E8B7C2";

    ctx.save();
    ctx.translate(canvas.width / 2, 290);
    ctx.scale(scale, scale);

    // background box
    const boxW = 500;
    const boxH = 120;
    ctx.fillStyle = color;
    drawRoundRect(-boxW/2, -boxH/2, boxW, boxH, 20);
    ctx.fill();

    // text
    ctx.fillStyle = "#6A4C3B";
    ctx.font = "bold 48px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, -10);

    ctx.font = "20px system-ui";
    ctx.fillText("Press Enter to return", 0, 30);

    ctx.restore();
  }
  // TIE - slide in from top
  else if (lastOutcome === "tie") {
    if (outcomeAnimProgress < 1) {
      outcomeAnimProgress += 0.08;
      if (outcomeAnimProgress > 1) outcomeAnimProgress = 1;
    }

    const bannerW = 360;
    const bannerH = 70;
    const bannerX = canvas.width / 2 - bannerW / 2;
    
    // slide from above
    const targetY = 270;
    const startY = -bannerH - 20;
    const currentY = startY + (targetY - startY) * easeOutBack(outcomeAnimProgress);

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    drawRoundRect(bannerX, currentY, bannerW, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = "#C78A55";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#6A4C3B";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TIE — pick again", canvas.width / 2, currentY + bannerH / 2);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function update() {
  if (mode === "lounge") {
    if (keys.ArrowLeft)  player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp)    player.y -= player.speed;
    if (keys.ArrowDown)  player.y += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
    if (player.y < 0) player.y = 0;
    if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;

    npc.x += npc.speed * npc.dir;
    if (npc.x <= 250 || npc.x + npc.w >= 500) {
      npc.dir *= -1;
    }
  }
}

function draw() {
  if (mode === "title") {
    drawTitle();
  } else if (mode === "lounge") {
    drawLounge();
  } else if (mode === "battle") {
    drawBattle();
  }
}

function loop() {
  update();
  draw();
}

window.addEventListener("keydown", (e) => {
  if (e.key in keys) {
    keys[e.key] = true;
  }

  if (mode === "title" && e.key === " ") {
    setMode("lounge");
  }

  if (mode === "lounge" && e.key === "Enter") {
    tryStartBattle();
  }

  if (mode === "battle") {
    if (e.key === "r" || e.key === "R") {
      buttonHover = 0;
      doRound("rock");
    }
    if (e.key === "p" || e.key === "P") {
      buttonHover = 1;
      doRound("paper");
    }
    if (e.key === "s" || e.key === "S") {
      buttonHover = 2;
      doRound("scissors");
    }

    if (e.key === "Enter" && (lastOutcome === "win" || lastOutcome === "lose")) {
      setMode("lounge");
      lastOutcome = null;
      lastMoves = { player: null, opp: null };
      buttonHover = -1;
      currentOpp = null;
      oppSpan.textContent = "none";
      resultSpan.textContent = "—";
      outcomeAnimProgress = 0;
      setMsg("arrows = move • Enter = challenge");
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key in keys) {
    keys[e.key] = false;
  }
});

// canvas click → rock / paper / scissors
canvas.addEventListener("mousedown", (e) => {
  if (mode !== "battle") return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  for (let i = 0; i < battleButtons.length; i++) {
    const b = battleButtons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      buttonHover = i;
      doRound(b.move);
      break;
    }
  }
});

btnRestart.addEventListener("click", resetGame);

setMode("title");
setInterval(loop, 1000 / 30);
