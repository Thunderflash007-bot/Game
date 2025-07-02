const W = 800, H = 440;
const ground = H - 60;
const player = {x: 120, y: ground, hp: 100, alive: true, color: "#1877c9"};
const enemy = {x: W-120, y: ground, hp: 100, alive: true, color: "#c00"};
let arrows = [];
let sheep = [];
let turn = "player";
let aiming = false;
let aimStart = null;
let gameOver = false;
let feedback = "";
let feedbackTimer = 0;

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
canvas.style.background = 'linear-gradient(180deg,#e0eafc 0%,#b3d1f7 80%)';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.borderRadius = '18px';
canvas.style.boxShadow = '0 0 16px #bbb';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

// --- Zeichnen ---
function draw() {
    ctx.clearRect(0,0,W,H);
    // Himmel
    let grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,"#e0eafc");
    grad.addColorStop(1,"#b3d1f7");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    // Boden
    ctx.save();
    ctx.fillStyle = "#8bc34a";
    ctx.shadowColor = "#6a9e3a";
    ctx.shadowBlur = 18;
    ctx.fillRect(0, ground, W, H-ground);
    ctx.restore();

    // Schafe
    for (let s of sheep) drawSheep(s);

    // Spieler & Gegner
    drawRagdoll(player, "#1877c9");
    drawRagdoll(enemy, "#c00");

    // Lebensbalken
    drawHP(player.x-50, player.y-110, player.hp, "#1877c9");
    drawHP(enemy.x-50, enemy.y-110, enemy.hp, "#c00");

    // Pfeile
    for (let a of arrows) drawArrow(a);

    // Zielhilfe (nur Spieler)
    if (aiming && aimStart) {
        ctx.save();
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 3;
        ctx.setLineDash([8,8]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y-60);
        ctx.lineTo(aimStart.x, aimStart.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Feedback (Treffer etc.)
    if (feedback && feedbackTimer > 0) {
        ctx.save();
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#ffe066";
        ctx.textAlign = "center";
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 8;
        ctx.fillText(feedback, W/2, 60);
        ctx.restore();
    }

    // Game Over
    if (gameOver) {
        ctx.save();
        ctx.font = "bold 38px Arial";
        ctx.fillStyle = "#222";
        ctx.textAlign = "center";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.fillText(
            player.hp <= 0 ? "Verloren!" : "Gewonnen!",
            W/2, H/2
        );
        ctx.font = "22px Arial";
        ctx.shadowBlur = 0;
        ctx.fillText("Neustart mit Klick oder Leertaste", W/2, H/2+40);
        ctx.restore();
    }
}

function drawRagdoll(obj, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    // Kopf
    ctx.beginPath();
    ctx.arc(obj.x, obj.y-60, 22, 0, 2*Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    // Körper (für Hitbox: x-15,y-38 bis x+15,y+28)
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y-38);
    ctx.lineTo(obj.x, obj.y-4);
    ctx.stroke();
    // Arme
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y-30);
    ctx.lineTo(obj.x-22, obj.y-10);
    ctx.moveTo(obj.x, obj.y-30);
    ctx.lineTo(obj.x+22, obj.y-10);
    ctx.stroke();
    // Beine
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y-4);
    ctx.lineTo(obj.x-16, obj.y+28);
    ctx.moveTo(obj.x, obj.y-4);
    ctx.lineTo(obj.x+16, obj.y+28);
    ctx.stroke();
    // X-Augen bei Tod
    if (!obj.alive) {
        ctx.save();
        ctx.strokeStyle = "#c00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.x-10, obj.y-68); ctx.lineTo(obj.x-4, obj.y-56);
        ctx.moveTo(obj.x-4, obj.y-68); ctx.lineTo(obj.x-10, obj.y-56);
        ctx.moveTo(obj.x+4, obj.y-68); ctx.lineTo(obj.x+10, obj.y-56);
        ctx.moveTo(obj.x+10, obj.y-68); ctx.lineTo(obj.x+4, obj.y-56);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function drawSheep(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    // Körper
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 16, 0, 0, 2*Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#bbb";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Kopf
    ctx.beginPath();
    ctx.ellipse(20, -7, 9, 11, 0, 0, 2*Math.PI);
    ctx.fillStyle = "#888";
    ctx.fill();
    // Auge
    ctx.beginPath();
    ctx.arc(24, -10, 2, 0, 2*Math.PI);
    ctx.fillStyle = "#222";
    ctx.fill();
    // Beine
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 3;
    for (let i = -12; i <= 12; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 12);
        ctx.lineTo(i, 22 + Math.sin(Date.now()/200 + s.x/30 + i)*2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawArrow(a) {
    ctx.save();
    ctx.strokeStyle = "#964B00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x - a.vx*2, a.y - a.vy*2);
    ctx.stroke();
    // Pfeilspitze
    ctx.beginPath();
    ctx.arc(a.x, a.y, 4, 0, 2*Math.PI);
    ctx.fillStyle = "#964B00";
    ctx.fill();
    ctx.restore();
}

function drawHP(x, y, hp, color) {
    ctx.save();
    ctx.strokeStyle = "#222";
    ctx.strokeRect(x, y, 100, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, hp/100*100), 14);
    ctx.restore();
}

// --- Logik ---
function shootArrow(from, angle, power, isPlayer) {
    const speed = Math.max(10, Math.min(40, power));
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    arrows.push({
        x: from.x,
        y: from.y-60,
        vx, vy,
        gravity: 0.55,
        isPlayer,
        stuck: false,
        hit: false,
        stuckIn: null // "player", "enemy", "sheep"
    });
}

function update() {
    if (gameOver) return;
    // Pfeile bewegen
    for (let a of arrows) {
        if (!a.stuck) {
            a.x += a.vx;
            a.y += a.vy;
            a.vy += a.gravity;
        }
    }
    // Schafe bewegen
    for (let s of sheep) {
        s.x += s.dir * 1.2;
        if (s.x < 40) { s.x = 40; s.dir = 1; }
        if (s.x > W-40) { s.x = W-40; s.dir = -1; }
    }
    // Kollisionen prüfen
    for (let a of arrows) {
        if (!a.hit && !a.stuck) {
            // Spieler trifft Gegner (Körperrechteck)
            if (
                a.isPlayer && enemy.alive &&
                rectHit(a.x, a.y, enemy.x-15, enemy.y-38, 30, 66)
            ) {
                let dmg = Math.floor(Math.random()*16+25);
                enemy.hp -= dmg;
                feedback = "Treffer!";
                feedbackTimer = 40;
                a.hit = true;
                a.stuck = true;
                a.stuckIn = "enemy";
                a.vx = 0; a.vy = 0;
                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemy.alive = false;
                    gameOver = true;
                    feedback = "Du hast gewonnen!";
                }
            }
            // Gegner trifft Spieler (Körperrechteck)
            if (
                !a.isPlayer && player.alive &&
                rectHit(a.x, a.y, player.x-15, player.y-38, 30, 66)
            ) {
                let dmg = Math.floor(Math.random()*16+25);
                player.hp -= dmg;
                feedback = "Getroffen!";
                feedbackTimer = 40;
                a.hit = true;
                a.stuck = true;
                a.stuckIn = "player";
                a.vx = 0; a.vy = 0;
                if (player.hp <= 0) {
                    player.hp = 0;
                    player.alive = false;
                    gameOver = true;
                    feedback = "Du hast verloren!";
                }
            }
            // Pfeil trifft Schaf
            for (let s of sheep) {
                if (!s.dead && dist(a.x, a.y, s.x, s.y) < 22 && a.y < ground) {
                    s.dead = true;
                    a.hit = true;
                    a.stuck = true;
                    a.stuckIn = "sheep";
                    a.vx = 0; a.vy = 0;
                    feedback = "Schaf getroffen!";
                    feedbackTimer = 30;
                }
            }
            // Pfeil trifft anderen Pfeil (Hitbox: 8x8 um Spitze)
            for (let b of arrows) {
                if (b !== a && b.stuck && !b.hit && Math.abs(a.x - b.x) < 8 && Math.abs(a.y - b.y) < 8) {
                    a.stuck = true;
                    a.hit = true;
                    a.vx = 0; a.vy = 0;
                }
            }
        }
        // Pfeil bleibt im Boden stecken, falls nicht schon im Körper/Schaf
        if (!a.stuck && a.y > ground-6) {
            a.y = ground-6;
            a.vx = 0;
            a.vy = 0;
            a.stuck = true;
        }
    }
    // Entferne tote Schafe
    sheep = sheep.filter(s => !s.dead);

    // Pfeile entfernen, die außerhalb sind
    arrows = arrows.filter(a =>
        a.x > -20 && a.x < W+20 && a.y < H+20 && a.y > -20
    );

    // Feedback-Timer
    if (feedbackTimer > 0) feedbackTimer--;
    else feedback = "";

    // Gegner schießt, wenn dran und keine Pfeile in der Luft
    if (turn === "enemy" && !gameOver && arrows.filter(a => !a.isPlayer && !a.stuck && !a.hit).length === 0) {
        setTimeout(enemyShoot, 700);
        turn = "wait";
    }
    draw();
}

function rectHit(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx+rw && y >= ry && y <= ry+rh;
}

// --- Steuerung Spieler ---
canvas.addEventListener('mousedown', function(e) {
    if (gameOver || turn !== "player") return;
    aiming = true;
    aimStart = getMousePos(e);
});
canvas.addEventListener('mousemove', function(e) {
    if (!aiming) return;
    aimStart = getMousePos(e);
    draw();
});
canvas.addEventListener('mouseup', function(e) {
    if (!aiming) return;
    aiming = false;
    const pos = getMousePos(e);
    const dx = pos.x - player.x;
    const dy = pos.y - (player.y-60);
    const dist = Math.min(140, Math.sqrt(dx*dx + dy*dy));
    const angle = Math.atan2(dy, dx);
    shootArrow(player, angle, dist/3, true);
    turn = "enemy";
    draw();
});
canvas.addEventListener('mouseleave', function() {
    aiming = false;
    aimStart = null;
    draw();
});

// Touch-Steuerung
canvas.addEventListener('touchstart', function(e) {
    if (gameOver || turn !== "player") return;
    e.preventDefault();
    aiming = true;
    aimStart = getTouchPos(e);
}, {passive:false});
canvas.addEventListener('touchmove', function(e) {
    if (!aiming) return;
    e.preventDefault();
    aimStart = getTouchPos(e);
    draw();
}, {passive:false});
canvas.addEventListener('touchend', function(e) {
    if (!aiming) return;
    e.preventDefault();
    aiming = false;
    const pos = getTouchPos(e);
    const dx = pos.x - player.x;
    const dy = pos.y - (player.y-60);
    const distVal = Math.min(140, Math.sqrt(dx*dx + dy*dy));
    const angle = Math.atan2(dy, dx);
    shootArrow(player, angle, distVal/3, true);
    turn = "enemy";
    draw();
}, {passive:false});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0] || e.changedTouches[0];
    return {x: t.clientX - rect.left, y: t.clientY - rect.top};
}

// --- Schaf-Button ---
const sheepBtn = document.createElement('button');
sheepBtn.innerText = 'Schaf hinzufügen';
sheepBtn.style.margin = '10px';
sheepBtn.style.padding = '10px 30px';
sheepBtn.style.fontSize = '1.2em';
sheepBtn.style.background = 'linear-gradient(90deg,#fffbe6,#b3d1f7)';
sheepBtn.style.border = 'none';
sheepBtn.style.borderRadius = '20px';
sheepBtn.style.boxShadow = '0 2px 8px #bbb';
sheepBtn.style.cursor = 'pointer';
sheepBtn.onclick = function() {
    sheep.push({
        x: Math.random() * (W-160) + 80,
        y: ground-10,
        dir: Math.random() > 0.5 ? 1 : -1,
        dead: false
    });
};
gameDiv.appendChild(sheepBtn);

// --- Gegner-KI ---
function enemyShoot() {
    // Gegner zielt mit leichter Ungenauigkeit auf Spieler
    const dx = player.x - enemy.x + (Math.random()-0.5)*40;
    const dy = (player.y-60) - (enemy.y-60) + (Math.random()-0.5)*40;
    const distVal = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    shootArrow(enemy, angle, distVal/3 + Math.random()*6, false);
    turn = "player";
}

// --- Neustart ---
function resetGame() {
    player.hp = 100; player.alive = true;
    enemy.hp = 100; enemy.alive = true;
    arrows = [];
    sheep = [];
    turn = "player";
    gameOver = false;
    feedback = "";
    feedbackTimer = 0;
    draw();
}

canvas.addEventListener('click', function() {
    if (gameOver) resetGame();
});

draw();
setInterval(update, 30);


// --- Neustart ---
function resetGame() {
    player.hp = 100; player.alive = true; player.y = ground; player.vy = 0; player.jumping = false;
    enemy.hp = 100; enemy.alive = true; enemy.y = ground; enemy.vy = 0; enemy.jumping = false;
    arrows = [];
    sheep = [];
    turn = "player";
    gameOver = false;
    feedback = "";
    feedbackTimer = 0;
    draw();
}

canvas.addEventListener('click', function() {
    if (gameOver) resetGame();
});

draw();
setInterval(update, 30);
