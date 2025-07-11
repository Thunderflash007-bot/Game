document.getElementById('game').innerText = 'Hier kommt das Schach Spiel hin.';
// Minimal Chessboard, 2 Spieler oder gegen Computer (macht Zufallszug)
const size = 8;
const initialBoard = () => [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];
let board = initialBoard();
let current = 'w'; // 'w' = Weiß, 'b' = Schwarz
let selected = null;
let highlightMoves = [];
let gameOver = false;
let promoteInfo = null;
let infoMsg = '';
let mode = getMode();

// --- Erweiterung: Rochade, En Passant, Bauernumwandlung, Schachprüfung ---
// Zusätzliche Felder für Rochade und En Passant
let castling = {w: {K: true, Q: true}, b: {K: true, Q: true}};
let enPassant = null;

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
    table.style.borderCollapse = 'collapse';
    table.style.boxShadow = '0 0 16px #bbb';
    for (let r = 0; r < size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < size; c++) {
            const td = document.createElement('td');
            td.style.width = '48px';
            td.style.height = '48px';
            td.style.textAlign = 'center';
            td.style.fontSize = '32px';
            td.style.border = '1px solid #333';
            td.style.cursor = 'pointer';
            td.style.background = (r + c) % 2 === 0 ? '#f0d9b5' : '#b58863';
            // Auswahl und mögliche Züge hervorheben
            if (selected && selected[0] === r && selected[1] === c) {
                td.style.background = '#ffe066';
            }
            if (highlightMoves.some(([mr, mc]) => mr === r && mc === c)) {
                td.style.background = '#8fd694';
            }
            td.dataset.r = r;
            td.dataset.c = c;
            td.innerText = pieceUnicode(board[r][c]);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    game.appendChild(table);

    // Event-Listener
    setTimeout(() => setTableListeners(table), 0);

    // Bauernumwandlung
    if (promoteInfo) {
        const promoDiv = document.createElement('div');
        promoDiv.style.margin = '18px auto 0 auto';
        promoDiv.style.textAlign = 'center';
        promoDiv.style.maxWidth = '400px';
        promoDiv.style.background = '#fffbe6';
        promoDiv.style.border = '2px solid #ffe066';
        promoDiv.style.borderRadius = '10px';
        promoDiv.style.padding = '12px 0';
        promoDiv.innerHTML = `<div style="font-size:1.2em;margin-bottom:8px;">Bauer umwandeln in:</div>`;
        const color = promoteInfo.color;
        const choices = color === 'w'
            ? [{f:'Q',n:'Dame'},{f:'R',n:'Turm'},{f:'B',n:'Läufer'},{f:'N',n:'Springer'}]
            : [{f:'q',n:'Dame'},{f:'r',n:'Turm'},{f:'b',n:'Läufer'},{f:'n',n:'Springer'}];
        for (const ch of choices) {
            const btn = document.createElement('button');
            btn.innerText = pieceUnicode(ch.f) + ' ' + ch.n;
            btn.style.fontSize = '1.1em';
            btn.style.margin = '0 8px';
            btn.style.padding = '6px 16px';
            btn.style.borderRadius = '8px';
            btn.onclick = () => promotePawn(promoteInfo.r, promoteInfo.c, ch.f);
            promoDiv.appendChild(btn);
        }
        game.appendChild(promoDiv);
    }

    // Info/Meldung unter dem Spielfeld
    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.style.minHeight = '1.5em';
    if (infoMsg) {
        info.innerText = infoMsg;
        info.style.color = 'red';
        info.style.fontWeight = 'bold';
    } else if (promoteInfo) {
        // Keine Info, Umwandlung läuft
    } else if (gameOver) {
        info.innerText = winnerText();
        info.style.color = '';
        info.style.fontWeight = '';
    } else {
        info.innerText = current === 'w' ? 'Weiß ist am Zug' : 'Schwarz ist am Zug';
        info.style.color = '';
        info.style.fontWeight = '';
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
    resetBtn.style.border = '1px solid #b58863';
    resetBtn.style.cursor = 'pointer';
    game.appendChild(resetBtn);
}

function setTableListeners(table) {
    table.onclick = function(e) {
        if (promoteInfo || gameOver) return;
        if (e.target.dataset.r !== undefined) {
            handleMove(parseInt(e.target.dataset.r), parseInt(e.target.dataset.c));
        }
    };
    table.ontouchstart = function(e) {
        if (promoteInfo || gameOver) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.r !== undefined) {
            handleMove(parseInt(target.dataset.r), parseInt(target.dataset.c));
        }
    };
}

function pieceUnicode(p) {
    return {
        'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙',
        'k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'
    }[p] || '';
}

function handleMove(r, c) {
    if (gameOver || promoteInfo) return;
    const piece = board[r][c];
    if (!selected) {
        if (piece && ((current === 'w' && piece === piece.toUpperCase()) || (current === 'b' && piece === piece.toLowerCase()))) {
            selected = [r, c];
            highlightMoves = getLegalMoves(r, c, board, current);
            render();
        }
    } else {
        if (selected[0] === r && selected[1] === c) {
            selected = null;
            highlightMoves = [];
            render();
            return;
        }
        if (highlightMoves.some(([hr, hc]) => hr === r && hc === c)) {
            makeMove(selected[0], selected[1], r, c);
        } else {
            selected = null;
            highlightMoves = [];
            render();
        }
    }
}

function makeMove(fr, fc, tr, tc) {
    let piece = board[fr][fc];
    let target = board[tr][tc];
    // Rochade
    if (piece.toLowerCase() === 'k' && Math.abs(tc - fc) === 2) {
        // Kurz (König nach rechts)
        if (tc > fc) {
            board[tr][tc] = piece;
            board[fr][fc] = '';
            board[tr][fc+1] = board[tr][7];
            board[tr][7] = '';
        } else { // Lang (König nach links)
            board[tr][tc] = piece;
            board[fr][fc] = '';
            board[tr][fc-1] = board[tr][0];
            board[tr][0] = '';
        }
        // Rochaderechte verlieren
        if (piece === 'K') castling.w.K = castling.w.Q = false;
        if (piece === 'k') castling.b.K = castling.b.Q = false;
        enPassant = null;
    } else {
        // En passant
        if (piece.toLowerCase() === 'p' && fc !== tc && !target) {
            board[tr][tc] = piece;
            board[fr][fc] = '';
            // Schlag den gegnerischen Bauern, der gerade im Vorbeigehen geschlagen wird
            let dir = piece === 'P' ? 1 : -1;
            board[tr + dir][tc] = '';
        } else {
            board[tr][tc] = piece;
            board[fr][fc] = '';
        }
        // Rochaderechte verlieren, wenn König oder Turm zieht
        if (piece === 'K') castling.w.K = castling.w.Q = false;
        if (piece === 'k') castling.b.K = castling.b.Q = false;
        if (piece === 'R' && fr === 7 && fc === 0) castling.w.Q = false;
        if (piece === 'R' && fr === 7 && fc === 7) castling.w.K = false;
        if (piece === 'r' && fr === 0 && fc === 0) castling.b.Q = false;
        if (piece === 'r' && fr === 0 && fc === 7) castling.b.K = false;
        // En passant setzen
        if (piece.toLowerCase() === 'p' && Math.abs(tr - fr) === 2) {
            enPassant = {r: (fr + tr) / 2, c: fc, color: current};
        } else {
            enPassant = null;
        }
    }
    // Bauernumwandlung
    if ((piece === 'P' && tr === 0) || (piece === 'p' && tr === 7)) {
        promoteInfo = {r: tr, c: tc, color: piece === 'P' ? 'w' : 'b'};
        selected = null;
        highlightMoves = [];
        render();
        return;
    }
    selected = null;
    highlightMoves = [];
    // Prüfe auf Schach, Matt, Patt
    let status = getGameStatus(board, current === 'w' ? 'b' : 'w');
    if (status === 'matt') {
        gameOver = true;
        infoMsg = 'Schachmatt!';
    } else if (status === 'patt') {
        gameOver = true;
        infoMsg = 'Patt!';
    } else if (status === 'schach') {
        infoMsg = 'Schach!';
        setTimeout(() => { infoMsg = ''; render(); }, 2000);
    } else {
        infoMsg = '';
    }
    current = current === 'w' ? 'b' : 'w';
    render();
    if (mode === 'computer' && current === 'b' && !gameOver && !promoteInfo) {
        setTimeout(computerMove, 500);
    }
}

function promotePawn(r, c, piece) {
    board[r][c] = piece;
    promoteInfo = null;
    // Prüfe auf Schach, Matt, Patt nach Umwandlung
    let status = getGameStatus(board, current === 'w' ? 'b' : 'w');
    if (status === 'matt') {
        gameOver = true;
        infoMsg = 'Schachmatt!';
    } else if (status === 'patt') {
        gameOver = true;
        infoMsg = 'Patt!';
    } else if (status === 'schach') {
        infoMsg = 'Schach!';
        setTimeout(() => { infoMsg = ''; render(); }, 2000);
    } else {
        infoMsg = '';
    }
    current = current === 'w' ? 'b' : 'w';
    render();
    if (mode === 'computer' && current === 'b' && !gameOver && !promoteInfo) {
        setTimeout(computerMove, 500);
    }
}

// --- Schach-Logik ---

function getLegalMoves(r, c, b, color) {
    // Gibt alle legalen Züge für Figur an [r,c] zurück (inkl. Schachprüfung)
    let moves = [];
    const piece = b[r][c];
    if (!piece) return moves;
    const isWhite = piece === piece.toUpperCase();
    const dirs = {
        n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        b: [[-1,-1],[-1,1],[1,-1],[1,1]],
        r: [[-1,0],[1,0],[0,-1],[0,1]],
        q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
        k: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
    };
    // Bauer
    if (piece.toLowerCase() === 'p') {
        let dir = isWhite ? -1 : 1;
        // Vorwärts
        if (b[r+dir] && !b[r+dir][c]) moves.push([r+dir, c]);
        // Doppelschritt
        if ((isWhite && r === 6 || !isWhite && r === 1) && !b[r+dir][c] && !b[r+2*dir][c]) moves.push([r+2*dir, c]);
        // Schlagen
        for (let dc of [-1,1]) {
            if (b[r+dir] && b[r+dir][c+dc] && ((isWhite && b[r+dir][c+dc] === b[r+dir][c+dc].toLowerCase()) || (!isWhite && b[r+dir][c+dc] === b[r+dir][c+dc].toUpperCase()))) {
                moves.push([r+dir, c+dc]);
            }
        }
        // En passant
        if (enPassant && enPassant.r === r+dir && Math.abs(enPassant.c - c) === 1 && enPassant.color !== color) {
            // Prüfe, ob der gegnerische Bauer wirklich da steht
            let epRow = r, epCol = enPassant.c;
            let epPiece = b[epRow][epCol];
            if (epPiece && ((isWhite && epPiece === 'p') || (!isWhite && epPiece === 'P'))) {
                moves.push([r+dir, enPassant.c]);
            }
        }
    }
    // Springer
    if (piece.toLowerCase() === 'n') {
        for (let [dr, dc] of dirs.n) {
            let nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<8 && nc>=0 && nc<8 && (!b[nr][nc] || (isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase()))) {
                moves.push([nr, nc]);
            }
        }
    }
    // Läufer, Turm, Dame
    if ('brq'.includes(piece.toLowerCase())) {
        let dlist = [];
        if (piece.toLowerCase() === 'b') dlist = dirs.b;
        if (piece.toLowerCase() === 'r') dlist = dirs.r;
        if (piece.toLowerCase() === 'q') dlist = dirs.q;
        for (let [dr, dc] of dlist) {
            let nr = r+dr, nc = c+dc;
            while (nr>=0 && nr<8 && nc>=0 && nc<8) {
                if (!b[nr][nc]) {
                    moves.push([nr, nc]);
                } else {
                    if ((isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase())) {
                        moves.push([nr, nc]);
                    }
                    break;
                }
                nr += dr; nc += dc;
            }
        }
    }
    // König
    if (piece.toLowerCase() === 'k') {
        for (let [dr, dc] of dirs.k) {
            let nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<8 && nc>=0 && nc<8 && (!b[nr][nc] || (isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase()))) {
                moves.push([nr, nc]);
            }
        }
        // Rochade prüfen (nur wenn nicht im Schach und Felder frei und nicht bedroht)
        if (!skipCheck) {
            if (isWhite && r === 7 && c === 4) {
                // Kurz
                if (
                    castling.w.K &&
                    b[7][5] === '' && b[7][6] === '' &&
                    board[7][7] === 'R' &&
                    !isKingInCheck(b, 'w') &&
                    !wouldCauseCheck(7,4,7,5,b,'w') &&
                    !wouldCauseCheck(7,4,7,6,b,'w')
                ) moves.push([7,6]);
                // Lang
                if (
                    castling.w.Q &&
                    b[7][3] === '' && b[7][2] === '' && b[7][1] === '' &&
                    board[7][0] === 'R' &&
                    !isKingInCheck(b, 'w') &&
                    !wouldCauseCheck(7,4,7,3,b,'w') &&
                    !wouldCauseCheck(7,4,7,2,b,'w')
                ) moves.push([7,2]);
            }
            if (!isWhite && r === 0 && c === 4) {
                // Kurz
                if (
                    castling.b.K &&
                    b[0][5] === '' && b[0][6] === '' &&
                    board[0][7] === 'r' &&
                    !isKingInCheck(b, 'b') &&
                    !wouldCauseCheck(0,4,0,5,b,'b') &&
                    !wouldCauseCheck(0,4,0,6,b,'b')
                ) moves.push([0,6]);
                // Lang
                if (
                    castling.b.Q &&
                    b[0][3] === '' && b[0][2] === '' && b[0][1] === '' &&
                    board[0][0] === 'r' &&
                    !isKingInCheck(b, 'b') &&
                    !wouldCauseCheck(0,4,0,3,b,'b') &&
                    !wouldCauseCheck(0,4,0,2,b,'b')
                ) moves.push([0,2]);
            }
        }
    }
    // Filter: Kein Zug, der eigenen König ins Schach setzt
    if (!skipCheck) {
        moves = moves.filter(([tr, tc]) => !wouldCauseCheck(r, c, tr, tc, b, color));
    }
    return moves;
}

function wouldCauseCheck(fr, fc, tr, tc, b, color) {
    // Simuliere Zug und prüfe, ob eigener König im Schach steht
    let copy = b.map(row => row.slice());
    copy[tr][tc] = copy[fr][fc];
    copy[fr][fc] = '';
    return isKingInCheck(copy, color);
}

function isKingInCheck(b, color) {
    // Prüft, ob der König der Farbe 'color' im Schach steht
    let king = color === 'w' ? 'K' : 'k';
    let kr = -1, kc = -1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (b[r][c] === king) { kr = r; kc = c; }
    }
    if (kr === -1) return false;
    // Suche alle gegnerischen Züge
    let enemy = color === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        let p = b[r][c];
        if (!p) continue;
        if ((enemy === 'w' && p === p.toUpperCase()) || (enemy === 'b' && p === p.toLowerCase())) {
            let moves = getLegalMoves(r, c, b, enemy, true); // true = keine Rekursion
            if (moves.some(([mr, mc]) => mr === kr && mc === kc)) return true;
        }
    }
    return false;
}

function getLegalMoves(r, c, b, color, skipCheck) {
    // Gibt alle legalen Züge für Figur an [r,c] zurück (inkl. Schachprüfung)
    let moves = [];
    const piece = b[r][c];
    if (!piece) return moves;
    const isWhite = piece === piece.toUpperCase();
    const dirs = {
        n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
        b: [[-1,-1],[-1,1],[1,-1],[1,1]],
        r: [[-1,0],[1,0],[0,-1],[0,1]],
        q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
        k: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]
    };
    // Bauer
    if (piece.toLowerCase() === 'p') {
        let dir = isWhite ? -1 : 1;
        // Vorwärts
        if (b[r+dir] && !b[r+dir][c]) moves.push([r+dir, c]);
        // Doppelschritt
        if ((isWhite && r === 6 || !isWhite && r === 1) && !b[r+dir][c] && !b[r+2*dir][c]) moves.push([r+2*dir, c]);
        // Schlagen
        for (let dc of [-1,1]) {
            if (b[r+dir] && b[r+dir][c+dc] && ((isWhite && b[r+dir][c+dc] === b[r+dir][c+dc].toLowerCase()) || (!isWhite && b[r+dir][c+dc] === b[r+dir][c+dc].toUpperCase()))) {
                moves.push([r+dir, c+dc]);
            }
        }
        // En passant
        if (enPassant && enPassant.r === r+dir && Math.abs(enPassant.c - c) === 1 && enPassant.color !== color) {
            // Prüfe, ob der gegnerische Bauer wirklich da steht
            let epRow = r, epCol = enPassant.c;
            let epPiece = b[epRow][epCol];
            if (epPiece && ((isWhite && epPiece === 'p') || (!isWhite && epPiece === 'P'))) {
                moves.push([r+dir, enPassant.c]);
            }
        }
    }
    // Springer
    if (piece.toLowerCase() === 'n') {
        for (let [dr, dc] of dirs.n) {
            let nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<8 && nc>=0 && nc<8 && (!b[nr][nc] || (isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase()))) {
                moves.push([nr, nc]);
            }
        }
    }
    // Läufer, Turm, Dame
    if ('brq'.includes(piece.toLowerCase())) {
        let dlist = [];
        if (piece.toLowerCase() === 'b') dlist = dirs.b;
        if (piece.toLowerCase() === 'r') dlist = dirs.r;
        if (piece.toLowerCase() === 'q') dlist = dirs.q;
        for (let [dr, dc] of dlist) {
            let nr = r+dr, nc = c+dc;
            while (nr>=0 && nr<8 && nc>=0 && nc<8) {
                if (!b[nr][nc]) {
                    moves.push([nr, nc]);
                } else {
                    if ((isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase())) {
                        moves.push([nr, nc]);
                    }
                    break;
                }
                nr += dr; nc += dc;
            }
        }
    }
    // König
    if (piece.toLowerCase() === 'k') {
        for (let [dr, dc] of dirs.k) {
            let nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<8 && nc>=0 && nc<8 && (!b[nr][nc] || (isWhite && b[nr][nc] === b[nr][nc].toLowerCase()) || (!isWhite && b[nr][nc] === b[nr][nc].toUpperCase()))) {
                moves.push([nr, nc]);
            }
        }
        // Rochade prüfen (nur wenn nicht im Schach und Felder frei und nicht bedroht)
        if (!skipCheck) {
            if (isWhite && r === 7 && c === 4) {
                // Kurz
                if (
                    castling.w.K &&
                    b[7][5] === '' && b[7][6] === '' &&
                    board[7][7] === 'R' &&
                    !isKingInCheck(b, 'w') &&
                    !wouldCauseCheck(7,4,7,5,b,'w') &&
                    !wouldCauseCheck(7,4,7,6,b,'w')
                ) moves.push([7,6]);
                // Lang
                if (
                    castling.w.Q &&
                    b[7][3] === '' && b[7][2] === '' && b[7][1] === '' &&
                    board[7][0] === 'R' &&
                    !isKingInCheck(b, 'w') &&
                    !wouldCauseCheck(7,4,7,3,b,'w') &&
                    !wouldCauseCheck(7,4,7,2,b,'w')
                ) moves.push([7,2]);
            }
            if (!isWhite && r === 0 && c === 4) {
                // Kurz
                if (
                    castling.b.K &&
                    b[0][5] === '' && b[0][6] === '' &&
                    board[0][7] === 'r' &&
                    !isKingInCheck(b, 'b') &&
                    !wouldCauseCheck(0,4,0,5,b,'b') &&
                    !wouldCauseCheck(0,4,0,6,b,'b')
                ) moves.push([0,6]);
                // Lang
                if (
                    castling.b.Q &&
                    b[0][3] === '' && b[0][2] === '' && b[0][1] === '' &&
                    board[0][0] === 'r' &&
                    !isKingInCheck(b, 'b') &&
                    !wouldCauseCheck(0,4,0,3,b,'b') &&
                    !wouldCauseCheck(0,4,0,2,b,'b')
                ) moves.push([0,2]);
            }
        }
    }
    // Filter: Kein Zug, der eigenen König ins Schach setzt
    if (!skipCheck) {
        // Filter: Kein Zug, der eigenen König ins Schach setzt
        moves = moves.filter(([tr, tc]) => !wouldCauseCheck(r, c, tr, tc, b, color));
    }
    return moves;
}

function getGameStatus(b, color) {
    // Gibt 'schach', 'matt', 'patt' oder '' zurück
    if (isKingInCheck(b, color)) {
        // Gibt es noch legale Züge?
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            let p = b[r][c];
            if (!p) continue;
            if ((color === 'w' && p === p.toUpperCase()) || (color === 'b' && p === p.toLowerCase())) {
                if (getLegalMoves(r, c, b, color).length > 0) return 'schach';
            }
        }
        return 'matt';
    } else {
        // Patt?
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            let p = b[r][c];
            if (!p) continue;
            if ((color === 'w' && p === p.toUpperCase()) || (color === 'b' && p === p.toLowerCase())) {
                if (getLegalMoves(r, c, b, color).length > 0) return '';
            }
        }
        return 'patt';
    }
}

function winnerText() {
    if (infoMsg === 'Schachmatt!') return current === 'w' ? 'Schwarz gewinnt!' : 'Weiß gewinnt!';
    if (infoMsg === 'Patt!') return 'Unentschieden!';
    return '';
}

function resetGame() {
    board = initialBoard();
    current = 'w';
    selected = null;
    highlightMoves = [];
    gameOver = false;
    promoteInfo = null;
    infoMsg = '';
    castling = {w: {K: true, Q: true}, b: {K: true, Q: true}};
    enPassant = null;
    render();
}

function computerMove() {
    // Verbesserte KI: Minimax-Tiefe 2, Materialbewertung, manchmal absichtlich schwächer
    let allMoves = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        let p = board[r][c];
        if (p && p === p.toLowerCase()) {
            let moves = getLegalMoves(r, c, board, 'b');
            for (let [tr, tc] of moves) {
                allMoves.push({from:[r,c], to:[tr,tc]});
            }
        }
    }
    if (allMoves.length === 0) return;

    // Bewertung aller Züge mit Minimax (Tiefe 2)
    function evaluateBoard(b) {
        // Materialbewertung + Bonus für Schach, Matt, Drohungen
        let value = 0;
        const pieceVals = {q:9, r:5, b:3, n:3, p:1, k:0};
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            let p = b[r][c];
            if (!p) continue;
            let v = pieceVals[p.toLowerCase()] || 0;
            if (p === p.toLowerCase()) value += v;
            else value -= v;
        }
        // Bonus/Malus für Schach/Matt
        let status = getGameStatus(b, 'w');
        if (status === 'matt') value += 1000;
        if (status === 'schach') value += 0.5;
        status = getGameStatus(b, 'b');
        if (status === 'matt') value -= 1000;
        if (status === 'schach') value -= 0.5;
        return value + (Math.random()-0.5)*0.01; // kleine Zufallsstreuung
    }

    function cloneBoard(b) {
        return b.map(row => row.slice());
    }

    function makeMoveOnBoard(b, move) {
        let newB = cloneBoard(b);
        let piece = newB[move.from[0]][move.from[1]];
        newB[move.to[0]][move.to[1]] = piece;
        newB[move.from[0]][move.from[1]] = '';
        // Bauernumwandlung (immer Dame)
        if (piece === 'p' && move.to[0] === 7) newB[move.to[0]][move.to[1]] = 'q';
        return newB;
    }

    // Minimax Tiefe 2: Computer (max), dann Spieler (min)
    let moveScores = allMoves.map(move => {
        let after = makeMoveOnBoard(board, move);
        // Spielerzug simulieren
        let minScore = Infinity;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            let p = after[r][c];
            if (p && p === p.toUpperCase()) {
                let moves = getLegalMoves(r, c, after, 'w');
                for (let [tr, tc] of moves) {
                    let after2 = makeMoveOnBoard(after, {from:[r,c],to:[tr,tc]});
                    let score = evaluateBoard(after2);
                    
                }
            }
        }
        // Falls Spieler keine Züge hat (Matt/Patt)
        if (minScore === Infinity) minScore = evaluateBoard(after);
        return {move, score: minScore};
    });

    // Sortiere nach bester Bewertung (höchster Score ist am besten für Schwarz)
    moveScores.sort((a, b) => b.score - a.score);

    // Schwierigkeitsgrad: ca. jedes 3. Mal absichtlich schlechterer Zug
    let idx = 0;
    if (Math.random() < 0.33 && moveScores.length > 2) {
        // Wähle einen der 3 besten Züge zufällig, aber nicht immer den besten
        idx = Math.floor(Math.random() * Math.min(3, moveScores.length));
    }
    let chosen = moveScores[idx].move;

    makeMove(chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1]);
}

render();
if (mode === 'computer' && current === 'b' && !gameOver && !promoteInfo) {
    setTimeout(computerMove, 500);
}
