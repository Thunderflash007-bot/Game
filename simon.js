document.getElementById('game').innerText = 'Hier kommt Simon Says hin.';
// ...hier später Spiellogik einfügen...
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
let playing = false;
let gameOver = false;

function resetGame() {
    sequence = [];
    userSeq = [];
    level = 0;
    playing = false;
    gameOver = false;
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
        btn.style.opacity = playing ? '0.7' : '1';
        btn.disabled = playing || gameOver;
        btn.onclick = () => handleInput(i);
        board.appendChild(btn);
    }
    gameDiv.appendChild(board);

    const info = document.createElement('div');
    info.style.marginTop = '24px';
    info.style.fontSize = '1.3em';
    info.style.fontWeight = 'bold';
    if (gameOver) {
        info.innerText = `Game Over! Level: ${level}`;
        info.style.color = '#c00';
    } else if (!playing && level === 0) {
        info.innerText = 'Starte das Spiel!';
        info.style.color = '#1877c9';
    } else {
        info.innerText = `Level: ${level}`;
        info.style.color = '#388e3c';
    }
    gameDiv.appendChild(info);

    const startBtn = document.createElement('button');
    startBtn.innerText = level === 0 ? 'Start' : 'Neustart';
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
    gameOver = false;
    nextLevel();
}

function nextLevel() {
    level++;
    userSeq = [];
    sequence.push(Math.floor(Math.random()*4));
    playing = true;
    render();
    playSequence(0);
}

function playSequence(idx) {
    if (idx >= sequence.length) {
        playing = false;
        render();
        return;
    }
    const btns = gameDiv.querySelectorAll('button');
    btns[sequence[idx]].style.opacity = '1';
    sounds[sequence[idx]].currentTime = 0;
    sounds[sequence[idx]].play();
    setTimeout(() => {
        btns[sequence[idx]].style.opacity = '0.7';
        setTimeout(() => playSequence(idx+1), 400);
    }, 400);
}

function handleInput(i) {
    if (playing || gameOver) return;
    userSeq.push(i);
    sounds[i].currentTime = 0;
    sounds[i].play();
    const btns = gameDiv.querySelectorAll('button');
    btns[i].style.opacity = '1';
    setTimeout(() => { btns[i].style.opacity = '0.7'; }, 200);
    if (sequence[userSeq.length-1] !== i) {
        gameOver = true;
        render();
        return;
    }
    if (userSeq.length === sequence.length) {
        setTimeout(nextLevel, 600);
    }
}

// Verbesserte Logik: Touch, Tastatur, Animation, Reset
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (gameOver) return;
    if (/^[1-4]$/.test(e.key)) handleInput(parseInt(e.key)-1);
});
gameDiv.addEventListener('touchstart', function(e) {
    if (gameOver) { resetGame(); return; }
    const btn = e.target.closest('button');
    if (btn && btn.parentNode && btn.parentNode.childNodes) {
        const idx = Array.from(btn.parentNode.childNodes).indexOf(btn);
        if (idx >= 0 && idx < 4) handleInput(idx);
    }
}, {passive: false});

render();
