const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.touchAction = 'none';
document.getElementById('game').appendChild(canvas);
const ctx = canvas.getContext('2d');

let mode = 'computer'; // Immer Einzelspieler gegen Computer

let paddleHeight = 60, paddleWidth = 10;
let leftY = 120, rightY = 120;
let ballX = 200, ballY = 150, ballVX = 3, ballVY = 2;
let leftScore = 0, rightScore = 0;
let gameOver = false;
let winner = null;
let boostCount = 3;
let boostPending = false; // Boost ist gedrückt, aber noch nicht aktiviert
let boostActive = false;  // Boost ist aktiv (Ball ist geboostet)
let boostUsedThisTurn = false; // Damit pro Ball nur 1 Boost
function draw() {
    // Hintergrund mit Farbverlauf
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#e0eafc");
    grad.addColorStop(1, "#cfdef3");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mittellinie (gepunktet, heller)
    ctx.save();
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(200, 0);
    ctx.lineTo(200, 300);
    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Paddles (rund, mit Schatten)
    ctx.save();
    ctx.shadowColor = "#888";
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 120, 255, 0.85)';
    roundRect(ctx, 10, leftY, paddleWidth, paddleHeight, 10, true, false);
    ctx.fillStyle = 'rgba(0, 200, 100, 0.85)';
    roundRect(ctx, 380, rightY, paddleWidth, paddleHeight, 10, true, false);
    ctx.restore();

    // Ball (mit Schatten, Glow bei Boost)
    ctx.save();
    ctx.shadowColor = boostActive ? "#ff0" : "#888";
    ctx.shadowBlur = boostActive ? 30 : 12;
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = boostActive ? '#ffe066' : '#ff4d4d';
    ctx.fill();
    ctx.restore();

    // Score
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#222';
    ctx.fillText(leftScore, 120, 50);
    ctx.fillText(rightScore, 260, 50);
    ctx.restore();

    // Boost-Anzeige
    ctx.save();
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`Boosts: ${boostCount}`, 20, 285);
    if (boostPending) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Boost bereit!', 140, 80);
    }
    if (boostActive) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('BOOST!', 155, 110);
    }
    ctx.restore();

    // Gewinner-Anzeige
    if (gameOver) {
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = winner === 'player' ? '#0078ff' : '#00c864';
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.fillText(
            winner === 'player' ? 'Du hast gewonnen!' : 'Computer hat gewonnen!',
            35, 170
        );
        ctx.restore();
    }
}

// Hilfsfunktion für runde Rechtecke
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function resetBall() {
    ballX = 200; ballY = 150;
    ballVX = (Math.random() > 0.5 ? 3 : -3);
    ballVY = (Math.random() > 0.5 ? 2 : -2);
    boostActive = false;
    boostPending = false;
    boostUsedThisTurn = false;
}

function update() {
    if (gameOver) return;
    ballX += ballVX;
    ballY += ballVY;
    // Ball an Wänden
    if (ballY < 8) {
        ballY = 8;
        ballVY *= -1;
    }
    if (ballY > 292) {
        ballY = 292;
        ballVY *= -1;
    }
    // Ball an linkem Paddle
    if (
        ballVX < 0 &&
        ballX - 8 <= 20 + paddleWidth &&
        ballX - 8 >= 10 &&
        ballY + 8 >= leftY &&
        ballY - 8 <= leftY + paddleHeight
    ) {
        // Abstand zur Paddle-Mitte
        let rel = (ballY - (leftY + paddleHeight / 2)) / (paddleHeight / 2);
        let speed = 3 + Math.abs(rel) * 4;
        let angle = rel * Math.PI / 4;
        // Boost nur aktivieren, wenn pending und noch nicht für diesen Ball benutzt
        if (boostPending && !boostUsedThisTurn) {
            boostActive = true;
            boostPending = false;
            boostUsedThisTurn = true;
            speed *= 2;
        }
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        // Ball immer nach rechts
        ballVX = Math.abs(vx);
        ballVY = vy;
        // Ball etwas aus dem Paddle schieben
        ballX = 20 + paddleWidth + 8;
    }
    // Ball an rechtem Paddle (Computer)
    if (
        ballVX > 0 &&
        ballX + 8 >= 380 &&
        ballX + 8 <= 380 + paddleWidth &&
        ballY + 8 >= rightY &&
        ballY - 8 <= rightY + paddleHeight
    ) {
        let rel = (ballY - (rightY + paddleHeight / 2)) / (paddleHeight / 2);
        let speed = 3 + Math.abs(rel) * 4;
        // Wenn Boost aktiv, jetzt deaktivieren
        if (boostActive) {
            speed /= 2;
            boostActive = false;
        }
        let angle = rel * Math.PI / 4;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        // Ball immer nach links
        ballVX = -Math.abs(vx);
        ballVY = vy;
        // Ball etwas aus dem Paddle schieben
        ballX = 380 - 8;
    }
    // Punkt
    if (ballX < 0) {
        rightScore++;
        if (rightScore >= 3) { // <--- hier von 5 auf 3 geändert
            gameOver = true;
            winner = 'computer';
            boostActive = false;
            boostPending = false;
        }
        resetBall();
    }
    if (ballX > 400) {
        leftScore++;
        if (leftScore >= 3) { // <--- hier von 5 auf 3 geändert
            gameOver = true;
            winner = 'player';
            boostActive = false;
            boostPending = false;
        }
        resetBall();
    }
    // Computer Paddle (immer rechts)
    if (rightY + paddleHeight/2 < ballY) rightY += 3;
    else if (rightY + paddleHeight/2 > ballY) rightY -= 3;
    rightY = Math.max(0, Math.min(240, rightY));
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Touch/Mouse Steuerung nur für linkes Paddle
let draggingLeft = false;
let lastTouchLeft = null;

canvas.addEventListener('touchstart', function(e) {
    for (let t of e.touches) {
        const rect = canvas.getBoundingClientRect();
        const x = t.clientX - rect.left;
        if (x < 200) {
            draggingLeft = true;
            lastTouchLeft = t.identifier;
            leftY = Math.max(0, Math.min(240, t.clientY - rect.top - paddleHeight/2));
        }
    }
});
canvas.addEventListener('touchend', function(e) {
    for (let t of e.changedTouches) {
        if (t.identifier === lastTouchLeft) draggingLeft = false;
    }
});
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let t of e.touches) {
        const x = t.clientX - rect.left;
        if (x < 200 && draggingLeft && t.identifier === lastTouchLeft) {
            leftY = Math.max(0, Math.min(240, t.clientY - rect.top - paddleHeight/2));
        }
    }
}, {passive: false});

canvas.addEventListener('mousedown', function(e) {
    if (e.offsetX < 200) {
        draggingLeft = true;
        leftY = Math.max(0, Math.min(240, e.offsetY - paddleHeight/2));
    }
});
canvas.addEventListener('mouseup', function(e) {
    draggingLeft = false;
});
canvas.addEventListener('mouseleave', function(e) {
    draggingLeft = false;
});
canvas.addEventListener('mousemove', function(e) {
    if (draggingLeft) leftY = Math.max(0, Math.min(240, e.offsetY - paddleHeight/2));
});

// Boost-Button
const boostBtn = document.createElement('button');
boostBtn.innerText = 'Boost!';
boostBtn.style.margin = '10px';
boostBtn.style.padding = '10px 30px';
boostBtn.style.fontSize = '1.2em';
boostBtn.style.background = 'linear-gradient(90deg,#ffe066,#ffd700)';
boostBtn.style.border = 'none';
boostBtn.style.borderRadius = '20px';
boostBtn.style.boxShadow = '0 2px 8px #bbb';
boostBtn.style.cursor = 'pointer';
boostBtn.style.transition = 'background 0.2s';
boostBtn.onpointerdown = () => boostBtn.style.background = '#fff700';
boostBtn.onpointerup = () => boostBtn.style.background = 'linear-gradient(90deg,#ffe066,#ffd700)';
boostBtn.onclick = function() {
    if (gameOver) return;
    if (boostCount > 0 && !boostPending && !boostActive) {
        boostCount--;
        boostPending = true;
    }
};
document.getElementById('game').appendChild(boostBtn);

const resetBtn = document.createElement('button');
resetBtn.innerText = 'Neustart';
resetBtn.style.margin = '10px';
resetBtn.style.padding = '10px 30px';
resetBtn.style.fontSize = '1.2em';
resetBtn.style.background = 'linear-gradient(90deg,#e0eafc,#cfdef3)';
resetBtn.style.border = 'none';
resetBtn.style.borderRadius = '20px';
resetBtn.style.boxShadow = '0 2px 8px #bbb';
resetBtn.style.cursor = 'pointer';
resetBtn.onclick = function() {
    leftScore = 0; rightScore = 0; gameOver = false; winner = null;
    boostCount = 3; boostPending = false; boostActive = false; boostUsedThisTurn = false;
    resetBall();
};
document.getElementById('game').appendChild(resetBtn);

draw();
gameLoop();