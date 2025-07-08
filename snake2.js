document.getElementById('game').innerText = 'Hier kommt Snake II hin.';

const size = 20;
const cellSize = 20;
let snake = [{x: 10, y: 10}];
let dir = {x: 1, y: 0};
let food = {x: 5, y: 5};
let gameOver = false;
let grow = 0;
let score = 0;
let interval = null;
let speed = 80;
let portals = [
    {x: 2, y: 2, color: "#b366ff"},
    {x: 17, y: 17, color: "#66b3ff"}
];

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = size * cellSize;
canvas.height = size * cellSize;
canvas.style.background = '#181c2b';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Portale
    for (let p of portals) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2, cellSize/2-2, 0, 2*Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
        ctx.save();
        ctx.shadowColor = i === 0 ? "#ffe066" : "#2ad";
        ctx.shadowBlur = i === 0 ? 16 : 8;
        let grad = ctx.createRadialGradient(
            snake[i].x * cellSize + cellSize/2, snake[i].y * cellSize + cellSize/2, cellSize/8,
            snake[i].x * cellSize + cellSize/2, snake[i].y * cellSize + cellSize/2, cellSize/2
        );
        if (i === 0) {
            grad.addColorStop(0, "#ffe066");
            grad.addColorStop(1, "#bfa600");
        } else {
            grad.addColorStop(0, "#4dd");
            grad.addColorStop(1, "#188");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
            snake[i].x * cellSize + cellSize/2,
            snake[i].y * cellSize + cellSize/2,
            cellSize/2 - 2, 0, 2*Math.PI
        );
        ctx.fill();
        ctx.restore();
    }
    // Food (Apfel)
    ctx.save();
    ctx.shadowColor = "#ff4d4d";
    ctx.shadowBlur = 12;
    let grad = ctx.createRadialGradient(
        food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2, cellSize/8,
        food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2, cellSize/2-2
    );
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.3, "#ffb3b3");
    grad.addColorStop(1, "#ff4d4d");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2, cellSize/2-2, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
    // Score
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Punkte: ' + score, canvas.width/2, 28);
    ctx.textAlign = 'left';
    ctx.restore();
    // Game Over
    if (gameOver) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
        ctx.restore();
    }
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    dir = {x: 1, y: 0};
    food = {x: Math.floor(Math.random()*size), y: Math.floor(Math.random()*size)};
    gameOver = false;
    grow = 0;
    score = 0;
    speed = 80;
    draw();
    if (interval) clearInterval(interval);
    interval = setInterval(gameLoop, speed);
}

function gameLoop() {
    if (gameOver) return;
    // Neue Position
    let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    // Portale
    for (let i = 0; i < portals.length; i++) {
        let p = portals[i];
        if (head.x === p.x && head.y === p.y) {
            let other = portals[(i+1)%2];
            head = {x: other.x, y: other.y};
        }
    }
    // Kollision
    if (
        head.x < 0 || head.x >= size ||
        head.y < 0 || head.y >= size ||
        snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        gameOver = true;
        draw();
        clearInterval(interval);
        return;
    }
    snake.unshift(head);
    // Fressen
    if (head.x === food.x && head.y === food.y) {
        grow += 1;
        score += 1;
        speed = Math.max(40, speed - 2);
        placeFood();
        clearInterval(interval);
        interval = setInterval(gameLoop, speed);
    }
    if (grow > 0) {
        grow--;
    } else {
        snake.pop();
    }
    draw();
}

function placeFood() {
    let pos;
    do {
        pos = {x: Math.floor(Math.random()*size), y: Math.floor(Math.random()*size)};
    } while (
        snake.some(seg => seg.x === pos.x && seg.y === pos.y) ||
        portals.some(p => p.x === pos.x && p.y === pos.y)
    );
    food = pos;
}

// Verbesserte Logik: Touch, Tastatur, Animation, Reset
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
        resetGame();
        return;
    }
    if (e.key === 'ArrowUp' && dir.y !== 1) dir = {x: 0, y: -1};
    if (e.key === 'ArrowDown' && dir.y !== -1) dir = {x: 0, y: 1};
    if (e.key === 'ArrowLeft' && dir.x !== 1) dir = {x: -1, y: 0};
    if (e.key === 'ArrowRight' && dir.x !== -1) dir = {x: 1, y: 0};
    if (e.key === 'w' && dir.y !== 1) dir = {x: 0, y: -1};
    if (e.key === 's' && dir.y !== -1) dir = {x: 0, y: 1};
    if (e.key === 'a' && dir.x !== 1) dir = {x: -1, y: 0};
    if (e.key === 'd' && dir.x !== -1) dir = {x: 1, y: 0};
});
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const t = e.touches[0];
    touchStart = {x: t.clientX, y: t.clientY};
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && dir.x !== -1) dir = {x: 1, y: 0};
        if (dx < -20 && dir.x !== 1) dir = {x: -1, y: 0};
    } else {
        if (dy > 20 && dir.y !== -1) dir = {x: 0, y: 1};
        if (dy < -20 && dir.y !== 1) dir = {x: 0, y: -1};
    }
    touchStart = null;
}, {passive: false});

resetGame();
 {passive: false};

resetGame();
