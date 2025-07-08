// Verbesserte & moderne Tetris-Logik mit Touch- und Tastatursteuerung

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const rows = 22, cols = 10, cell = 32;
const shapes = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];
const colors = ["#4dd","#ffe066","#b366ff","#ff6666","#66b3ff","#ffb366","#388e3c"];
let board, curShape, curColor, curX, curY, nextShape, nextColor, interval, gameOver, score, lines, dropTimer, dropDelay, holdShape, holdColor, canHold, paused;

function resetGame() {
    board = Array.from({length: rows}, () => Array(cols).fill(0));
    curShape = null; curColor = 0; curX = 0; curY = 0;
    nextShape = null; nextColor = 0;
    holdShape = null; holdColor = 0; canHold = true;
    gameOver = false; score = 0; lines = 0; paused = false;
    dropDelay = 500; dropTimer = 0;
    spawn();
    draw();
    if (interval) clearInterval(interval);
    interval = setInterval(gameLoop, 20);
}

function randomShape() {
    const idx = Math.floor(Math.random()*shapes.length);
    return {shape: shapes[idx].map(row=>row.slice()), color: idx};
}

function spawn() {
    if (!nextShape) {
        let {shape, color} = randomShape();
        curShape = shape; curColor = color;
    } else {
        curShape = nextShape; curColor = nextColor;
    }
    let n = randomShape();
    nextShape = n.shape; nextColor = n.color;
    curX = Math.floor(cols/2) - Math.floor(curShape[0].length/2);
    curY = 0;
    canHold = true;
    if (!canMove(curShape, curX, curY)) {
        gameOver = true;
        clearInterval(interval);
    }
}

function canMove(shape, x, y) {
    for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[0].length; c++)
            if (shape[r][c]) {
                let nx = x + c, ny = y + r;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || board[ny][nx]) return false;
            }
    return true;
}

function merge() {
    for (let r = 0; r < curShape.length; r++)
        for (let c = 0; c < curShape[0].length; c++)
            if (curShape[r][c]) board[curY+r][curX+c] = curColor+1;
}

function clearLines() {
    let cleared = 0;
    for (let r = rows-1; r >= 0; r--) {
        if (board[r].every(x => x)) {
            board.splice(r,1);
            board.unshift(Array(cols).fill(0));
            cleared++;
            r++;
        }
    }
    if (cleared) {
        score += [0,100,300,500,800][cleared];
        lines += cleared;
        dropDelay = Math.max(80, 500 - Math.floor(lines/10)*40);
    }
}

function draw() {
    gameDiv.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = cols * cell + 160;
    canvas.height = rows * cell;
    canvas.style.background = '#181c2b';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '18px';
    canvas.style.boxShadow = '0 0 16px #bbb';
    gameDiv.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    // Board
    for (let r = 2; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            ctx.save();
            ctx.fillStyle = board[r][c] ? colors[board[r][c]-1] : '#232946';
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.fillRect(c*cell, (r-2)*cell, cell, cell);
            ctx.strokeRect(c*cell, (r-2)*cell, cell, cell);
            ctx.restore();
        }
    // Current
    if (!gameOver) {
        for (let r = 0; r < curShape.length; r++)
            for (let c = 0; c < curShape[0].length; c++)
                if (curShape[r][c]) {
                    ctx.save();
                    ctx.fillStyle = colors[curColor];
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.fillRect((curX+c)*cell, (curY+r-2)*cell, cell, cell);
                    ctx.strokeRect((curX+c)*cell, (curY+r-2)*cell, cell, cell);
                    ctx.restore();
                }
        // Ghost Piece
        let ghostY = curY;
        while (canMove(curShape, curX, ghostY+1)) ghostY++;
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let r = 0; r < curShape.length; r++)
            for (let c = 0; c < curShape[0].length; c++)
                if (curShape[r][c])
                    ctx.fillRect((curX+c)*cell, (ghostY+r-2)*cell, cell, cell);
        ctx.restore();
    }
    // Next
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Nächstes:', cols*cell+20, 40);
    for (let r = 0; r < nextShape.length; r++)
        for (let c = 0; c < nextShape[0].length; c++)
            if (nextShape[r][c]) {
                ctx.fillStyle = colors[nextColor];
                ctx.fillRect(cols*cell+20+c*cell, 60+r*cell, cell, cell);
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(cols*cell+20+c*cell, 60+r*cell, cell, cell);
            }
    ctx.restore();
    // Hold
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Hold:', cols*cell+20, 180);
    if (holdShape) {
        for (let r = 0; r < holdShape.length; r++)
            for (let c = 0; c < holdShape[0].length; c++)
                if (holdShape[r][c]) {
                    ctx.fillStyle = colors[holdColor];
                    ctx.fillRect(cols*cell+20+c*cell, 200+r*cell, cell, cell);
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(cols*cell+20+c*cell, 200+r*cell, cell, cell);
                }
    }
    ctx.restore();
    // Score
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffe066';
    ctx.fillText('Punkte: '+score, cols*cell+20, 320);
    ctx.fillText('Linien: '+lines, cols*cell+20, 350);
    ctx.restore();
    // Game Over
    if (gameOver) {
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ff4d4d';
        ctx.textAlign = 'center';
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 10;
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
        ctx.restore();
    }
    // Pause
    if (paused && !gameOver) {
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffe066';
        ctx.textAlign = 'center';
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 8;
        ctx.fillText('Pause', canvas.width/2, canvas.height/2);
        ctx.restore();
    }

    // Reset-Button
    const resetBtn = document.createElement('button');
    resetBtn.innerText = 'Neustart';
    resetBtn.onclick = resetGame;
    resetBtn.style.marginTop = '10px';
    resetBtn.style.padding = '8px 24px';
    resetBtn.style.fontSize = '1.1em';
    resetBtn.style.borderRadius = '8px';
    resetBtn.style.background = '#ffe066';
    resetBtn.style.border = '1px solid #1877c9';
    resetBtn.style.cursor = 'pointer';
    gameDiv.appendChild(resetBtn);

    // --- Steuerungs-Knöpfe (rechts neben dem Spielfeld) ---
    let controlsDiv = document.getElementById('tetris-controls');
    if (!controlsDiv) {
        controlsDiv = document.createElement('div');
        controlsDiv.id = 'tetris-controls';
        controlsDiv.style.position = 'fixed';
        controlsDiv.style.top = '80px';
        controlsDiv.style.right = '30px';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.flexDirection = 'column';
        controlsDiv.style.gap = '16px';
        controlsDiv.style.userSelect = 'none';
        controlsDiv.style.touchAction = 'none';
        controlsDiv.style.zIndex = 10;

        // Links
        const leftBtn = document.createElement('button');
        leftBtn.innerText = '← Links';
        leftBtn.style.width = '110px';
        leftBtn.style.height = '48px';
        leftBtn.style.fontSize = '1.2em';
        leftBtn.style.borderRadius = '12px';
        leftBtn.style.background = '#ffe066';
        leftBtn.style.border = '1.5px solid #1877c9';
        leftBtn.style.cursor = 'pointer';
        leftBtn.onpointerdown = e => { e.preventDefault(); move(-1); };
        controlsDiv.appendChild(leftBtn);

        // Rechts
        const rightBtn = document.createElement('button');
        rightBtn.innerText = '→ Rechts';
        rightBtn.style.width = '110px';
        rightBtn.style.height = '48px';
        rightBtn.style.fontSize = '1.2em';
        rightBtn.style.borderRadius = '12px';
        rightBtn.style.background = '#ffe066';
        rightBtn.style.border = '1.5px solid #1877c9';
        rightBtn.style.cursor = 'pointer';
        rightBtn.onpointerdown = e => { e.preventDefault(); move(1); };
        controlsDiv.appendChild(rightBtn);

        // Drehen
        const rotateBtn = document.createElement('button');
        rotateBtn.innerText = '⟳ Drehen';
        rotateBtn.style.width = '110px';
        rotateBtn.style.height = '48px';
        rotateBtn.style.fontSize = '1.2em';
        rotateBtn.style.borderRadius = '12px';
        rotateBtn.style.background = '#ffe066';
        rotateBtn.style.border = '1.5px solid #1877c9';
        rotateBtn.style.marginBottom = '8px';
        rotateBtn.style.cursor = 'pointer';
        rotateBtn.onpointerdown = e => { e.preventDefault(); rotate(); };
        controlsDiv.appendChild(rotateBtn);

        // Nach unten
        const downBtn = document.createElement('button');
        downBtn.innerText = '↓ Runter';
        downBtn.style.width = '110px';
        downBtn.style.height = '48px';
        downBtn.style.fontSize = '1.2em';
        downBtn.style.borderRadius = '12px';
        downBtn.style.background = '#ffe066';
        downBtn.style.border = '1.5px solid #1877c9';
        downBtn.style.cursor = 'pointer';
        downBtn.onpointerdown = e => { e.preventDefault(); softDrop(); };
        controlsDiv.appendChild(downBtn);

        // Hard Drop
        const hardBtn = document.createElement('button');
        hardBtn.innerText = '⤓ Hard Drop';
        hardBtn.style.width = '110px';
        hardBtn.style.height = '48px';
        hardBtn.style.fontSize = '1.2em';
        hardBtn.style.borderRadius = '12px';
        hardBtn.style.background = '#ffe066';
        hardBtn.style.border = '1.5px solid #1877c9';
        hardBtn.style.cursor = 'pointer';
        hardBtn.onpointerdown = e => { e.preventDefault(); hardDrop(); };
        controlsDiv.appendChild(hardBtn);

        // Hold
        const holdBtn = document.createElement('button');
        holdBtn.innerText = '⧗ Hold';
        holdBtn.style.width = '110px';
        holdBtn.style.height = '48px';
        holdBtn.style.fontSize = '1.2em';
        holdBtn.style.borderRadius = '12px';
        holdBtn.style.background = '#ffe066';
        holdBtn.style.border = '1.5px solid #1877c9';
        holdBtn.style.cursor = 'pointer';
        holdBtn.onpointerdown = e => { e.preventDefault(); hold(); };
        controlsDiv.appendChild(holdBtn);

        document.body.appendChild(controlsDiv);
    }
    // Positionierung anpassen bei Resize
    setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        controlsDiv.style.left = (rect.right + 10 + window.scrollX) + 'px';
        controlsDiv.style.top = (rect.top + 40 + window.scrollY) + 'px';
    }, 0);
}

function gameLoop() {
    if (gameOver || paused) return;
    dropTimer += 20;
    if (dropTimer >= dropDelay) {
        dropTimer = 0;
        if (canMove(curShape, curX, curY+1)) {
            curY++;
        } else {
            merge();
            clearLines();
            spawn();
        }
        draw();
    }
}

function move(dx) {
    if (canMove(curShape, curX+dx, curY)) {
        curX += dx;
        draw();
    }
}
function rotate() {
    let rot = curShape[0].map((_,i) => curShape.map(row => row[i]).reverse());
    if (canMove(rot, curX, curY)) {
        curShape = rot;
        draw();
    }
}
function hardDrop() {
    while (canMove(curShape, curX, curY+1)) curY++;
    dropTimer = dropDelay;
    draw();
}
function softDrop() {
    if (canMove(curShape, curX, curY+1)) {
        curY++;
        draw();
    }
}
function hold() {
    if (!canHold) return;
    if (!holdShape) {
        holdShape = curShape.map(row=>row.slice());
        holdColor = curColor;
        spawn();
    } else {
        [curShape, holdShape] = [holdShape, curShape];
        [curColor, holdColor] = [holdColor, curColor];
        curX = Math.floor(cols/2) - Math.floor(curShape[0].length/2);
        curY = 0;
        if (!canMove(curShape, curX, curY)) {
            gameOver = true;
            clearInterval(interval);
        }
    }
    canHold = false;
    draw();
}

document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
        resetGame();
        return;
    }
    if (gameOver) return;
    if (e.key === 'p') { paused = !paused; draw(); return; }
    if (paused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') move(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') move(1);
    if (e.key === 'ArrowDown' || e.key === 's') softDrop();
    if (e.key === 'ArrowUp' || e.key === 'w') rotate();
    if (e.key === ' ' || e.key === 'Shift') hardDrop();
    if (e.key === 'c') hold();
});

let touchStart = null, touchMoved = false;
gameDiv.addEventListener('touchstart', function(e) {
    if (gameOver) { resetGame(); return; }
    if (paused) return;
    const t = e.touches[0];
    touchStart = {x: t.clientX, y: t.clientY, time: Date.now()};
    touchMoved = false;
}, {passive: false});
gameDiv.addEventListener('touchmove', function(e) {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 1 : -1);
        touchStart.x = t.clientX;
        touchMoved = true;
    } else if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
        if (dy > 0) softDrop();
        else rotate();
        touchStart.y = t.clientY;
        touchMoved = true;
    }
}, {passive: false});
gameDiv.addEventListener('touchend', function(e) {
    if (!touchStart) return;
    if (!touchMoved && Date.now() - touchStart.time < 300) {
        hardDrop();
    }
    touchStart = null;
    touchMoved = false;
}, {passive: false});

resetGame();
