document.getElementById('game').innerText = 'Hier kommt Simon Says hin.';
const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const colors = ['#ff4d4d','#ffe066','#4dd','#b366ff'];
const sounds = [
    new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
    new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg'),
    new Audio('https://actions.google.com/sounds/v1/cartoon/clang.ogg'),
    new Audio('https://actions.google.com/sounds/v1/cartoon/wood_block.ogg')
];
let sequence = [];
let userSeq = [];
let level = 0;
let state = 'idle'; // 'idle', 'show', 'input', 'gameover'

function resetGame() {
    sequence = [];
    userSeq = [];
    level = 0;
    state = 'idle';
    render();
}

function render() {
    gameDiv.innerHTML = '';
    const board = document.createElement('div');
    board.style.display = 'grid';
    board.style.gridTemplateColumns = 'repeat(2, 120px)';
    board.style.gridTemplateRows = 'repeat(2, 120px)';
    board.style.gap = '18px';
    board.style.justifyContent = 'center';
    board.style.margin = '30px auto 0 auto';
    for (let i = 0; i < 4; i++) {
        const btn = document.createElement('button');
        btn.style.width = '120px';
        btn.style.height = '120px';
        btn.style.borderRadius = '24px';
        btn.style.background = colors[i];
        btn.style.border = '3px solid #fff';
        btn.style.boxShadow = '0 2px 8px #bbb';
        btn.style.fontSize = '2em';
        btn.style.opacity = state === 'show' ? '0.7' : '1';
        btn.disabled = !(state === 'input');
        btn.onclick = () => handleInput(i);
        board.appendChild(btn);
    }
    gameDiv.appendChild(board);

    const info = document.createElement('div');
    info.style.marginTop = '24px';
    info.style.fontSize = '1.3em';
    info.style.fontWeight = 'bold';
    if (state === 'gameover') {
        info.innerText = `Game Over! Level: ${level}`;
        info.style.color = '#c00';
    } else if (state === 'idle') {
        info.innerText = 'Starte das Spiel!';
        info.style.color = '#1877c9';
    } else {
        info.innerText = `Level: ${level}`;
        info.style.color = '#388e3c';
    }
    gameDiv.appendChild(info);

    if (state === 'show' && sequence.length > 0) {
        const seqDiv = document.createElement('div');
        seqDiv.innerText = `Sequenz: ${sequence.map(i => i+1).join(' ')}`;
        seqDiv.style.marginTop = '12px';
        seqDiv.style.fontSize = '1em';
        seqDiv.style.color = '#555';
        gameDiv.appendChild(seqDiv);
    }
    if (state === 'input' && userSeq.length > 0) {
        const inputDiv = document.createElement('div');
        inputDiv.innerText = `Deine Eingabe: ${userSeq.map(i => i+1).join(' ')}`;
        inputDiv.style.marginTop = '12px';
        inputDiv.style.fontSize = '1em';
        inputDiv.style.color = '#1877c9';
        gameDiv.appendChild(inputDiv);
    }

    const startBtn = document.createElement('button');
    startBtn.innerText = level === 0 || state === 'gameover' ? 'Start' : 'Neustart';
    startBtn.onclick = startGame;
    startBtn.style.marginTop = '18px';
    startBtn.style.padding = '10px 24px';
    startBtn.style.fontSize = '1.1em';
    startBtn.style.borderRadius = '8px';
    startBtn.style.background = '#ffe066';
    startBtn.style.border = '1px solid #1877c9';
    startBtn.style.cursor = 'pointer';
    gameDiv.appendChild(startBtn);
}

function startGame() {
    sequence = [];
    userSeq = [];
    level = 0;
    state = 'idle';
    nextLevel();
}

function nextLevel() {
    level++;
    userSeq = [];
    sequence.push(Math.floor(Math.random()*4));
    state = 'show';
    render();
    setTimeout(() => playSequence(0), 700);
}

function playSequence(idx) {
    const btns = gameDiv.querySelectorAll('button');
    if (idx >= sequence.length) {
        state = 'input';
        render();
        return;
    }
    const btnIdx = sequence[idx];
    btns[btnIdx].style.opacity = '1';
    sounds[btnIdx].currentTime = 0;
    sounds[btnIdx].play();
    setTimeout(() => {
        btns[btnIdx].style.opacity = '0.7';
        setTimeout(() => playSequence(idx+1), 500);
    }, 500);
}

function handleInput(i) {
    if (state !== 'input') return;
    userSeq.push(i);
    sounds[i].currentTime = 0;
    sounds[i].play();
    const btns = gameDiv.querySelectorAll('button');
    btns[i].style.opacity = '1';
    setTimeout(() => { btns[i].style.opacity = '0.7'; }, 200);

    if (sequence[userSeq.length-1] !== i) {
        state = 'gameover';
        render();
        return;
    }
    if (userSeq.length === sequence.length) {
        setTimeout(nextLevel, 800);
    } else {
        render();
    }
}

// Verbesserte Logik: Touch, Tastatur, Animation, Reset
document.addEventListener('keydown', function(e) {
    if (state === 'gameover' && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (state !== 'input') return;
    if (/^[1-4]$/.test(e.key)) handleInput(parseInt(e.key)-1);
});
gameDiv.addEventListener('touchstart', function(e) {
    if (state === 'gameover') { resetGame(); return; }
    if (state !== 'input') return;
    const btn = e.target.closest('button');
    if (btn && btn.parentNode && btn.parentNode.childNodes) {
        const idx = Array.from(btn.parentNode.childNodes).indexOf(btn);
        if (idx >= 0 && idx < 4) handleInput(idx);
    }
}, {passive: false});

render();
