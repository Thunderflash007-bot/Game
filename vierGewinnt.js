document.getElementById('game').innerText = 'Hier kommt das 4 Gewinnt Spiel hin.';
// ...hier später Spiellogik einfügen...
// Optional: Modus aus URL lesen und KI aktivieren

const rows = 6, cols = 7;
let board = Array.from({length: rows}, () => Array(cols).fill(0));
let currentPlayer = 1; // 1 = Rot, 2 = Gelb
let gameOver = false;
let mode = getMode();
let animating = false;
let winner = 0;
let hoverCol = -1; // aktuell gehighlightete Spalte

function getMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'zweispieler';
}

function render() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    // SVG-Board
    const w = 420, h = 360, cell = 60, margin = 10;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.style.display = "block";
    svg.style.margin = "0 auto";
    svg.style.background = "#1877c9";
    svg.style.borderRadius = "18px";
    svg.style.boxShadow = "0 0 16px #bbb";
    svg.style.touchAction = "none";

    // Felder (mit Hover-Highlight)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", c * cell + cell/2 + margin);
            circle.setAttribute("cy", r * cell + cell/2 + margin);
            circle.setAttribute("r", cell/2 - 6);
            if (hoverCol === c && !gameOver && !animating && board[0][c] === 0) {
                circle.setAttribute("stroke", "#ffe066");
                circle.setAttribute("stroke-width", "4");
            } else {
                circle.setAttribute("stroke", "#fff");
                circle.setAttribute("stroke-width", "0");
            }
            circle.setAttribute("fill", "#fff");
            svg.appendChild(circle);
        }
    }
    // Steine
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] !== 0) {
                const stone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                stone.setAttribute("cx", c * cell + cell/2 + margin);
                stone.setAttribute("cy", r * cell + cell/2 + margin);
                stone.setAttribute("r", cell/2 - 10);
                stone.setAttribute("fill", board[r][c] === 1
                    ? "url(#redGrad)" : "url(#yellowGrad)");
                stone.setAttribute("stroke", "#888");
                stone.setAttribute("stroke-width", "2");
                svg.appendChild(stone);
            }
        }
    }
    // Farbverlauf für Steine
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <radialGradient id="redGrad" cx="60%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="70%" stop-color="#ff6666"/>
        <stop offset="100%" stop-color="#c00"/>
      </radialGradient>
      <radialGradient id="yellowGrad" cx="60%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="70%" stop-color="#ffe066"/>
        <stop offset="100%" stop-color="#d4b200"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    game.appendChild(svg);

    // Event-Handler für Hover und Klicks
    setTimeout(() => setSVGListeners(svg), 0);

    // Info/Meldung unter dem Spielfeld
    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.style.minHeight = '1.5em';
    if (gameOver) {
        info.innerText = winnerText();
        info.style.color = (winner === 1 ? '#c00' : winner === 2 ? '#bfa600' : '#222');
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

function setSVGListeners(svg) {
    const cell = 60, margin = 10;
    svg.onmousemove = function(e) {
        if (gameOver || animating) return;
        const rect = svg.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const col = Math.floor((x - rect.left - margin) / cell);
        if (col !== hoverCol) {
            hoverCol = (col >= 0 && col < cols) ? col : -1;
            render();
        }
    };
    svg.onmouseleave = function() {
        if (hoverCol !== -1) {
            hoverCol = -1;
            render();
        }
    };
    svg.onclick = function(e) {
        if (gameOver || animating) return;
        const rect = svg.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const col = Math.floor((x - rect.left - margin) / cell);
        if (col >= 0 && col < cols) handleMoveAnimated(col);
    };
    svg.ontouchstart = function(e) {
        svg.onclick(e);
    };
}

function highlightColumn(svg, col, on) {
    // Hebt die Spalte optisch hervor
    const cell = 60, margin = 10;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + c;
            const circle = svg.childNodes[idx + 1]; // +1 wegen defs
            if (!circle || circle.tagName !== "circle") continue;
            if (on && c === col && board[0][c] === 0) {
                circle.setAttribute("stroke", "#ffe066");
                circle.setAttribute("stroke-width", "4");
            } else {
                circle.setAttribute("stroke", "#fff");
                circle.setAttribute("stroke-width", "0");
            }
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
    }, 35);
}

function finishMove(r, c) {
    if (checkWin(r, c)) {
        gameOver = true;
        winner = currentPlayer;
    } else if (board.flat().every(x => x !== 0)) {
        gameOver = true;
        winner = 0;
    } else {
        currentPlayer = 3 - currentPlayer;
        if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
            setTimeout(computerMove, 500);
        }
    }
    render();
}

function computerMove() {
    // KI: Gewinnzug, Blockzug, sonst zufällig
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
    if (winner === 0) return 'Unentschieden!';
    return (winner === 1 ? 'Rot' : 'Gelb') + ' gewinnt!';
}

function resetGame() {
    board = Array.from({length: rows}, () => Array(cols).fill(0));
    currentPlayer = 1;
    gameOver = false;
    animating = false;
    winner = 0;
    render();
}

render();
if (mode === 'computer' && currentPlayer === 2 && !gameOver) {
    setTimeout(computerMove, 500);
}