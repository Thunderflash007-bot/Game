document.getElementById('game').innerText = 'Hier kommt das Schach Spiel hin.';
// Minimal Chessboard, 2 Spieler oder gegen Computer (macht Zufallszug)
const size = 8;
let board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];
let current = 'w'; // w: weiß, b: schwarz
let selected = null;
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
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '40px';
            td.style.height = '40px';
            td.style.textAlign = 'center';
            td.style.fontSize = '28px';
            td.style.border = '1px solid #333';
            td.style.background = (r + c) % 2 === 0 ? '#eee' : '#888';
            if (selected && selected[0] === r && selected[1] === c) {
                td.style.background = '#ff0';
            }
            td.dataset.r = r;
            td.dataset.c = c;
            td.innerText = pieceUnicode(board[r][c]);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    game.appendChild(table);

    table.addEventListener('click', handleInput);
    table.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.r !== undefined) {
            handleMove(parseInt(target.dataset.r), parseInt(target.dataset.c));
        }
    });

    const info = document.createElement('div');
    info.style.marginTop = '10px';
    if (gameOver) {
        info.innerText = winnerText();
    } else {
        info.innerText = current === 'w' ? 'Weiß ist am Zug' : 'Schwarz ist am Zug';
    }
    game.appendChild(info);

    const resetBtn = document.createElement('button');
    resetBtn.innerText = 'Neustart';
    resetBtn.onclick = resetGame;
    resetBtn.style.marginTop = '10px';
    game.appendChild(resetBtn);
}

function pieceUnicode(p) {
    return {
        'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙',
        'k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'
    }[p] || '';
}

function handleInput(e) {
    if (gameOver) return;
    if (e.target.dataset.r !== undefined) {
        handleMove(parseInt(e.target.dataset.r), parseInt(e.target.dataset.c));
    }
}

function handleMove(r, c) {
    if (gameOver) return;
    const piece = board[r][c];
    if (!selected) {
        if (piece && ((current === 'w' && piece === piece.toUpperCase()) || (current === 'b' && piece === piece.toLowerCase()))) {
            selected = [r, c];
            render();
        }
    } else {
        if (selected[0] === r && selected[1] === c) {
            selected = null;
            render();
            return;
        }
        if (isValidMove(selected[0], selected[1], r, c)) {
            board[r][c] = board[selected[0]][selected[1]];
            board[selected[0]][selected[1]] = '';
            selected = null;
            if (isCheckmate()) {
                gameOver = true;
            } else {
                current = current === 'w' ? 'b' : 'w';
                render();
                if (mode === 'computer' && current === 'b' && !gameOver) {
                    setTimeout(computerMove, 500);
                }
            }
            render();
        } else {
            selected = null;
            render();
        }
    }
}

function isValidMove(fr, fc, tr, tc) {
    // Nur einfache Regeln: Ziehen auf leeres Feld oder Gegner, keine Spezialregeln
    const piece = board[fr][fc];
    if (!piece) return false;
    const target = board[tr][tc];
    if (piece === piece.toUpperCase() && target && target === target.toUpperCase()) return false;
    if (piece === piece.toLowerCase() && target && target === target.toLowerCase()) return false;
    // Nur einfache Bewegungen: Bauer, Turm, Springer, Läufer, Dame, König
    const dr = tr - fr, dc = tc - fc;
    switch (piece.toLowerCase()) {
        case 'p':
            if (piece === 'P') {
                if (dc === 0 && dr === -1 && !target) return true;
                if (fr === 6 && dc === 0 && dr === -2 && !target && !board[fr-1][fc]) return true;
                if (Math.abs(dc) === 1 && dr === -1 && target && target === target.toLowerCase()) return true;
            } else {
                if (dc === 0 && dr === 1 && !target) return true;
                if (fr === 1 && dc === 0 && dr === 2 && !target && !board[fr+1][fc]) return true;
                if (Math.abs(dc) === 1 && dr === 1 && target && target === target.toUpperCase()) return true;
            }
            break;
        case 'r':
            if ((dr === 0 || dc === 0) && clearPath(fr, fc, tr, tc)) return true;
            break;
        case 'n':
            if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) return true;
            break;
        case 'b':
            if (Math.abs(dr) === Math.abs(dc) && clearPath(fr, fc, tr, tc)) return true;
            break;
        case 'q':
            if (((dr === 0 || dc === 0) || (Math.abs(dr) === Math.abs(dc))) && clearPath(fr, fc, tr, tc)) return true;
            break;
        case 'k':
            if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
            break;
    }
    return false;
}

function clearPath(fr, fc, tr, tc) {
    let dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    let r = fr + dr, c = fc + dc;
    while (r !== tr || c !== tc) {
        if (board[r][c]) return false;
        r += dr; c += dc;
    }
    return true;
}

function isCheckmate() {
    // Nur Matt durch Schlagen des Königs
    let kings = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (board[r][c] === 'K' || board[r][c] === 'k') kings++;
    }
    return kings < 2;
}

function winnerText() {
    if (board.flat().includes('K')) return 'Weiß gewinnt!';
    if (board.flat().includes('k')) return 'Schwarz gewinnt!';
    return 'Unentschieden!';
}

function resetGame() {
    board = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    current = 'w';
    selected = null;
    gameOver = false;
    render();
}

function computerMove() {
    // Sucht alle möglichen Züge, wählt zufällig
    let moves = [];
    for (let fr = 0; fr < size; fr++) for (let fc = 0; fc < size; fc++) {
        const piece = board[fr][fc];
        if (piece && piece === piece.toLowerCase()) {
            for (let tr = 0; tr < size; tr++) for (let tc = 0; tc < size; tc++) {
                if (isValidMove(fr, fc, tr, tc)) moves.push([fr, fc, tr, tc]);
            }
        }
    }
    if (moves.length === 0) return;
    const [fr, fc, tr, tc] = moves[Math.floor(Math.random() * moves.length)];
    board[tr][tc] = board[fr][fc];
    board[fr][fc] = '';
    if (isCheckmate()) {
        gameOver = true;
    } else {
        current = 'w';
    }
    render();
}

render();
if (mode === 'computer' && current === 'b' && !gameOver) {
    setTimeout(computerMove, 500);
}