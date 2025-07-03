// --- Retro Bowl: Minimalistische Logik, keine Routen, sofort spielbar ---

// --- Retro Bowl: Komplette neue Logik & Design (2024) ---
// Einfache Arcade-Football-Variante mit Play-Design, Steuerung und Touchdown-Mechanik

const W = 720, H = 420;
const fieldY = 80, fieldH = 280;
const yardPerPx = 100 / (W - 120);

let score = 0, down = 1, yardsToGo = 10, ballOn = 25, playOver = false, gameOver = false;
let message = "Ziehe nach rechts zum Werfen!";
let driveStartX = 120;
let lastUpdate = Date.now();

let ball, qb, receivers, defenders, runner, passTarget, passInAir, passCatchable, passCatched, yardsGained, selectedReceiver, controlMode, dragStart;

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
canvas.style.background = '#1b5e20';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.borderRadius = '18px';
canvas.style.boxShadow = '0 0 16px #bbb';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

// --- Initialisierung ---
let gameTimer = null;
let timeLeft = 60; // 1 Minute

function resetGame() {
    ball = {x: 120, y: H/2, vx: 0, vy: 0, running: false, thrown: false};
    qb = {x: 120, y: H/2, color: "#ffe066", radius: 16, state: "qb", alive: true};
    receivers = [
        {x: 220, y: fieldY+70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false},
        {x: 220, y: fieldY+fieldH-70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false}
    ];
    defenders = [
        {x: 420, y: fieldY+60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 420, y: fieldY+fieldH-60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 540, y: fieldY+fieldH/2-40, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 600, y: fieldY+fieldH/2+40, color: "#c00", radius: 16, state: "defender", alive: true}
    ];
    score = 0; down = 1; yardsToGo = 10; ballOn = 25; playOver = false; gameOver = false;
    message = "Ziehe nach rechts zum Werfen!";
    passTarget = null;
    passInAir = false;
    passCatchable = false;
    passCatched = false;
    yardsGained = 0;
    driveStartX = 120;
    runner = null;
    selectedReceiver = 0;
    controlMode = null;
    dragStart = null;
    timeLeft = 60;
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        if (gameOver) {
            clearInterval(gameTimer);
            return;
        }
        timeLeft--;
        if (timeLeft <= 0) {
            gameOver = true;
            playOver = true;
            message = "Zeit abgelaufen! Punkte: " + score;
            clearInterval(gameTimer);
            draw();
        }
        draw();
    }, 1000);
    draw();
}

// --- Feld & Spieler zeichnen ---
function drawField() {
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(0, 0, W, H);
    // Endzonen
    ctx.save();
    ctx.fillStyle = "#1877c9";
    ctx.fillRect(0, fieldY, 60, fieldH);
    ctx.fillStyle = "#c00";
    ctx.fillRect(W-60, fieldY, 60, fieldH);
    ctx.restore();
    // Feld
    ctx.save();
    let grad = ctx.createLinearGradient(0, fieldY, 0, fieldY+fieldH);
    grad.addColorStop(0, "#388e3c");
    grad.addColorStop(1, "#2e7d32");
    ctx.fillStyle = grad;
    ctx.fillRect(60, fieldY, W-120, fieldH);
    ctx.restore();
    // Yards & Linien
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, fieldY, W-120, fieldH);
    ctx.lineWidth = 1.2;
    for (let i = 0; i <= 10; i++) {
        let x = 60 + i*(W-120)/10;
        ctx.beginPath();
        ctx.moveTo(x, fieldY);
        ctx.lineTo(x, fieldY+fieldH);
        ctx.stroke();
        if (i > 0 && i < 10) {
            ctx.font = "bold 15px monospace";
            ctx.fillStyle = "#fff";
            ctx.fillText(i*10, x-12, fieldY+fieldH+22);
        }
    }
    ctx.restore();
    // Endzonen-Text
    ctx.save();
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#fff";
    ctx.save();
    ctx.translate(30, fieldY+fieldH/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = "center";
    ctx.fillText("RETRO", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(W-30, fieldY+fieldH/2);
    ctx.rotate(Math.PI/2);
    ctx.textAlign = "center";
    ctx.fillText("BOWL", 0, 0);
    ctx.restore();
    ctx.restore();
}

function drawPlayer(p) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius*0.7, p.radius*0.9, p.radius*0.4, 0, 0, 2*Math.PI);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2*Math.PI);
    ctx.fillStyle = p.color;
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y-p.radius*0.5, p.radius*0.6, Math.PI, 2*Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
}

function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y, 8, 4, 0.2, 0, 2*Math.PI);
    ctx.fillStyle = "#a0522d";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.restore();
}

function draw() {
    ctx.clearRect(0,0,W,H);
    drawField();
    drawPlayer(qb);
    receivers.forEach(drawPlayer);
    defenders.forEach(drawPlayer);
    if (ball.thrown || runner) drawBall();
    // Scoreboard
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Punkte: ${score}   Down: ${down}   Yards: ${yardsToGo}   Ball auf: ${ballOn}`, 32, 44);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#ffe066";
    ctx.fillText(`Zeit: ${timeLeft}s`, W-140, 44);
    ctx.restore();
    // Message
    ctx.save();
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#ffe066";
    ctx.textAlign = "center";
    ctx.fillText(message, W/2, H-24);
    ctx.restore();
    // Game Over
    if (gameOver) {
        ctx.save();
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#ffe066";
        ctx.textAlign = "center";
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 8;
        ctx.fillText("Game Over", W/2, H/2-10);
        ctx.font = "22px Arial";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.fillText("Klick oder Enter für Neustart", W/2, H/2+36);
        ctx.restore();
    }
}

// --- Receiver laufen einfach nach rechts, mit leichtem Zickzack ---
function moveReceivers() {
    for (let i = 0; i < receivers.length; i++) {
        let r = receivers[i];
        if (r.catched) continue;
        // Geradeaus nach rechts, mit leichtem Zickzack
        let angle = (Math.random()-0.5) * Math.PI/12;
        let speed = 1.5; // Spieler langsamer machen (vorher 2.7)
        r.x += Math.cos(angle)*speed;
        r.y += Math.sin(angle)*speed;
        r.x = Math.max(60+r.radius, Math.min(W-60-r.radius, r.x));
        r.y = Math.max(fieldY+r.radius, Math.min(fieldY+fieldH-r.radius, r.y));
    }
}

// --- Defense-Logik ---
function moveDefenders(targetX, targetY) {
    defenders.forEach((d, i) => {
        let dx = targetX - d.x, dy = targetY - d.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (d.x < 220) d.x = 220;
        let speed = (i < 2 ? 0.85 : 0.65);
        if (dist > 1) {
            d.x += dx/dist * speed;
            d.y += dy/dist * speed;
        }
        d.x = Math.max(220, Math.min(W-60-d.radius, d.x));
        d.y = Math.max(fieldY+d.radius, Math.min(fieldY+fieldH-d.radius, d.y));
    });
}

// --- Update-Loop ---
function update() {
    if (gameOver || playOver) return;
    // QB Bewegung
    if (!ball.thrown && !runner) {
        qb.x += 0.5;
        qb.x = Math.max(60+qb.radius, Math.min(W-60-qb.radius, qb.x));
        qb.y = Math.max(fieldY+qb.radius, Math.min(fieldY+fieldH-qb.radius, qb.y));
        ball.x = qb.x;
        ball.y = qb.y;
        moveDefenders(qb.x, qb.y);
        for (let d of defenders) {
            let dx = d.x - qb.x, dy = d.y - qb.y;
            if (Math.sqrt(dx*dx+dy*dy) < qb.radius + d.radius - 2) {
                playOver = true;
                message = "Getackelt! Nächster Versuch.";
                yardsGained = Math.round((qb.x - driveStartX) * yardPerPx);
                setTimeout(nextDown, 1200);
            }
        }
        if (qb.x <= 60+qb.radius || qb.x >= W-60-qb.radius || qb.y <= fieldY+qb.radius || qb.y >= fieldY+fieldH-qb.radius) {
            playOver = true;
            message = "Out of bounds!";
            setTimeout(nextDown, 1200);
        }
        if (qb.x > W-180 && !ball.thrown) {
            autoThrow();
        }
    }
    // Receiver Bewegung
    moveReceivers();
    // Passflug
    if (ball.thrown && passTarget && !runner) {
        let dx = passTarget.x - ball.x;
        let dy = passTarget.y - ball.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let speed = 10;
        if (dist > speed) {
            ball.x += dx/dist * speed;
            ball.y += dy/dist * speed;
        } else {
            ball.x = passTarget.x;
            ball.y = passTarget.y;
            passInAir = false;
            passCatchable = true;
        }
        ball.x = Math.max(60+8, Math.min(W-60-8, ball.x));
        ball.y = Math.max(fieldY+8, Math.min(fieldY+fieldH-8, ball.y));
        moveDefenders(ball.x, ball.y);
        // Kein Abfangen durch Defense!
        if (passCatchable && !passCatched) {
            for (let r of receivers) {
                if (!r.catched && Math.abs(r.x - ball.x) < r.radius+8 && Math.abs(r.y - ball.y) < r.radius+8) {
                    passCatched = true;
                    r.catched = true;
                    runner = r;
                    ball.thrown = false;
                    ball.running = true;
                    message = "";
                }
            }
            if (!passCatched && !passInAir) {
                playOver = true;
                message = "Unvollständig! Nächster Versuch.";
                yardsGained = Math.round((ball.x - driveStartX) * yardPerPx);
                setTimeout(nextDown, 1200);
            }
        }
    }
    // Nach Catch: Runner läuft nach rechts, Defense jagt ihn, Spieler kann steuern
    if (runner && ball.running) {
        // Automatisch weiterlaufen, solange keine Steuerung
        if (!controllingRunner && !runnerTouchControl) runner.x += 1.8;
        // Touch-Steuerung: Richtung wird in touchmove gesetzt
        runner.x = Math.max(60+runner.radius, Math.min(W-60-runner.radius, runner.x));
        runner.y = Math.max(fieldY+runner.radius, Math.min(fieldY+fieldH-runner.radius, runner.y));
        ball.x = runner.x;
        ball.y = runner.y;
        moveDefenders(runner.x, runner.y);
        for (let d of defenders) {
            let dx = d.x - runner.x, dy = d.y - runner.y;
            if (Math.sqrt(dx*dx+dy*dy) < d.radius + runner.radius - 2) {
                playOver = true;
                message = "Getackelt! Nächster Versuch.";
                yardsGained = Math.round((runner.x - driveStartX) * yardPerPx);
                setTimeout(nextDown, 1200);
            }
        }
        // --- Touchdown-Logik ---
        if (runner.x + runner.radius >= W-60 && !gameOver) {
            score += 6; // Touchdown gibt jetzt 6 Punkte
            playOver = true;
            message = "Touchdown! +6 Punkte";
            setTimeout(nextDrive, 1800);
            return;
        }
        if (
            runner.x <= 60+runner.radius ||
            runner.x >= W-60-runner.radius ||
            runner.y <= fieldY+runner.radius ||
            runner.y >= fieldY+fieldH-runner.radius
        ) {
            playOver = true;
            message = "Out of bounds!";
            setTimeout(nextDown, 1200);
        }
    }
    updateRunnerControl();
    draw();
}

// --- Runner-Steuerung nach Catch ---
let controllingRunner = false;
function updateRunnerControl() {
    // controllingRunner ist true, sobald der Runner läuft und Tastatur benutzt wird
    // (siehe Tastatursteuerung unten)
    if (runner && ball.running) {
        // controllingRunner bleibt true, sobald einmal Tastatur benutzt wurde
        // (wird in Tastatursteuerung gesetzt)
        if (typeof runner.routeIdx !== "undefined") delete runner.routeIdx;
    } else {
        controllingRunner = false;
    }
}

// --- Tastatursteuerung: QB/Runner bewegen (WASD/Pfeiltasten) ---
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (!ball.thrown && !runner && (!controlMode || controlMode === "move")) {
        if (e.key === "ArrowUp" || e.key === "w") qb.y -= 14;
        if (e.key === "ArrowDown" || e.key === "s") qb.y += 14;
        if (e.key === "ArrowLeft" || e.key === "a") qb.x -= 14;
        if (e.key === "ArrowRight" || e.key === "d") qb.x += 14;
        qb.x = Math.max(60+qb.radius, Math.min(W-60-qb.radius, qb.x));
        qb.y = Math.max(fieldY+qb.radius, Math.min(fieldY+fieldH-qb.radius, qb.y));
        ball.x = qb.x;
        ball.y = qb.y;
    }
    // --- Runner-Steuerung: Sobald eine Taste gedrückt wird, controllingRunner aktivieren ---
    if (runner && ball.running) {
        controllingRunner = true;
        if (e.key === "ArrowUp" || e.key === "w") runner.y -= 16;
        if (e.key === "ArrowDown" || e.key === "s") runner.y += 16;
        if (e.key === "ArrowLeft" || e.key === "a") runner.x -= 16;
        if (e.key === "ArrowRight" || e.key === "d") runner.x += 16;
        runner.x = Math.max(60+runner.radius, Math.min(W-60-runner.radius, runner.x));
        runner.y = Math.max(fieldY+runner.radius, Math.min(fieldY+fieldH-runner.radius, runner.y));
        ball.x = runner.x;
        ball.y = runner.y;
    }
});

// --- Steuerung: Pass werfen (Drag & Release vom QB) ---
// TouchAction verhindern, damit Seite nicht scrollt/verschiebt
canvas.style.touchAction = "none";

canvas.addEventListener('mousedown', function(e) {
    if (gameOver) { resetGame(); return; }
    if (playOver) return;
    const pos = getMousePos(e);
    if (!ball.thrown && !runner && Math.abs(pos.x - qb.x) < 30 && Math.abs(pos.y - qb.y) < 30) {
        dragStart = pos;
        controlMode = "drag";
    } else {
        controlMode = "move";
    }
});
canvas.addEventListener('mousemove', function(e) {
    if (controlMode === "drag" && dragStart && !ball.thrown && !ball.running && !runner) {
        let pos = getMousePos(e);
        draw();
        ctx.save();
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(qb.x, qb.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }
});
canvas.addEventListener('mouseup', function(e) {
    if (controlMode === "drag" && dragStart && !ball.thrown && !ball.running && !runner) {
        let pos = getMousePos(e);
        let dx = pos.x - qb.x;
        let dy = pos.y - qb.y;
        if (dx > 10) {
            // Werfe auf den nächsten freien Receiver in Richtung der Maus
            let best = null, bestDist = 9999;
            for (let i = 0; i < receivers.length; i++) {
                let r = receivers[i];
                if (!r.catched) {
                    let dist = Math.abs(r.x - pos.x) + Math.abs(r.y - pos.y);
                    if (dist < bestDist) {
                        best = r;
                        bestDist = dist;
                    }
                }
            }
            if (best) {
                passTarget = best;
                ball.thrown = true;
                passInAir = true;
                passCatchable = false;
                passCatched = false;
                message = "";
            }
        }
    }
    dragStart = null;
    controlMode = null;
});

// --- Touch-Steuerung für Pass (Drag & Release) ---
let touchDragStart = null;
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameOver) { resetGame(); return; }
    if (playOver) return;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
    if (!ball.thrown && !runner && Math.abs(pos.x - qb.x) < 30 && Math.abs(pos.y - qb.y) < 30) {
        touchDragStart = pos;
        dragStart = pos;
        controlMode = "drag";
    } else {
        controlMode = "move";
    }
}, {passive: false});
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (controlMode === "drag" && touchDragStart && !ball.thrown && !ball.running && !runner) {
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        let pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
        draw();
        ctx.save();
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(qb.x, qb.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (controlMode === "drag" && touchDragStart && !ball.thrown && !ball.running && !runner) {
        const t = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        let pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
        let dx = pos.x - qb.x;
        let dy = pos.y - qb.y;
        if (dx > 10) {
            let best = null, bestDist = 9999;
            for (let i = 0; i < receivers.length; i++) {
                let r = receivers[i];
                if (!r.catched) {
                    let dist = Math.abs(r.x - pos.x) + Math.abs(r.y - pos.y);
                    if (dist < bestDist) {
                        best = r;
                        bestDist = dist;
                    }
                }
            }
            if (best) {
                passTarget = best;
                ball.thrown = true;
                passInAir = true;
                passCatchable = false;
                passCatched = false;
                message = "";
            }
        }
    }
    touchDragStart = null;
    dragStart = null;
    controlMode = null;
}, {passive: false});

// --- Touch-Steuerung für Runner nach Catch ---
let runnerTouchControl = false;
let runnerTouchLast = null;

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameOver) { resetGame(); return; }
    if (playOver) return;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
    // Pass werfen (wie gehabt)
    if (!ball.thrown && !runner && Math.abs(pos.x - qb.x) < 30 && Math.abs(pos.y - qb.y) < 30) {
        touchDragStart = pos;
        dragStart = pos;
        controlMode = "drag";
        runnerTouchControl = false;
    } else if (runner && ball.running) {
        // Runner-Steuerung aktivieren
        runnerTouchControl = true;
        runnerTouchLast = pos;
        controllingRunner = true;
    } else {
        controlMode = "move";
        runnerTouchControl = false;
    }
}, {passive: false});
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (controlMode === "drag" && touchDragStart && !ball.thrown && !ball.running && !runner) {
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        let pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
        draw();
        ctx.save();
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(qb.x, qb.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }
    // Runner Touch-Steuerung: Ziehen = Richtung setzen
    if (runner && ball.running && runnerTouchControl) {
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        let pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
        // Richtung bestimmen
        let dx = pos.x - runner.x;
        let dy = pos.y - runner.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 8) {
            // Normiere Richtung auf Geschwindigkeit des Runners
            let speed = 1.8;
            runner.x += dx/dist * speed;
            runner.y += dy/dist * speed;
            runner.x = Math.max(60+runner.radius, Math.min(W-60-runner.radius, runner.x));
            runner.y = Math.max(fieldY+runner.radius, Math.min(fieldY+fieldH-runner.radius, runner.y));
            ball.x = runner.x;
            ball.y = runner.y;
        }
        runnerTouchLast = pos;
    }
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (controlMode === "drag" && touchDragStart && !ball.thrown && !ball.running && !runner) {
        const t = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        let pos = {x: t.clientX - rect.left, y: t.clientY - rect.top};
        let dx = pos.x - qb.x;
        let dy = pos.y - qb.y;
        if (dx > 10) {
            let best = null, bestDist = 9999;
            for (let i = 0; i < receivers.length; i++) {
                let r = receivers[i];
                if (!r.catched) {
                    let dist = Math.abs(r.x - pos.x) + Math.abs(r.y - pos.y);
                    if (dist < bestDist) {
                        best = r;
                        bestDist = dist;
                    }
                }
            }
            if (best) {
                passTarget = best;
                ball.thrown = true;
                passInAir = true;
                passCatchable = false;
                passCatched = false;
                message = "";
            }
        }
    }
    // Runner Touch-Steuerung beenden, wenn Finger losgelassen
    if (runner && ball.running && runnerTouchControl) {
        runnerTouchControl = false;
    }
    touchDragStart = null;
    dragStart = null;
    controlMode = null;
}, {passive: false});

// --- Tastatursteuerung: QB/Runner bewegen (WASD/Pfeiltasten) ---
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (!ball.thrown && !runner && (!controlMode || controlMode === "move")) {
        if (e.key === "ArrowUp" || e.key === "w") qb.y -= 14;
        if (e.key === "ArrowDown" || e.key === "s") qb.y += 14;
        if (e.key === "ArrowLeft" || e.key === "a") qb.x -= 14;
        if (e.key === "ArrowRight" || e.key === "d") qb.x += 14;
        qb.x = Math.max(60+qb.radius, Math.min(W-60-qb.radius, qb.x));
        qb.y = Math.max(fieldY+qb.radius, Math.min(fieldY+fieldH-qb.radius, qb.y));
        ball.x = qb.x;
        ball.y = qb.y;
    }
    // --- Runner-Steuerung: Sobald eine Taste gedrückt wird, controllingRunner aktivieren ---
    if (runner && ball.running) {
        controllingRunner = true;
        if (e.key === "ArrowUp" || e.key === "w") runner.y -= 16;
        if (e.key === "ArrowDown" || e.key === "s") runner.y += 16;
        if (e.key === "ArrowLeft" || e.key === "a") runner.x -= 16;
        if (e.key === "ArrowRight" || e.key === "d") runner.x += 16;
        runner.x = Math.max(60+runner.radius, Math.min(W-60-runner.radius, runner.x));
        runner.y = Math.max(fieldY+runner.radius, Math.min(fieldY+fieldH-runner.radius, runner.y));
        ball.x = runner.x;
        ball.y = runner.y;
    }
});

// --- Hilfsfunktionen ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0] || e.changedTouches[0];
    return {x: t.clientX - rect.left, y: t.clientY - rect.top};
}

function autoThrow() {
    let openReceivers = receivers.filter(r => !r.catched);
    if (openReceivers.length > 0) {
        passTarget = openReceivers[Math.floor(Math.random()*openReceivers.length)];
        ball.thrown = true;
        passInAir = true;
        passCatchable = false;
        passCatched = false;
        message = "";
    }
}

// --- nextDrive: Spiel nicht komplett zurücksetzen, sondern nur neuen Drive starten ---
function nextDrive() {
    if (gameOver) return;
    down = 1;
    yardsToGo = 10;
    ballOn = 25;
    driveStartX = 120;
    runner = null;
    passTarget = null;
    passInAir = false;
    passCatchable = false;
    passCatched = false;
    playOver = false;
    // Ball und QB zurücksetzen, aber Score und Zeit bleiben erhalten
    ball.x = 120;
    ball.y = H/2;
    ball.vx = 0;
    ball.vy = 0;
    ball.running = false;
    ball.thrown = false;
    qb.x = 120;
    qb.y = H/2;
    qb.alive = true;
    receivers = [
        {x: 220, y: fieldY+70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false},
        {x: 220, y: fieldY+fieldH-70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false}
    ];
    defenders = [
        {x: 420, y: fieldY+60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 420, y: fieldY+fieldH-60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 540, y: fieldY+fieldH/2-40, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 600, y: fieldY+fieldH/2+40, color: "#c00", radius: 16, state: "defender", alive: true}
    ];
    selectedReceiver = 0;
    controlMode = null;
    dragStart = null;
    message = "Ziehe nach rechts zum Werfen!";
    draw();
}

// --- nextDown: Down erhöhen, aber Spiel nicht komplett zurücksetzen ---
function nextDown() {
    let gained = Math.max(0, Math.round(((runner ? runner.x : qb.x) - driveStartX) * yardPerPx));
    yardsToGo -= gained;
    ballOn += gained;
    if (yardsToGo <= 0) {
        down = 1;
        yardsToGo = 10;
        driveStartX = (runner ? runner.x : qb.x);
        message = "First Down!";
    } else {
        down++;
        message = "";
    }
    if (down > 4) {
        playOver = true;
        message = "Turnover! Nächster Drive.";
        setTimeout(nextDrive, 1500);
        return;
    }
    // Nächster Versuch, Ball/QB zurücksetzen, aber Score und Zeit bleiben erhalten
    runner = null;
    passTarget = null;
    passInAir = false;
    passCatchable = false;
    passCatched = false;
    playOver = false;
    ball.x = qb.x;
    ball.y = qb.y;
    ball.vx = 0;
    ball.vy = 0;
    ball.running = false;
    ball.thrown = false;
    draw();
}

// --- Spielstart ---
function startGame() {
    resetGame();
    setInterval(update, 30);
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startGame);
} else {
    startGame();
}
// --- Steuerung: Route-Planung, Pass, Bewegung ---
canvas.addEventListener('mousedown', function(e) {
    if (gameOver) { resetGame(); return; }
    if (playOver) return;
    if (routePlanning) return; // Kein Wurf während Routenwahl
    const pos = getMousePos(e);
    if (routePlanning) {
        let r = receivers[planningReceiver];
        if (plannedRoutes[planningReceiver].length === 0) {
            if (Math.abs(pos.x - r.x) < 30 && Math.abs(pos.y - r.y) < 30) {
                plannedRoutes[planningReceiver].push({x: r.x, y: r.y});
                message = "Klicke Wegpunkte für Receiver " + (planningReceiver+1) + ". Rechtsklick oder Doppelklick für nächsten Receiver.";
            }
        } else {
            plannedRoutes[planningReceiver].push({x: pos.x, y: pos.y});
        }
        draw();
        return;
    }
    if (!ball.thrown && !runner && Math.abs(pos.x - qb.x) < 30 && Math.abs(pos.y - qb.y) < 30) {
        dragStart = pos;
        controlMode = "drag";
    } else {
        controlMode = "move";
    }
});
canvas.addEventListener('contextmenu', function(e) {
    if (routePlanning) {
        e.preventDefault();
        finishReceiverRoute();
    }
});
canvas.addEventListener('dblclick', function(e) {
    if (routePlanning) {
        finishReceiverRoute();
    }
});
function finishReceiverRoute() {
    if (!routePlanning) return;
    if (plannedRoutes[planningReceiver].length < 2) {
        plannedRoutes[planningReceiver] = generateRandomRoute(receivers[planningReceiver]);
    }
    routePlanned[planningReceiver] = true;
    if (planningReceiver < receivers.length - 1) {
        planningReceiver++;
        message = "Klicke Route für Receiver " + (planningReceiver+1) + " (blau)!";
    } else {
        routePlanning = false;
        if (routeTimeout) clearTimeout(routeTimeout);
        message = "Ziehe nach rechts zum Werfen!";
    }
    draw();
}
canvas.addEventListener('mousemove', function(e) {
    if (controlMode === "drag" && dragStart && !ball.thrown && !ball.running && !runner) {
        let pos = getMousePos(e);
        draw();
        ctx.save();
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(qb.x, qb.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }
});
canvas.addEventListener('mouseup', function(e) {
    if (controlMode === "drag" && dragStart && !ball.thrown && !ball.running && !runner) {
        let pos = getMousePos(e);
        let dx = pos.x - qb.x;
        let dy = pos.y - qb.y;
        if (dx > 10) {
            let best = null, bestDist = 9999;
            for (let i = 0; i < receivers.length; i++) {
                let r = receivers[i];
                if (!r.catched) {
                    let dist = Math.abs(r.x - pos.x) + Math.abs(r.y - pos.y);
                    if (dist < bestDist) {
                        best = r;
                        bestDist = dist;
                    }
                }
            }
            passTarget = best;
            ball.thrown = true;
            passInAir = true;
            passCatchable = false;
            passCatched = false;
            message = "";
        }
    }
    dragStart = null;
    controlMode = null;
});

// Tastatursteuerung: QB/Runner bewegen (WASD/Pfeiltasten)
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (!ball.thrown && !runner && (!controlMode || controlMode === "move") && !routePlanning) {
        if (e.key === "ArrowUp" || e.key === "w") qb.y -= 14;
        if (e.key === "ArrowDown" || e.key === "s") qb.y += 14;
        if (e.key === "ArrowLeft" || e.key === "a") qb.x -= 14;
        if (e.key === "ArrowRight" || e.key === "d") qb.x += 14;
        qb.x = Math.max(60+qb.radius, Math.min(W-60-qb.radius, qb.x));
        qb.y = Math.max(fieldY+qb.radius, Math.min(fieldY+fieldH-qb.radius, qb.y));
        ball.x = qb.x;
        ball.y = qb.y;
    }
    if (runner && ball.running) {
        if (e.key === "ArrowUp" || e.key === "w") runner.y -= 16;
        if (e.key === "ArrowDown" || e.key === "s") runner.y += 16;
        if (e.key === "ArrowLeft" || e.key === "a") runner.x -= 16;
        if (e.key === "ArrowRight" || e.key === "d") runner.x += 16;
        runner.x = Math.max(60+runner.radius, Math.min(W-60-runner.radius, runner.x));
        runner.y = Math.max(fieldY+runner.radius, Math.min(fieldY+fieldH-runner.radius, runner.y));
        ball.x = runner.x;
        ball.y = runner.y;
    }
});

// --- Hilfsfunktionen ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0] || e.changedTouches[0];
    return {x: t.clientX - rect.left, y: t.clientY - rect.top};
}

function autoThrow() {
    let openReceivers = receivers.filter(r => !r.catched);
    if (openReceivers.length > 0) {
        passTarget = openReceivers[Math.floor(Math.random()*openReceivers.length)];
        ball.thrown = true;
        passInAir = true;
        passCatchable = false;
        passCatched = false;
        message = "";
    }
}

// --- nextDrive: Spiel nicht komplett zurücksetzen, sondern nur neuen Drive starten ---
function nextDrive() {
    if (gameOver) return;
    down = 1;
    yardsToGo = 10;
    ballOn = 25;
    driveStartX = 120;
    runner = null;
    passTarget = null;
    passInAir = false;
    passCatchable = false;
    passCatched = false;
    playOver = false;
    // Ball und QB zurücksetzen, aber Score und Zeit bleiben erhalten
    ball.x = 120;
    ball.y = H/2;
    ball.vx = 0;
    ball.vy = 0;
    ball.running = false;
    ball.thrown = false;
    qb.x = 120;
    qb.y = H/2;
    qb.alive = true;
    receivers = [
        {x: 220, y: fieldY+70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false},
        {x: 220, y: fieldY+fieldH-70, color: "#1877c9", radius: 14, state: "receiver", alive: true, catched: false}
    ];
    defenders = [
        {x: 420, y: fieldY+60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 420, y: fieldY+fieldH-60, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 540, y: fieldY+fieldH/2-40, color: "#c00", radius: 16, state: "defender", alive: true},
        {x: 600, y: fieldY+fieldH/2+40, color: "#c00", radius: 16, state: "defender", alive: true}
    ];
    selectedReceiver = 0;
    controlMode = null;
    dragStart = null;
    message = "Ziehe nach rechts zum Werfen!";
    draw();
}

// --- nextDown: Down erhöhen, aber Spiel nicht komplett zurücksetzen ---
function nextDown() {
    let gained = Math.max(0, Math.round(((runner ? runner.x : qb.x) - driveStartX) * yardPerPx));
    yardsToGo -= gained;
    ballOn += gained;
    if (yardsToGo <= 0) {
        down = 1;
        yardsToGo = 10;
        driveStartX = (runner ? runner.x : qb.x);
        message = "First Down!";
    } else {
        down++;
        message = "";
    }
    if (down > 4) {
        playOver = true;
        message = "Turnover! Nächster Drive.";
        setTimeout(nextDrive, 1500);
        return;
    }
    // Nächster Versuch, Ball/QB zurücksetzen, aber Score und Zeit bleiben erhalten
    runner = null;
    passTarget = null;
    passInAir = false;
    passCatchable = false;
    passCatched = false;
    playOver = false;
    ball.x = qb.x;
    ball.y = qb.y;
    ball.vx = 0;
    ball.vy = 0;
    ball.running = false;
    ball.thrown = false;
    draw();
}

