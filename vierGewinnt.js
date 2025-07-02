document.getElementById('game').innerText = 'Hier kommt das 4 Gewinnt Spiel hin.';
// ...hier später Spiellogik einfügen...
// Optional: Modus aus URL lesen und KI aktivieren

const rows = 6, cols = 7;
let board = Array.from({length: rows}, () => Array(cols).fill(0));
let currentPlayer = 1;
let gameOver = false;
let mode = 'zweispieler';

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}
mode = getMode();

function render() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    const table = document.createElement('table');
    table.style.margin = '0 auto';
    table.style.borderCollapse = 'collapse';
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            td.style.width = '50px';
            td.style.height = '50px';
            td.style.border = '1px solid #333';
            td.style.background = board[r][c] === 0 ? '#fff' : (board[r][c] === 1 ? 'red' : 'yellow');
            td.dataset.col = c;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    game.appendChild(table);

    // Touch/Click Steuerung
    table.addEventListener('click', handleInput);
    table.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.col !== undefined) {
            handleMove(parseInt(target.dataset.col));
        }
    });

    const info = document.createElement('div');
    info.style.marginTop = '10px';
    if (gameOver) {
        info.innerText = winnerText();
    } else {
        info.innerText = currentPlayer === 1 ? 'Rot ist am Zug' : 'Gelb ist am Zug';
    }
    game.appendChild(info);

    const resetBtn = document.createElement('button');
    resetBtn.innerText = 'Neustart';
    resetBtn.onclick = resetGame;
    resetBtn.style.marginTop = '10px';
    game.appendChild(resetBtn);
}

function handleInput(e) {
    if (gameOver) return;
    if (e.target.dataset.col !== undefined) {
        handleMove(parseInt(e.target.dataset.col));
    }
}

function handleMove(col) {
    if (gameOver) return;
    for (let r = rows - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            board[r][col] = currentPlayer;
            if (checkWin(r, col)) {
                gameOver = true;
            } else if (board.flat().every(x => x !== 0)) {
                gameOver = true;
                currentPlayer = 0; // Unentschieden
            } else {
                currentPlayer = 3 - currentPlayer;
                if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
                    setTimeout(computerMove, 500);
                }
            }
            render();
            break;
        }
    }
}

function computerMove() {
    // Einfacher Zufall
    let validCols = [];
    for (let c = 0; c < cols; c++) {
        if (board[0][c] === 0) validCols.push(c);
    }
    if (validCols.length === 0) return;
    const col = validCols[Math.floor(Math.random() * validCols.length)];
    handleMove(col);
}

function checkWin(r, c) {
    const player = board[r][c];
    function count(dx, dy) {
        let cnt = 0, x = r + dx, y = c + dy;
        while (x >= 0 && x < rows && y >= 0 && y < cols && board[x][y] === player) {
            cnt++; x += dx; y += dy;
        }
        return cnt;
    }
    return (
        count(-1, 0) + count(1, 0) >= 3 ||
        count(0, -1) + count(0, 1) >= 3 ||
        count(-1, -1) + count(1, 1) >= 3 ||
        count(-1, 1) + count(1, -1) >= 3
    );
}

function winnerText() {
    if (currentPlayer === 0) return 'Unentschieden!';
    return (currentPlayer === 1 ? 'Rot' : 'Gelb') + ' gewinnt!';
}

function resetGame() {
    board = Array.from({length: rows}, () => Array(cols).fill(0));
    currentPlayer = 1;
    gameOver = false;
    render();
}

render();
if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
    setTimeout(computerMove, 500);
}