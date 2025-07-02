document.getElementById('game').innerText = 'Hier kommt das Schiffe versenken Spiel hin.';
// ...hier später Spiellogik einfügen...

const size = 8;
let playerBoard = Array.from({length: size}, () => Array(size).fill(0));
let computerBoard = Array.from({length: size}, () => Array(size).fill(0));
let playerHits = Array.from({length: size}, () => Array(size).fill(0));
let computerHits = Array.from({length: size}, () => Array(size).fill(0));
let ships = [4,3,2]; // Schiffslängen
let playerTurn = true;
let gameOver = false;
let mode = 'zweispieler';

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}
mode = getMode();

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
    const info = document.createElement('div');
    info.innerText = gameOver ? winnerText() : (playerTurn ? 'Du bist am Zug' : (mode === 'computer' ? 'Computer denkt...' : 'Spieler 2 ist am Zug'));
    game.appendChild(info);

    const boardsDiv = document.createElement('div');
    boardsDiv.style.display = 'flex';
    boardsDiv.style.justifyContent = 'center';

    // Gegner-Board (zum Angreifen)
    const enemyDiv = document.createElement('div');
    enemyDiv.innerHTML = '<b>Gegner</b>';
    const enemyTable = document.createElement('table');
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '30px';
            td.style.height = '30px';
            td.style.border = '1px solid #333';
            td.style.textAlign = 'center';
            td.style.background = playerHits[r][c] === 0 ? '#aad' : (computerBoard[r][c] === 1 ? '#f00' : '#fff');
            td.dataset.r = r;
            td.dataset.c = c;
            if (!gameOver && playerTurn) {
                td.style.cursor = 'pointer';
                td.onclick = () => attack(r, c);
            }
            tr.appendChild(td);
        }
        enemyTable.appendChild(tr);
    }
    enemyDiv.appendChild(enemyTable);
    boardsDiv.appendChild(enemyDiv);

    // Eigenes Board (zeigt eigene Schiffe und Treffer)
    const ownDiv = document.createElement('div');
    ownDiv.style.marginLeft = '30px';
    ownDiv.innerHTML = '<b>Du</b>';
    const ownTable = document.createElement('table');
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '30px';
            td.style.height = '30px';
            td.style.border = '1px solid #333';
            td.style.textAlign = 'center';
            td.style.background = playerBoard[r][c] === 1 ? '#888' : '#fff';
            if (computerHits[r][c] === 1) td.style.background = '#f00';
            tr.appendChild(td);
        }
        ownTable.appendChild(tr);
    }
    ownDiv.appendChild(ownTable);
    boardsDiv.appendChild(ownDiv);

    game.appendChild(boardsDiv);

    // Touch Steuerung
    enemyTable.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.r !== undefined && playerTurn && !gameOver) {
            attack(parseInt(target.dataset.r), parseInt(target.dataset.c));
        }
    });

    const resetBtn = document.createElement('button');
    resetBtn.innerText = 'Neustart';
    resetBtn.onclick = resetGame;
    resetBtn.style.marginTop = '10px';
    game.appendChild(resetBtn);
}

function attack(r, c) {
    if (playerHits[r][c] !== 0 || gameOver) return;
    playerHits[r][c] = 1;
    if (computerBoard[r][c] === 1 && isAllSunk(computerBoard, playerHits)) {
        gameOver = true;
    } else {
        playerTurn = false;
        render();
        if (mode === 'computer') setTimeout(computerAttack, 700);
    }
    render();
}

function computerAttack() {
    let options = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (computerHits[r][c] === 0) options.push([r, c]);
    }
    if (options.length === 0) return;
    const [r, c] = options[Math.floor(Math.random() * options.length)];
    computerHits[r][c] = 1;
    if (playerBoard[r][c] === 1 && isAllSunk(playerBoard, computerHits)) {
        gameOver = true;
    } else {
        playerTurn = true;
    }
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
    playerBoard = Array.from({length: size}, () => Array(size).fill(0));
    computerBoard = Array.from({length: size}, () => Array(size).fill(0));
    playerHits = Array.from({length: size}, () => Array(size).fill(0));
    computerHits = Array.from({length: size}, () => Array(size).fill(0));
    placeShipsRandom(playerBoard);
    placeShipsRandom(computerBoard);
    playerTurn = true;
    gameOver = false;
    render();
}

placeShipsRandom(playerBoard);
placeShipsRandom(computerBoard);
render();