document.getElementById('game').innerText = 'Hier kommt Sudoku hin.';
// ...hier später Spiellogik einfügen...
const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const size = 9;
let puzzle = [
    [5,3,'','',7,'','','',''],
    [6,'','',1,9,5,'','',''],
    ['','',8,'','', '', '',6,''],
    [8,'','','',6,'','','',3],
    [4,'','',8,'',3,'','',1],
    [7,'','','',2,'','','',6],
    ['','',6,'','', '', 2,8,''],
    ['','', '', 4,1,9,'','',5],
    ['','', '', '',8,'','',7,9]
];
let solution = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9]
];
let user = puzzle.map(row => row.slice());
let selected = null;
let finished = false;

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
            td.style.width = '44px';
            td.style.height = '44px';
            td.style.fontSize = '1.5em';
            td.style.textAlign = 'center';
            td.style.border = '1.5px solid #1877c9';
            td.style.background = (selected && selected[0] === r && selected[1] === c) ? '#ffe066' : '#fffbe6';
            if (puzzle[r][c] !== '') {
                td.innerText = puzzle[r][c];
                td.style.color = '#888';
            } else {
                td.innerText = user[r][c] || '';
                td.style.cursor = finished ? 'default' : 'pointer';
                td.onclick = () => handleSelect(r, c);
            }
            if (c % 3 === 2) td.style.borderRight = '3px solid #1877c9';
            if (r % 3 === 2) td.style.borderBottom = '3px solid #1877c9';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    gameDiv.appendChild(table);

    // Zahlenfeld
    if (selected && !finished) {
        const numDiv = document.createElement('div');
        numDiv.style.margin = '18px auto 0 auto';
        numDiv.style.textAlign = 'center';
        for (let n = 1; n <= 9; n++) {
            const btn = document.createElement('button');
            btn.innerText = n;
            btn.style.fontSize = '1.1em';
            btn.style.margin = '0 6px';
            btn.style.padding = '6px 16px';
            btn.style.borderRadius = '8px';
            btn.onclick = () => setNumber(n);
            numDiv.appendChild(btn);
        }
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Löschen';
        delBtn.style.fontSize = '1.1em';
        delBtn.style.margin = '0 6px';
        delBtn.style.padding = '6px 16px';
        delBtn.style.borderRadius = '8px';
        delBtn.onclick = () => setNumber('');
        numDiv.appendChild(delBtn);
        gameDiv.appendChild(numDiv);
    }

    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.innerText = finished ? 'Fertig!' : 'Fülle das Sudoku aus!';
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

function handleSelect(r, c) {
    if (puzzle[r][c] !== '' || finished) return;
    selected = [r, c];
    render();
}

function setNumber(n) {
    if (!selected) return;
    const [r, c] = selected;
    user[r][c] = n;
    selected = null;
    checkFinished();
    render();
}

function checkFinished() {
    finished = true;
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (user[r][c] != solution[r][c]) finished = false;
}

function resetGame() {
    user = puzzle.map(row => row.slice());
    selected = null;
    finished = false;
    render();
}

// Verbesserte Steuerung: Pfeiltasten, 1-9, Backspace, Enter für Neustart, Touch
document.addEventListener('keydown', function(e) {
    if (finished && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (finished) return;
    if (!selected) return;
    const [r, c] = selected;
    if (/^[1-9]$/.test(e.key)) setNumber(parseInt(e.key));
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") setNumber('');
    if (e.key === "ArrowUp" && r > 0) { selected = [r-1, c]; render(); }
    if (e.key === "ArrowDown" && r < size-1) { selected = [r+1, c]; render(); }
    if (e.key === "ArrowLeft" && c > 0) { selected = [r, c-1]; render(); }
    if (e.key === "ArrowRight" && c < size-1) { selected = [r, c+1]; render(); }
});
// Verbesserte Logik: Touch, Tastatur, Animation, Reset
gameDiv.addEventListener('touchstart', function(e) {
    if (finished) { resetGame(); return; }
    const rect = gameDiv.querySelector('table').getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const r = Math.floor(y / (rect.height / size));
    const c = Math.floor(x / (rect.width / size));
    handleSelect(r, c);
}, {passive: false});

render();
