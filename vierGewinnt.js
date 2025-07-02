document.getElementById('game').innerText = 'Hier kommt das 4 Gewinnt Spiel hin.';
// ...hier später Spiellogik einfügen...
// Optional: Modus aus URL lesen und KI aktivieren

const rows = 6, cols = 7;
let board = Array.from({length: rows}, () => Array(cols).fill(0));
let currentPlayer = 1; // 1 = Rot, 2 = Gelb
let gameOver = false;
let mode = getMode();
let animating = false;

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}

function render() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    // Brett
    const table = document.createElement('table');
    table.style.margin = '0 auto';
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '8px 4px';
    table.style.background = '#1877c9';
    table.style.borderRadius = '18px';
    table.style.boxShadow = '0 0 16px #bbb';
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            td.style.width = '54px';
            td.style.height = '54px';
            td.style.borderRadius = '50%';
            td.style.background = '#fff';
            td.style.boxShadow = 'inset 0 2px 8px #aaa';
            td.style.position = 'relative';
            td.style.transition = 'background 0.2s';
            if (board[r][c] === 1) {
                td.style.background = 'radial-gradient(circle at 60% 30%, #ff6666 70%, #c00 100%)';
            }
            if (board[r][c] === 2) {
                td.style.background = 'radial-gradient(circle at 60% 30%, #ffe066 70%, #d4b200 100%)';
            }
            td.dataset.col = c;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    game.appendChild(table);

    // Hover-Effekt für mögliche Spalten
    if (!gameOver && !animating) {
        for (let c = 0; c < cols; c++) {
            let topCell = table.rows[0].cells[c];
            topCell.style.cursor = 'pointer';
            topCell.onmouseenter = () => highlightColumn(table, c, true);
            topCell.onmouseleave = () => highlightColumn(table, c, false);
            topCell.onclick = () => handleMoveAnimated(c);
            topCell.ontouchstart = () => handleMoveAnimated(c);
        }
    }

    // Info/Meldung unter dem Spielfeld
    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.style.minHeight = '1.5em';
    if (gameOver) {
        info.innerText = winnerText();
        info.style.color = (currentPlayer === 1 ? '#c00' : '#bfa600');
        info.style.fontWeight = 'bold';
    } else {
        info.innerHTML = `<span style="color:${currentPlayer===1?'#c00':'#bfa600'};font-weight:bold">${currentPlayer===1?'Rot':'Gelb'}</span> ist am Zug`;
    }
    game.appendChild(info);

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
    game.appendChild(resetBtn);
}

function highlightColumn(table, col, on) {
    for (let r = 0; r < rows; r++) {
        let cell = table.rows[r].cells[col];
        if (on && board[r][col] === 0) {
            cell.style.boxShadow = '0 0 0 4px #ffe066, inset 0 2px 8px #aaa';
        } else {
            cell.style.boxShadow = 'inset 0 2px 8px #aaa';
        }
    }
}

function handleMoveAnimated(col) {
    if (gameOver || animating) return;
    // Finde die unterste freie Zeile
    let row = -1;
    for (let r = rows - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            row = r;
            break;
        }
    }
    if (row === -1) return;
    animating = true;
    let animRow = 0;
    let dropInterval = setInterval(() => {
        if (animRow > 0) board[animRow-1][col] = 0;
        board[animRow][col] = currentPlayer;
        render();
        if (animRow === row) {
            clearInterval(dropInterval);
            finishMove(row, col);
            animating = false;
        } else {
            animRow++;
        }
    }, 40);
}

function finishMove(r, c) {
    if (checkWin(r, c)) {
        gameOver = true;
    } else if (board.flat().every(x => x !== 0)) {
        gameOver = true;
        currentPlayer = 0; // Unentschieden
    } else {
        currentPlayer = 3 - currentPlayer;
        if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
            setTimeout(computerMove, 600);
        }
    }
    render();
}

function computerMove() {
    // Einfache KI: Gewinnzug, Blockzug, sonst zufällig
    let validCols = [];
    for (let c = 0; c < cols; c++) {
        if (board[0][c] === 0) validCols.push(c);
    }
    // Gewinnzug suchen
    for (let c of validCols) {
        let temp = board.map(row => row.slice());
        for (let r = rows - 1; r >= 0; r--) {
            if (temp[r][c] === 0) {
                temp[r][c] = 2;
                if (checkWinSim(temp, r, c, 2)) return handleMoveAnimated(c);
                break;
            }
        }
    }
    // Blockzug suchen
    for (let c of validCols) {
        let temp = board.map(row => row.slice());
        for (let r = rows - 1; r >= 0; r--) {
            if (temp[r][c] === 0) {
                temp[r][c] = 1;
                if (checkWinSim(temp, r, c, 1)) return handleMoveAnimated(c);
                break;
            }
        }
    }
    // Sonst zufällig
    const col = validCols[Math.floor(Math.random() * validCols.length)];
    handleMoveAnimated(col);
}

function checkWin(r, c) {
    return checkWinSim(board, r, c, board[r][c]);
}

function checkWinSim(b, r, c, player) {
    function count(dr, dc) {
        let cnt = 0, rr = r+dr, cc = c+dc;
        while (rr >= 0 && rr < rows && cc >= 0 && cc < cols && b[rr][cc] === player) {
            cnt++; rr += dr; cc += dc;
        }
        return cnt;
    }
    return (
        count(-1,0) + count(1,0) >= 3 ||
        count(0,-1) + count(0,1) >= 3 ||
        count(-1,-1) + count(1,1) >= 3 ||
        count(-1,1) + count(1,-1) >= 3
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
    animating = false;
    render();
}

render();
if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
    setTimeout(computerMove, 600);
}