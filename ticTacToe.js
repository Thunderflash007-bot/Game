const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const size = 3;
let board = Array.from({length: size}, () => Array(size).fill(''));
let current = 'X';
let gameOver = false;
let mode = getMode();

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}

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
            td.style.width = '80px';
            td.style.height = '80px';
            td.style.fontSize = '2.5em';
            td.style.textAlign = 'center';
            td.style.border = '2px solid #1877c9';
            td.style.cursor = gameOver || board[r][c] ? 'default' : 'pointer';
            td.style.background = '#fffbe6';
            td.innerText = board[r][c];
            td.onclick = () => handleMove(r, c);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    gameDiv.appendChild(table);

    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.style.minHeight = '1.5em';
    if (gameOver) {
        info.innerText = winnerText();
        info.style.color = '#c00';
        info.style.fontWeight = 'bold';
    } else {
        info.innerHTML = `<span style="color:#1877c9;font-weight:bold">${current}</span> ist am Zug`;
    }
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

function handleMove(r, c) {
    if (gameOver || board[r][c]) return;
    board[r][c] = current;
    if (checkWin(current)) {
        gameOver = true;
    } else if (board.flat().every(x => x)) {
        gameOver = true;
        current = null;
    } else {
        current = current === 'X' ? 'O' : 'X';
        if (mode === 'computer' && current === 'O' && !gameOver) {
            setTimeout(computerMove, 400);
        }
    }
    render();
}

function computerMove() {
    // Simple: random empty cell
    let empty = [];
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (!board[r][c]) empty.push([r, c]);
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    handleMove(r, c);
}

function checkWin(player) {
    for (let i = 0; i < size; i++) {
        if (board[i].every(x => x === player)) return true;
        if (board.map(row => row[i]).every(x => x === player)) return true;
    }
    if ([0,1,2].every(i => board[i][i] === player)) return true;
    if ([0,1,2].every(i => board[i][2-i] === player)) return true;
    return false;
}

function winnerText() {
    if (current) return `${current} gewinnt!`;
    return 'Unentschieden!';
}

function resetGame() {
    board = Array.from({length: size}, () => Array(size).fill(''));
    current = 'X';
    gameOver = false;
    render();
}

render();
if (mode === 'computer' && current === 'O' && !gameOver) {
    setTimeout(computerMove, 400);
}

// Verbesserte Steuerung: Tastatur (1-9), Touch, Enter für Neustart
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (gameOver) return;
    // Tasten 1-9 für Felder (links oben = 1, rechts unten = 9)
    if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key) - 1;
        const r = Math.floor(idx / size), c = idx % size;
        handleMove(r, c);
    }
});
// Verbesserte Logik: Touch, Tastatur, Animation, Reset
gameDiv.addEventListener('touchstart', function(e) {
    if (gameOver) { resetGame(); return; }
    const rect = gameDiv.querySelector('table').getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const r = Math.floor(y / (rect.height / size));
    const c = Math.floor(x / (rect.width / size));
    handleMove(r, c);
}, {passive: false});
