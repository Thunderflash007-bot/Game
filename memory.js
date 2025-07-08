document.getElementById('game').innerText = 'Hier kommt Memory hin.';

const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const size = 4;
let cards = [];
let flipped = [];
let matched = [];
let moves = 0;
let lock = false;

function shuffle(arr) {
    for (let i = arr.length-1; i > 0; i--) {
        let j = Math.floor(Math.random()*(i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function resetGame() {
    let values = [];
    for (let i = 1; i <= size*size/2; i++) {
        values.push(i, i);
    }
    shuffle(values);
    cards = values;
    flipped = [];
    matched = [];
    moves = 0;
    lock = false;
    render();
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
            const idx = r*size + c;
            const td = document.createElement('td');
            td.style.width = '70px';
            td.style.height = '70px';
            td.style.fontSize = '2em';
            td.style.textAlign = 'center';
            td.style.border = '2px solid #1877c9';
            td.style.cursor = matched.includes(idx) ? 'default' : 'pointer';
            td.style.background = matched.includes(idx) ? '#8fd694' : '#fffbe6';
            td.innerText = (flipped.includes(idx) || matched.includes(idx)) ? cards[idx] : '';
            td.onclick = () => handleFlip(idx);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    gameDiv.appendChild(table);

    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    info.innerText = matched.length === size*size ? `Fertig! Züge: ${moves}` : `Züge: ${moves}`;
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

// Verbesserte Logik: Animation, bessere Touch-Unterstützung, keine Doppelklicks
function handleFlip(idx) {
    if (lock || flipped.includes(idx) || matched.includes(idx)) return;
    flipped.push(idx);
    render();
    if (flipped.length === 2) {
        moves++;
        lock = true;
        setTimeout(() => {
            if (cards[flipped[0]] === cards[flipped[1]]) {
                matched.push(...flipped);
            }
            flipped = [];
            lock = false;
            render();
        }, 600);
    }
}
gameDiv.addEventListener('touchstart', function(e) {
    if (matched.length === size*size) { resetGame(); return; }
    const rect = gameDiv.querySelector('table').getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const r = Math.floor(y / (rect.height / size));
    const c = Math.floor(x / (rect.width / size));
    handleFlip(r*size + c);
}, {passive: false});

resetGame();
    const rect = gameDiv.querySelector('table').getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left, y = t.clientY - rect.top;
    const r = Math.floor(y / (rect.height / size));
    const c = Math.floor(x / (rect.width / size));
    handleFlip(r*size + c);
{passive: false};

resetGame();
