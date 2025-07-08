document.getElementById('game').innerText = 'Hier kommt Minesweeper hin.';
// ...hier später Spiellogik einfügen...

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const size = 10, mines = 15;
let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let win = false;

function resetGame() {
    board = Array.from({length: size}, () => Array(size).fill(0));
    revealed = Array.from({length: size}, () => Array(size).fill(false));
    flagged = Array.from({length: size}, () => Array(size).fill(false));
    gameOver = false;
    win = false;
    // Minen setzen
    let placed = 0;
    while (placed < mines) {
        let r = Math.floor(Math.random()*size);
        let c = Math.floor(Math.random()*size);
        if (board[r][c] !== 'M') {
            board[r][c] = 'M';
            placed++;
        }
    }
    // Zahlen setzen
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (board[r][c] === 'M') continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<size && nc>=0 && nc<size && board[nr][nc]==='M') count++;
            }
        board[r][c] = count;
    }
    render();
}

// Verbesserte Logik: Tastatur (Cursor), Touch, Animation, Reset
let cursor = {r: 0, c: 0};
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (gameOver) return;
    if (e.key === "ArrowUp" && cursor.r > 0) cursor.r--;
    if (e.key === "ArrowDown" && cursor.r < size-1) cursor.r++;
    if (e.key === "ArrowLeft" && cursor.c > 0) cursor.c--;
    if (e.key === "ArrowRight" && cursor.c < size-1) cursor.c++;
    if (e.key === " " || e.key === "Enter") handleReveal(cursor.r, cursor.c);
    if (e.key.toLowerCase() === "f") handleFlag(cursor.r, cursor.c);
    render();
});
gameDiv.addEventListener('touchstart', function(e) {
    if (gameOver) { resetGame(); return; }
    const rect = gameDiv.querySelector('table').getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const r = Math.floor(y / (rect.height / size));
    const c = Math.floor(x / (rect.width / size));
    handleReveal(r, c);
}, {passive: false});
function render() {
    gameDiv.innerHTML = '';
    const table = document.createElement('table');
    table.style.margin = '0 auto';
    table.style.borderCollapse = 'collapse';
    table.style.boxShadow = '0 0 16px #bbb';
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '38px';
            td.style.height = '38px';
            td.style.fontSize = '1.2em';
            td.style.textAlign = 'center';
            td.style.border = '1.5px solid #1877c9';
            td.style.background = revealed[r][c] ? '#fffbe6' : '#b3d1f7';
            td.style.cursor = gameOver || revealed[r][c] ? 'default' : 'pointer';
            if (revealed[r][c]) {
                if (board[r][c] === 'M') {
                    td.innerHTML = '<span style="color:#c00;font-weight:bold;">&#128163;</span>';
                } else if (board[r][c] > 0) {
                    td.innerText = board[r][c];
                    td.style.color = ['#1877c9','#388e3c','#c00','#b366ff','#ffb366','#ff6666'][board[r][c]-1] || '#222';
                }
            } else if (flagged[r][c]) {
                td.innerHTML = '<span style="color:#bfa600;font-weight:bold;">&#9873;</span>';
            }
            td.oncontextmenu = (e) => { e.preventDefault(); handleFlag(r, c); };
            td.onclick = () => handleReveal(r, c);
            // Cursor-Highlight
            if (cursor.r === r && cursor.c === c && !gameOver) {
                td.style.outline = "2.5px solid #ffe066";
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    gameDiv.appendChild(table);

    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    if (gameOver) info.innerText = win ? 'Gewonnen!' : 'Game Over!';
    else info.innerText = 'Finde alle Minen!';
    gameDiv.appendChild(info);

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
}

function handleReveal(r, c) {
    if (gameOver || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 'M') {
        gameOver = true;
        win = false;
        revealAll();
    } else if (board[r][c] === 0) {
        // Flood fill
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r+dr, nc = c+dc;
                if (nr>=0 && nr<size && nc>=0 && nc<size && !revealed[nr][nc])
                    handleReveal(nr, nc);
            }
    }
    checkWin();
    render();
}

function handleFlag(r, c) {
    if (gameOver || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    render();
}

function revealAll() {
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            revealed[r][c] = true;
}

function checkWin() {
    let safe = 0;
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (!revealed[r][c] && board[r][c] !== 'M') safe++;
    if (safe === 0 && !gameOver) {
        win = true;
        gameOver = true;
        revealAll();
    }
}

resetGame();
