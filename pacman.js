// --- Pacman Classic Style ---
const tileSize = 24;
const rows = 21, cols = 19;
const level = [
    "###################",
    "#........#........#",
    "#.###.###.#.###.###",
    "#o###.###.#.###.###",
    "#.................#",
    "#.###.#.#####.#.###",
    "#.....#...#...#...#",
    "#####.### # ###.###",
    "    #.#   #.#     ",
    "#####.# #####.#.###",
    "#.........#.......#",
    "#.###.#####.###.###",
    "#o..#.......#....o#",
    "###.#.#####.#.#####",
    "#........#........#",
    "#.###.###.#.###.###",
    "#o..#.....P....o..#",
    "###.#.#####.#.#####",
    "#.................#",
    "###################"
];
let map = level.map(row => row.split(""));
let pac = {
    x: 9 * tileSize + tileSize/2,
    y: 16 * tileSize + tileSize/2,
    dir: {x: 0, y: 0},
    nextDir: {x: 0, y: 0},
    speed: 2,
    mouth: 0,
    mouthDir: 1,
    alive: true
};
let ghosts = [
    {x: 9*tileSize+tileSize/2, y: 8*tileSize+tileSize/2, dir: {x:1,y:0}, color:"#ff4d4d", scatter:false, home:{x:9,y:8}, name:"blinky"},
    {x: 8*tileSize+tileSize/2, y: 10*tileSize+tileSize/2, dir: {x:1,y:0}, color:"#ffb8ff", scatter:false, home:{x:8,y:10}, name:"pinky"},
    {x: 9*tileSize+tileSize/2, y: 10*tileSize+tileSize/2, dir: {x:-1,y:0}, color:"#4dd", scatter:false, home:{x:9,y:10}, name:"inky"},
    {x:10*tileSize+tileSize/2, y: 10*tileSize+tileSize/2, dir: {x:0,y:1}, color:"#ffa500", scatter:false, home:{x:10,y:10}, name:"clyde"}
];
let score = 0, lives = 3, gameOver = false, win = false, dots = 0, powerTimer = 0;
const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = cols * tileSize;
canvas.height = rows * tileSize + 48;
canvas.style.background = '#000';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.borderRadius = '18px';
canvas.style.boxShadow = '0 0 16px #bbb';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resetGame() {
    map = level.map(row => row.split(""));
    pac.x = 9 * tileSize + tileSize/2;
    pac.y = 16 * tileSize + tileSize/2;
    pac.dir = {x: 0, y: 0};
    pac.nextDir = {x: 0, y: 0};
    pac.alive = true;
    ghosts[0].x = 9*tileSize+tileSize/2; ghosts[0].y = 8*tileSize+tileSize/2; ghosts[0].dir = {x:1,y:0};
    ghosts[1].x = 8*tileSize+tileSize/2; ghosts[1].y = 10*tileSize+tileSize/2; ghosts[1].dir = {x:1,y:0};
    ghosts[2].x = 9*tileSize+tileSize/2; ghosts[2].y = 10*tileSize+tileSize/2; ghosts[2].dir = {x:-1,y:0};
    ghosts[3].x =10*tileSize+tileSize/2; ghosts[3].y = 10*tileSize+tileSize/2; ghosts[3].dir = {x:0,y:1};
    ghosts.forEach(g=>g.scatter=false);
    score = 0;
    lives = 3;
    gameOver = false;
    win = false;
    powerTimer = 0;
    countDots();
    draw();
}

function countDots() {
    dots = 0;
    for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
            if ([".", "o"].includes(map[y][x])) dots++;
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Spielfeld
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let t = map[y][x];
            // Wand
            if (t === "#") {
                ctx.fillStyle = "#1877c9";
                ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.strokeRect(x*tileSize, y*tileSize, tileSize, tileSize);
            }
            // Punkt
            if (t === ".") {
                ctx.fillStyle = "#ffe066";
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2, 3, 0, 2*Math.PI);
                ctx.fill();
            }
            // Power-Punkt
            if (t === "o") {
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2, y*tileSize+tileSize/2, 7, 0, 2*Math.PI);
                ctx.fill();
            }
        }
    }
    // Pacman
    if (pac.alive) {
        ctx.save();
        ctx.translate(pac.x, pac.y);
        let angle = Math.atan2(pac.dir.y, pac.dir.x);
        if (pac.dir.x === 0 && pac.dir.y === 0) angle = 0;
        ctx.rotate(angle);
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        let mouthOpen = 0.18 + 0.18 * pac.mouth;
        ctx.moveTo(0,0);
        ctx.arc(0,0, tileSize/2-2, mouthOpen, 2*Math.PI-mouthOpen, false);
        ctx.lineTo(0,0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    // Geister
    for (let g of ghosts) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.fillStyle = (powerTimer > 0 && g.scatter) ? "#4dd" : g.color;
        ctx.beginPath();
        ctx.arc(0,0, tileSize/2-2, Math.PI, 0, false);
        ctx.lineTo(tileSize/2-2, tileSize/2-4);
        for(let i=0;i<4;i++) {
            ctx.quadraticCurveTo(
                tileSize/2-2-(i*tileSize/4), tileSize/2-2+(i%2?4:-4),
                tileSize/2-2-(i+1)*tileSize/4, tileSize/2-4
            );
        }
        ctx.closePath();
        ctx.fill();
        // Augen
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6,-4,4,0,2*Math.PI); ctx.arc(6,-4,4,0,2*Math.PI);
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(-6,-4,2,0,2*Math.PI); ctx.arc(6,-4,2,0,2*Math.PI);
        ctx.fill();
        ctx.restore();
    }
    // Score & Leben
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Punkte: "+score, 12, canvas.height-18);
    ctx.fillText("Leben: "+lives, 160, canvas.height-18);
    ctx.restore();

    // Game Over / Win
    if (gameOver || win) {
        ctx.save();
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = win ? "#ffe066" : "#ff4d4d";
        ctx.textAlign = "center";
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 8;
        ctx.fillText(win ? "Gewonnen!" : "Game Over", canvas.width/2, canvas.height/2);
        ctx.font = "20px Arial";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.fillText("Neustart mit Enter", canvas.width/2, canvas.height/2+40);
        ctx.restore();
    }
}

function canMove(x, y) {
    let tx = Math.floor(x/tileSize), ty = Math.floor(y/tileSize);
    if (tx < 0) tx = cols-1;
    if (tx >= cols) tx = 0;
    if (ty < 0 || ty >= rows) return false;
    return map[ty][tx] !== "#";
}

function updatePacman() {
    // Richtung wechseln, wenn möglich
    let nx = pac.x + pac.nextDir.x * pac.speed;
    let ny = pac.y + pac.nextDir.y * pac.speed;
    if (canMove(nx, ny)) {
        pac.dir = {...pac.nextDir};
    }
    // Bewegung
    let px = pac.x + pac.dir.x * pac.speed;
    let py = pac.y + pac.dir.y * pac.speed;
    if (canMove(px, py)) {
        pac.x = px;
        pac.y = py;
    }
    // Wrap-around
    if (pac.x < 0) pac.x = cols*tileSize-tileSize/2;
    if (pac.x > cols*tileSize) pac.x = tileSize/2;
    // Punkt essen
    let tx = Math.floor(pac.x/tileSize), ty = Math.floor(pac.y/tileSize);
    let t = map[ty][tx];
    if (t === "." || t === "o") {
        score += t === "." ? 10 : 50;
        map[ty][tx] = " ";
        countDots();
        if (t === "o") {
            powerTimer = 300;
            ghosts.forEach(g=>g.scatter=true);
        }
        if (dots === 0) {
            win = true;
            gameOver = true;
        }
    }
    // Mundanimation
    pac.mouth += pac.mouthDir * 0.12;
    if (pac.mouth > 1) { pac.mouth = 1; pac.mouthDir = -1; }
    if (pac.mouth < 0) { pac.mouth = 0; pac.mouthDir = 1; }
}

function updateGhosts() {
    for (let g of ghosts) {
        // KI: Wenn Power, flüchte, sonst gehe auf Pacman zu
        let dirs = [
            {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}
        ];
        let best = g.dir, minDist = 99999, maxDist = -1;
        let valid = dirs.filter(d => {
            let nx = g.x + d.x*tileSize/2, ny = g.y + d.y*tileSize/2;
            let tx = Math.floor(nx/tileSize), ty = Math.floor(ny/tileSize);
            if (tx < 0) tx = cols-1;
            if (tx >= cols) tx = 0;
            if (ty < 0 || ty >= rows) return false;
            if (map[ty][tx] === "#") return false;
            // nicht rückwärts
            if (g.dir.x === -d.x && g.dir.y === -d.y) return false;
            return true;
        });
        if (powerTimer > 0 && g.scatter) {
            // Flüchte
            for (let d of valid) {
                let dx = (g.x + d.x*tileSize/2) - pac.x;
                let dy = (g.y + d.y*tileSize/2) - pac.y;
                let dist = dx*dx + dy*dy;
                if (dist > maxDist) { maxDist = dist; best = d; }
            }
        } else {
            // Jage Pacman
            for (let d of valid) {
                let dx = (g.x + d.x*tileSize/2) - pac.x;
                let dy = (g.y + d.y*tileSize/2) - pac.y;
                let dist = dx*dx + dy*dy;
                if (dist < minDist) { minDist = dist; best = d; }
            }
        }
        if (valid.length > 0) g.dir = best;
        g.x += g.dir.x * 2;
        g.y += g.dir.y * 2;
        // Wrap-around
        if (g.x < 0) g.x = cols*tileSize-tileSize/2;
        if (g.x > cols*tileSize) g.x = tileSize/2;
        // Kollision mit Pacman
        let dx = g.x - pac.x, dy = g.y - pac.y;
        if (Math.abs(dx) < tileSize/2 && Math.abs(dy) < tileSize/2 && pac.alive && !gameOver) {
            if (powerTimer > 0 && g.scatter) {
                score += 200;
                g.x = g.home.x*tileSize+tileSize/2;
                g.y = g.home.y*tileSize+tileSize/2;
                g.dir = {x:1,y:0};
                g.scatter = false;
            } else {
                lives--;
                if (lives <= 0) {
                    pac.alive = false;
                    gameOver = true;
                } else {
                    // Respawn
                    pac.x = 9 * tileSize + tileSize/2;
                    pac.y = 16 * tileSize + tileSize/2;
                    pac.dir = {x: 0, y: 0};
                    pac.nextDir = {x: 0, y: 0};
                    ghosts[0].x = 9*tileSize+tileSize/2; ghosts[0].y = 8*tileSize+tileSize/2; ghosts[0].dir = {x:1,y:0};
                    ghosts[1].x = 8*tileSize+tileSize/2; ghosts[1].y = 10*tileSize+tileSize/2; ghosts[1].dir = {x:1,y:0};
                    ghosts[2].x = 9*tileSize+tileSize/2; ghosts[2].y = 10*tileSize+tileSize/2; ghosts[2].dir = {x:-1,y:0};
                    ghosts[3].x =10*tileSize+tileSize/2; ghosts[3].y = 10*tileSize+tileSize/2; ghosts[3].dir = {x:0,y:1};
                    ghosts.forEach(g=>g.scatter=false);
                }
            }
        }
    }
    if (powerTimer > 0) powerTimer--;
}

function gameLoop() {
    if (!gameOver && !win) {
        updatePacman();
        updateGhosts();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', function(e) {
    if (gameOver || win) {
        if (e.key === "Enter") resetGame();
        return;
    }
    if (e.key === "ArrowLeft") pac.nextDir = {x:-1, y:0};
    if (e.key === "ArrowRight") pac.nextDir = {x:1, y:0};
    if (e.key === "ArrowUp") pac.nextDir = {x:0, y:-1};
    if (e.key === "ArrowDown") pac.nextDir = {x:0, y:1};
});

// Touch-Steuerung (Wischgesten)
let touchStart = null;
canvas.addEventListener('touchstart', function(e) {
    const t = e.touches[0];
    touchStart = {x: t.clientX, y: t.clientY};
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) pac.nextDir = {x: 1, y: 0};
        if (dx < -20) pac.nextDir = {x: -1, y: 0};
    } else {
        if (dy > 20) pac.nextDir = {x: 0, y: 1};
        if (dy < -20) pac.nextDir = {x: 0, y: -1};
    }
    touchStart = null;
}, {passive: false});

resetGame();
gameLoop();
