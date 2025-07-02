const size = 20;
const cellSize = 20;
let snake = [{x: 10, y: 10}];
let dir = {x: 1, y: 0};
let food = {x: 5, y: 5};
let gameOver = false;
let grow = 0;
let score = 0;
let interval = null;
let showGrid = false;

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const canvas = document.createElement('canvas');
canvas.width = size * cellSize;
canvas.height = size * cellSize;
canvas.style.background = '#222';
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
gameDiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Gitterraster
    if (showGrid) {
        ctx.save();
        ctx.strokeStyle = "#333";
        ctx.globalAlpha = 0.25;
        for (let i = 1; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, size * cellSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(size * cellSize, i * cellSize);
            ctx.stroke();
        }
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
    // Apfel-Stiel
    ctx.strokeStyle = "#964B00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2 - cellSize/2 + 4);
    ctx.lineTo(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2 - cellSize/2 + 10);
    ctx.stroke();
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
    draw();
    if (interval) clearInterval(interval);
    interval = setInterval(gameLoop, 100);
}

function gameLoop() {
    if (gameOver) return;
    // Neue Position
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
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
        placeFood();
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
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    food = pos;
}

// Steuerung
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
        resetGame();
        return;
    }
    if (e.key === 'ArrowUp' && dir.y !== 1) dir = {x: 0, y: -1};
    if (e.key === 'ArrowDown' && dir.y !== -1) dir = {x: 0, y: 1};
    if (e.key === 'ArrowLeft' && dir.x !== 1) dir = {x: -1, y: 0};
    if (e.key === 'ArrowRight' && dir.x !== -1) dir = {x: 1, y: 0};
});

// Touch-Steuerung (Wischgesten)
let touchStart = null;
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

// Gitter-Button
const gridBtn = document.createElement('button');
gridBtn.innerText = 'Gitter anzeigen';
gridBtn.style.marginTop = '10px';
gridBtn.style.marginRight = '10px';
gridBtn.style.padding = '10px 24px';
gridBtn.style.fontSize = '1.1em';
gridBtn.style.borderRadius = '8px';
gridBtn.style.background = '#ffe066';
gridBtn.style.border = '1px solid #888';
gridBtn.style.cursor = 'pointer';
gridBtn.onclick = function() {
    showGrid = !showGrid;
    gridBtn.innerText = showGrid ? 'Gitter ausblenden' : 'Gitter anzeigen';
    draw();
};
gameDiv.appendChild(gridBtn);

// Neustart-Button
const restartBtn = document.createElement('button');
restartBtn.innerText = 'Neustart';
restartBtn.style.marginTop = '10px';
restartBtn.style.padding = '10px 24px';
restartBtn.style.fontSize = '1.1em';
restartBtn.style.borderRadius = '8px';
restartBtn.style.background = '#ffe066';
restartBtn.style.border = '1px solid #888';
restartBtn.style.cursor = 'pointer';
restartBtn.onclick = resetGame;
gameDiv.appendChild(restartBtn);

resetGame();
