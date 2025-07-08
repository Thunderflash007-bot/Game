document.getElementById('game').innerText = 'Hier kommt Breakout hin.';

const W = 480, H = 340;
const paddleW = 80, paddleH = 14;
const ballR = 8;
const rows = 6, cols = 10;
const brickW = 36, brickH = 16, brickGap = 4, brickTop = 48;
let paddleX = (W - paddleW) / 2;
let ballX = W/2, ballY = H-60, ballVX = 3, ballVY = -3;
let bricks = [];
let running = false;
let score = 0, lives = 3, gameOver = false, win = false;
let interval = null;

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
}

function resetGame() {
    paddleX = (W - paddleW) / 2;
    ballX = W/2;
    ballY = H-60;
    ballVX = 3 * (Math.random() > 0.5 ? 1 : -1);
    ballVY = -3;
    score = 0;
    lives = 3;
    running = false;
    gameOver = false;
    win = false;
    resetBricks();
    draw();
    if (interval) clearInterval(interval);
    interval = setInterval(gameLoop, 16);
}

function draw() {
    ctx.clearRect(0,0,W,H);
    // Blöcke
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (bricks[r][c]) {
                ctx.save();
                let grad = ctx.createLinearGradient(0,0,0,brickH);
                grad.addColorStop(0, ["#ffe066","#ffb366","#ff6666","#66b3ff","#66ffb3","#b366ff"][r%6]);
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
    // Paddle
    ctx.save();
    ctx.fillStyle = "#ffe066";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fillRect(paddleX, H-paddleH-18, paddleW, paddleH);
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
    // Score & Leben
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Punkte: "+score, 16, 32);
    ctx.fillText("Leben: "+lives, W-110, 32);
    ctx.restore();
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

function updateBall() {
    ballX += ballVX;
    ballY += ballVY;
    // Wände
    if (ballX < ballR) { ballX = ballR; ballVX *= -1; }
    if (ballX > W-ballR) { ballX = W-ballR; ballVX *= -1; }
    if (ballY < ballR) { ballY = ballR; ballVY *= -1; }
    // Paddle
    if (
        ballY + ballR >= H-paddleH-18 &&
        ballY + ballR <= H-18 &&
        ballX >= paddleX &&
        ballX <= paddleX + paddleW
    ) {
        ballY = H-paddleH-18-ballR;
        let rel = (ballX - (paddleX + paddleW/2)) / (paddleW/2);
        let angle = rel * Math.PI/3;
        let speed = Math.sqrt(ballVX*ballVX + ballVY*ballVY);
        ballVX = speed * Math.sin(angle);
        ballVY = -Math.abs(speed * Math.cos(angle));
    }
    // Blöcke
    outer: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (bricks[r][c]) {
                let bx = c*(brickW+brickGap)+brickGap;
                let by = brickTop + r*(brickH+brickGap);
                if (
                    ballX + ballR > bx &&
                    ballX - ballR < bx + brickW &&
                    ballY + ballR > by &&
                    ballY - ballR < by + brickH
                ) {
                    bricks[r][c] = 0;
                    score += 10;
                    // Ball-Richtung ändern
                    if (ballY < by || ballY > by + brickH) {
                        ballVY *= -1;
                    } else {
                        ballVX *= -1;
                    }
                    break outer;
                }
            }
        }
    }
    // Lose
    if (ballY > H+ballR) {
        lives--;
        if (lives <= 0) {
            gameOver = true;
            running = false;
        } else {
            running = false;
            ballX = W/2;
            ballY = H-60;
            ballVX = 3 * (Math.random() > 0.5 ? 1 : -1);
            ballVY = -3;
        }
    }
    // Win
    if (bricks.flat().every(b => b === 0)) {
        win = true;
        running = false;
    }
}

function gameLoop() {
    if (!running || gameOver || win) return;
    updateBall();
    draw();
}

// Verbesserte Steuerung: Pfeiltasten, Touch, Maus, Enter für Neustart
document.addEventListener('keydown', function(e) {
    if (e.key === "ArrowLeft") paddleX -= 32;
    if (e.key === "ArrowRight") paddleX += 32;
    if (e.key === " " && !running && !gameOver && !win) running = true;
    if ((e.key === "Enter" || e.key === " ") && (gameOver || win)) resetGame();
    paddleX = Math.max(0, Math.min(W-paddleW, paddleX));
});
canvas.addEventListener('mousedown', function(e) {
    if (!running && !gameOver && !win) running = true;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
});
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
});
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    let x = t.clientX - rect.left;
    paddleX = Math.max(0, Math.min(W-paddleW, x - paddleW/2));
    if (!running && !gameOver && !win) running = true;
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
    if ((gameOver || win)) resetGame();
}, {passive: false});
canvas.addEventListener('click', function() {
    if ((gameOver || win)) resetGame();
});

resetGame();
draw();
