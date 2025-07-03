// Verbesserte Retro Ball Logik & Design (Breakout/Arkanoid-Style)
const W = 480, H = 340;
const paddleBaseW = 80, paddleH = 14;
const ballR = 8;
const rows = 7, cols = 12;
const brickW = 32, brickH = 16, brickGap = 4, brickTop = 48;
let paddleX = (W - paddleBaseW) / 2;
let paddleW = paddleBaseW;
let ballX = W/2, ballY = H-60, ballVX = 3, ballVY = -3;
let bricks = [];
let running = false;
let score = 0, lives = 3, gameOver = false, win = false;
let touchStartX = null;
let funFields = [];
let funFieldActive = null;
let funFieldTimer = 0;
let extraBalls = [];
let paddleSizeMod = 0; // 0=normal, 1=größer, -1=kleiner
let lastPaddleMod = 0;
let bgGrad = null;

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
canvas.style.background = '#181c2b';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.borderRadius = '18px';
canvas.style.boxShadow = '0 0 16px #bbb';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resetBricks() {
    bricks = [];
    for (let r = 0; r < rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < cols; c++) {
            bricks[r][c] = 1;
        }
    }
    // Funktionsfelder zufällig platzieren (max 4 pro Spiel)
    funFields = [];
    let placed = 0;
    while (placed < 4) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (bricks[r][c] && !funFields.some(f => f.r === r && f.c === c)) {
            const types = ["multi", "big", "small", "bonus", "slow", "life"];
            let type = types[Math.floor(Math.random()*types.length)];
            funFields.push({r, c, type, active: false});
            placed++;
        }
    }
}

function resetGame() {
    paddleX = (W - paddleBaseW) / 2;
    paddleW = paddleBaseW;
    ballX = W/2;
    ballY = H-60;
    ballVX = 3 * (Math.random() > 0.5 ? 1 : -1);
    ballVY = -3;
    score = 0;
    lives = 3;
    running = false;
    gameOver = false;
    win = false;
    extraBalls = [];
    funFieldActive = null;
    funFieldTimer = 0;
    paddleSizeMod = 0;
    lastPaddleMod = 0;
    resetBricks();
    draw();
}

function draw() {
    // Hintergrund mit Verlauf
    if (!bgGrad) {
        bgGrad = ctx.createLinearGradient(0,0,0,H);
        bgGrad.addColorStop(0,"#232946");
        bgGrad.addColorStop(1,"#181c2b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // Glühende Linien oben/unten
    ctx.save();
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H-4, W, 4);
    ctx.restore();

    // Blöcke
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (bricks[r][c]) {
                ctx.save();
                let grad = ctx.createLinearGradient(0,0,0,brickH);
                grad.addColorStop(0, ["#ffe066","#ffb366","#ff6666","#66b3ff","#66ffb3","#b366ff","#fffbe6"][r%7]);
                grad.addColorStop(1, "#232946");
                ctx.fillStyle = grad;
                ctx.shadowColor = "#fff";
                ctx.shadowBlur = 8;
                ctx.fillRect(
                    c*(brickW+brickGap)+brickGap,
                    brickTop + r*(brickH+brickGap),
                    brickW, brickH
                );
                ctx.restore();
            }
        }
    }

    // Funktionsfelder
    for (let f of funFields) {
        if (bricks[f.r][f.c]) {
            let bx = f.c*(brickW+brickGap)+brickGap;
            let by = brickTop + f.r*(brickH+brickGap);
            ctx.save();
            if (f.type === "multi") ctx.fillStyle = "#4dd";
            else if (f.type === "big") ctx.fillStyle = "#ffe066";
            else if (f.type === "small") ctx.fillStyle = "#ff6666";
            else if (f.type === "bonus") ctx.fillStyle = "#b366ff";
            else if (f.type === "slow") ctx.fillStyle = "#66b3ff";
            else if (f.type === "life") ctx.fillStyle = "#ff4d4d";
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(bx+brickW/2, by+brickH/2, 10, 0, 2*Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.font = "bold 13px Arial";
            ctx.fillStyle = "#222";
            ctx.textAlign = "center";
            let txt = {
                multi: "2x", big: "++", small: "--", bonus: "$", slow: "S", life: "♥"
            }[f.type];
            ctx.fillText(txt, bx+brickW/2, by+brickH/2+4);
            ctx.restore();
        }
    }

    // Paddle
    ctx.save();
    let paddleWMod = paddleBaseW + (paddleSizeMod === 1 ? 40 : paddleSizeMod === -1 ? -30 : 0);
    ctx.fillStyle = "#ffe066";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fillRect(paddleX, H-paddleH-18, paddleWMod, paddleH);
    ctx.restore();

    // Ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, 2*Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    // Extra-Bälle
    for (let b of extraBalls) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, ballR, 0, 2*Math.PI);
        ctx.fillStyle = "#4dd";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }

    // Score & Leben
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Punkte: "+score, 16, 32);
    ctx.fillText("Leben: "+lives, W-110, 32);
    ctx.restore();

    // Funktionsfeld-Anzeige
    if (funFieldActive) {
        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "#ffe066";
        ctx.textAlign = "center";
        let msg = {
            multi: "Mehr Bälle!",
            big: "Paddle größer!",
            small: "Paddle kleiner!",
            bonus: "+100 Punkte!",
            slow: "Ball langsamer!",
            life: "+1 Leben!"
        }[funFieldActive];
        ctx.fillText(msg, W/2, H-60);
        ctx.restore();
    }

    // Game Over / Win
    if (gameOver || win) {
        ctx.save();
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = win ? "#ffe066" : "#ff4d4d";
        ctx.textAlign = "center";
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 8;
        ctx.fillText(win ? "Gewonnen!" : "Game Over", W/2, H/2-10);
        ctx.font = "20px Arial";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.fillText("Klick oder Enter für Neustart", W/2, H/2+30);
        ctx.restore();
    }
    // Start Hinweis
    if (!running && !gameOver && !win) {
        ctx.save();
        ctx.font = "18px Arial";
        ctx.fillStyle = "#ffe066";
        ctx.textAlign = "center";
        ctx.fillText("Leertaste oder Tippen zum Start", W/2, H-24);
        ctx.restore();
    }
}

function updateBall(x, y, vx, vy, isExtraBall = false, ballIdx = -1) {
    x += vx;
    y += vy;

    // Wände
    if (x < ballR) { x = ballR; vx *= -1; }
    if (x > W-ballR) { x = W-ballR; vx *= -1; }
    if (y < ballR) { y = ballR; vy *= -1; }

    // Paddle
    let paddleWMod = paddleBaseW + (paddleSizeMod === 1 ? 40 : paddleSizeMod === -1 ? -30 : 0);
    if (
        y + ballR >= H-paddleH-18 &&
        y + ballR <= H-18 &&
        x >= paddleX &&
        x <= paddleX + paddleWMod
    ) {
        y = H-paddleH-18-ballR;
        let rel = (x - (paddleX + paddleWMod/2)) / (paddleWMod/2);
        let angle = rel * Math.PI/3;
        let speed = Math.sqrt(vx*vx + vy*vy);
        vx = speed * Math.sin(angle);
        vy = -Math.abs(speed * Math.cos(angle));
    }

    // Blöcke & Funktionsfelder
    outer: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (bricks[r][c]) {
                let bx = c*(brickW+brickGap)+brickGap;
                let by = brickTop + r*(brickH+brickGap);
                if (
                    x + ballR > bx &&
                    x - ballR < bx + brickW &&
                    y + ballR > by &&
                    y - ballR < by + brickH
                ) {
                    // Funktionsfeld?
                    let fun = funFields.find(f => f.r === r && f.c === c);
                    if (fun) {
                        activateFunField(fun.type);
                        funFields = funFields.filter(f => !(f.r === r && f.c === c));
                    }
                    bricks[r][c] = 0;
                    score += 10;
                    // Ball-Richtung ändern
                    if (y < by || y > by + brickH) {
                        vy *= -1;
                    } else {
                        vx *= -1;
                    }
                    break outer;
                }
            }
        }
    }

    // Lose
    if (y > H+ballR) {
        if (isExtraBall) {
            extraBalls.splice(ballIdx, 1);
        } else {
            lives--;
            if (lives <= 0) {
                gameOver = true;
            } else {
                running = false;
                ballX = W/2;
                ballY = H-60;
                ballVX = 3 * (Math.random() > 0.5 ? 1 : -1);
                ballVY = -3;
            }
        }
    }

    // Win
    if (bricks.flat().every(b => b === 0)) {
        win = true;
        running = false;
    }

    return {x, y, vx, vy};
}

function update() {
    if (!running || gameOver || win) return;

    // Paddle-Größe anpassen
    paddleW = paddleBaseW + (paddleSizeMod === 1 ? 40 : paddleSizeMod === -1 ? -30 : 0);
    if (paddleW < 40) paddleW = 40;
    if (paddleW > 180) paddleW = 180;

    // Hauptball
    let res = updateBall(ballX, ballY, ballVX, ballVY, false, -1);
    ballX = res.x; ballY = res.y; ballVX = res.vx; ballVY = res.vy;

    // Extra-Bälle
    for (let i = extraBalls.length-1; i >= 0; i--) {
        let b = extraBalls[i];
        let res = updateBall(b.x, b.y, b.vx, b.vy, true, i);
        if (extraBalls[i]) {
            extraBalls[i].x = res.x;
            extraBalls[i].y = res.y;
            extraBalls[i].vx = res.vx;
            extraBalls[i].vy = res.vy;
        }
    }

    // Funktionsfeld Timer
    if (funFieldActive) {
        funFieldTimer--;
        if (funFieldTimer <= 0) {
            if (funFieldActive === "big" || funFieldActive === "small") paddleSizeMod = 0;
            funFieldActive = null;
        }
    }
}

function activateFunField(type) {
    funFieldActive = type;
    funFieldTimer = 180; // ca. 3 Sekunden
    if (type === "multi") {
        // Zwei Extra-Bälle
        for (let i = 0; i < 2; i++) {
            extraBalls.push({
                x: ballX,
                y: ballY,
                vx: (Math.random() > 0.5 ? 3 : -3),
                vy: -3
            });
        }
    } else if (type === "big") {
        paddleSizeMod = 1;
    } else if (type === "small") {
        paddleSizeMod = -1;
    } else if (type === "bonus") {
        score += 100;
    } else if (type === "slow") {
        ballVX *= 0.6; ballVY *= 0.6;
        extraBalls.forEach(b => { b.vx *= 0.6; b.vy *= 0.6; });
    } else if (type === "life") {
        lives++;
    }
}

// Steuerung: Pfeiltasten, Touch, Maus
document.addEventListener('keydown', function(e) {
    if (e.key === "ArrowLeft") paddleX -= 32;
    if (e.key === "ArrowRight") paddleX += 32;
    if (e.key === " " && !running && !gameOver && !win) running = true;
    if ((e.key === "Enter" || e.key === " ") && (gameOver || win)) resetGame();
    paddleX = Math.max(0, Math.min(W-paddleW, paddleX));
});
canvas.addEventListener('mousedown', function(e) {
    if (!running && !gameOver && !win) running = true;
});
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
});
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const t = e.touches[0];
    // Paddle bewegen
    const rect = canvas.getBoundingClientRect();
    let x = t.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
    if (!running && !gameOver && !win) running = true;
    touchStartX = t.clientX;
}, {passive: false});
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    let x = t.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    touchStartX = null;
    if ((gameOver || win)) resetGame();
}, {passive: false});
canvas.addEventListener('click', function() {
    if ((gameOver || win)) resetGame();
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    resetGame();
    gameLoop();
};
