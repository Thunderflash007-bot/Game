const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const words = ['BANANE','APFEL','KATZE','HUND','SCHULE','TISCH','STUHL','GARTEN','BLUME','FISCH'];
let word = '';
let guessed = [];
let wrong = [];
let maxWrong = 7;
let gameOver = false;

function resetGame() {
    word = words[Math.floor(Math.random()*words.length)];
    guessed = [];
    wrong = [];
    gameOver = false;
    render();
}

function render() {
    gameDiv.innerHTML = '';
    // Wortanzeige
    const wordDiv = document.createElement('div');
    wordDiv.style.fontSize = '2em';
    wordDiv.style.letterSpacing = '0.5em';
    wordDiv.style.margin = '20px 0';
    wordDiv.innerText = word.split('').map(l => guessed.includes(l) ? l : '_').join(' ');
    gameDiv.appendChild(wordDiv);

    // Buchstaben
    const lettersDiv = document.createElement('div');
    lettersDiv.style.margin = '18px auto';
    lettersDiv.style.maxWidth = '400px';
    for (let i = 65; i <= 90; i++) {
        const ch = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.innerText = ch;
        btn.disabled = guessed.includes(ch) || wrong.includes(ch) || gameOver;
        btn.style.margin = '2px';
        btn.style.padding = '6px 12px';
        btn.style.fontSize = '1.1em';
        btn.style.borderRadius = '8px';
        btn.onclick = () => handleGuess(ch);
        lettersDiv.appendChild(btn);
    }
    gameDiv.appendChild(lettersDiv);

    // Galgen
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    canvas.style.display = 'block';
    canvas.style.margin = '18px auto';
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20,160); ctx.lineTo(160,160); // Boden
    ctx.moveTo(60,160); ctx.lineTo(60,20); // Pfosten
    ctx.lineTo(120,20); // Querbalken
    ctx.lineTo(120,40); // Seil
    ctx.stroke();
    if (wrong.length > 0) { ctx.beginPath(); ctx.arc(120,55,15,0,2*Math.PI); ctx.stroke(); } // Kopf
    if (wrong.length > 1) { ctx.beginPath(); ctx.moveTo(120,70); ctx.lineTo(120,110); ctx.stroke(); } // Körper
    if (wrong.length > 2) { ctx.beginPath(); ctx.moveTo(120,80); ctx.lineTo(100,100); ctx.stroke(); } // Arm links
    if (wrong.length > 3) { ctx.beginPath(); ctx.moveTo(120,80); ctx.lineTo(140,100); ctx.stroke(); } // Arm rechts
    if (wrong.length > 4) { ctx.beginPath(); ctx.moveTo(120,110); ctx.lineTo(100,140); ctx.stroke(); } // Bein links
    if (wrong.length > 5) { ctx.beginPath(); ctx.moveTo(120,110); ctx.lineTo(140,140); ctx.stroke(); } // Bein rechts
    if (wrong.length > 6) { ctx.beginPath(); ctx.moveTo(112,52); ctx.lineTo(118,58); ctx.moveTo(118,52); ctx.lineTo(112,58); ctx.stroke(); } // X-Auge

    gameDiv.appendChild(canvas);

    // Info
    const info = document.createElement('div');
    info.style.marginTop = '18px';
    info.style.fontSize = '1.2em';
    if (gameOver) {
        info.innerText = guessedWord() ? 'Gewonnen!' : `Verloren! Das Wort war: ${word}`;
        info.style.color = guessedWord() ? '#388e3c' : '#c00';
    } else {
        info.innerText = `Fehler: ${wrong.length} / ${maxWrong}`;
    }
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

function handleGuess(ch) {
    if (gameOver || guessed.includes(ch) || wrong.includes(ch)) return;
    if (word.includes(ch)) {
        guessed.push(ch);
        if (guessedWord()) gameOver = true;
    } else {
        wrong.push(ch);
        if (wrong.length >= maxWrong) gameOver = true;
    }
    render();
}

function guessedWord() {
    return word.split('').every(l => guessed.includes(l));
}

// Verbesserte Steuerung: Tastatur (Buchstaben), Enter für Neustart, Touch
document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === "Enter" || e.key === " ")) { resetGame(); return; }
    if (gameOver) return;
    if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toUpperCase());
});
gameDiv.addEventListener('touchstart', function(e) {
    if (gameOver) { resetGame(); return; }
    const btn = e.target.closest('button');
    if (btn && btn.innerText.length === 1) handleGuess(btn.innerText);
}, {passive: false});

resetGame();
resetGame();
