document.getElementById('game').innerText = 'Hier kommt das Schiffe versenken Spiel hin.';
// ...hier später Spiellogik einfügen...

const size = 8;
const ships = [4, 3, 2];
let playerBoard, computerBoard, playerHits, computerHits;
let playerTurn = true;
let gameOver = false;
let mode = getMode();

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}

function createBoard() {
    return Array.from({length: size}, () => Array(size).fill(0));
}

function placeShipsRandom(board) {
    for (let len of ships) {
        let placed = false;
        while (!placed) {
            let dir = Math.random() > 0.5 ? 'h' : 'v';
            let r = Math.floor(Math.random() * (dir === 'h' ? size : size - len + 1));
            let c = Math.floor(Math.random() * (dir === 'v' ? size : size - len + 1));
            let ok = true;
            for (let i = 0; i < len; i++) {
                let rr = r + (dir === 'v' ? i : 0);
                let cc = c + (dir === 'h' ? i : 0);
                if (board[rr][cc] !== 0) ok = false;
            }
            if (ok) {
                for (let i = 0; i < len; i++) {
                    let rr = r + (dir === 'v' ? i : 0);
                    let cc = c + (dir === 'h' ? i : 0);
                    board[rr][cc] = 1;
                }
                placed = true;
            }
        }
    }
}

function render() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    // Info
    const info = document.createElement('div');
    info.style.fontSize = '1.2em';
    info.style.marginBottom = '16px';
    info.style.fontWeight = 'bold';
    info.innerText = gameOver
        ? winnerText()
        : (playerTurn ? 'Du bist am Zug' : (mode === 'computer' ? 'Computer denkt...' : 'Spieler 2 ist am Zug'));
    game.appendChild(info);

    // Boards nebeneinander
    const boardsDiv = document.createElement('div');
    boardsDiv.style.display = 'flex';
    boardsDiv.style.justifyContent = 'center';
    boardsDiv.style.gap = '40px';

    // Gegner-Board (zum Angreifen)
    boardsDiv.appendChild(createBoardDiv(
        'Gegner',
        computerBoard,
        playerHits,
        playerTurn && !gameOver,
        (r, c) => attack(r, c),
        true
    ));

    // Eigenes Board (zeigt eigene Schiffe und Treffer)
    boardsDiv.appendChild(createBoardDiv(
        'Du',
        playerBoard,
        computerHits,
        false,
        null,
        false
    ));

    game.appendChild(boardsDiv);

    // Reset-Button
    const resetBtn = document.createElement('button');
    resetBtn.innerText = 'Neustart';
    resetBtn.onclick = resetGame;
    resetBtn.style.marginTop = '18px';
    resetBtn.style.padding = '10px 24px';
    resetBtn.style.fontSize = '1.1em';
    resetBtn.style.borderRadius = '8px';
    resetBtn.style.background = '#ffe066';
    resetBtn.style.border = '1px solid #1877c9';
    resetBtn.style.cursor = 'pointer';
    game.appendChild(resetBtn);
}

function createBoardDiv(title, board, hits, clickable, onCellClick, hideShips) {
    const div = document.createElement('div');
    div.style.textAlign = 'center';
    const label = document.createElement('div');
    label.innerText = title;
    label.style.fontWeight = 'bold';
    label.style.marginBottom = '8px';
    div.appendChild(label);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0 auto';
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '38px';
            td.style.height = '38px';
            td.style.border = '1.5px solid #1877c9';
            td.style.textAlign = 'center';
            td.style.fontSize = '1.3em';
            td.style.cursor = clickable ? 'pointer' : 'default';
            // Wasserfarbe
            td.style.background = '#b3d1f7';
            // Schiffe
            if (board[r][c] === 1 && !hideShips) {
                td.style.background = '#888';
            }
            // Treffer/Fehlschuss
            if (hits[r][c] === 1) {
                if (board[r][c] === 1) {
                    td.style.background = 'radial-gradient(circle at 60% 40%, #ffb3b3 60%, #ff4d4d 100%)';
                    td.innerHTML = '<span style="color:#b00;font-weight:bold;">&#10006;</span>';
                } else {
                    td.style.background = '#e0eafc';
                    td.innerHTML = '<span style="color:#1877c9;font-size:1.2em;">&#8226;</span>';
                }
            }
            td.dataset.r = r;
            td.dataset.c = c;
            if (clickable && !hits[r][c]) {
                td.onclick = () => onCellClick(r, c);
                td.ontouchstart = (e) => {
                    e.preventDefault();
                    onCellClick(r, c);
                };
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    div.appendChild(table);
    return div;
}

function attack(r, c) {
    if (playerHits[r][c] !== 0 || gameOver) return;
    playerHits[r][c] = 1;
    render();
    if (computerBoard[r][c] === 1 && isAllSunk(computerBoard, playerHits)) {
        gameOver = true;
        render();
        return;
    }
    playerTurn = false;
    render();
    if (mode === 'computer') setTimeout(computerAttack, 700);
}

function computerAttack() {
    let options = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (computerHits[r][c] === 0) options.push([r, c]);
    }
    if (options.length === 0) return;
    const [r, c] = options[Math.floor(Math.random() * options.length)];
    computerHits[r][c] = 1;
    render();
    if (playerBoard[r][c] === 1 && isAllSunk(playerBoard, computerHits)) {
        gameOver = true;
        render();
        return;
    }
    playerTurn = true;
    render();
}

function isAllSunk(board, hits) {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (board[r][c] === 1 && hits[r][c] === 0) return false;
    }
    return true;
}

function winnerText() {
    if (isAllSunk(computerBoard, playerHits)) return 'Du hast gewonnen!';
    if (isAllSunk(playerBoard, computerHits)) return 'Computer hat gewonnen!';
    return 'Unentschieden!';
}

function resetGame() {
    playerBoard = createBoard();
    computerBoard = createBoard();
    playerHits = createBoard();
    computerHits = createBoard();
    placeShipsRandom(playerBoard);
    placeShipsRandom(computerBoard);
    playerTurn = true;
    gameOver = false;
    render();
}

resetGame();