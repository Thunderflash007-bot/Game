document.getElementById('game').innerText = 'Hier kommt Solitär hin.';
// ...hier später Spiellogik einfügen...
const gameDiv = document.getElementById('game');
gameDiv.innerHTML = '';
const suits = ['♠','♥','♦','♣'];
const colors = {'♠':'black','♣':'black','♥':'red','♦':'red'};
const ranks = [1,2,3,4,5,6,7,8,9,10,11,12,13];
let deck = [];
let piles = [[],[],[],[],[],[],[]];
let foundations = [[],[],[],[]];
let selected = null;
let offset = 0;

function shuffle(arr) {
    for (let i = arr.length-1; i > 0; i--) {
        let j = Math.floor(Math.random()*(i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function resetGame() {
    deck = [];
    for (let s of suits) for (let r of ranks) deck.push({s, r, up: false});
    shuffle(deck);
    piles = [[],[],[],[],[],[],[]];
    foundations = [[],[],[],[]];
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            let card = deck.pop();
            card.up = (j === i);
            piles[i].push(card);
        }
    }
    for (let c of deck) c.up = true;
    selected = null;
    offset = 0;
    render();
}

function render() {
    gameDiv.innerHTML = '';
    // Foundations
    const fDiv = document.createElement('div');
    fDiv.style.display = 'flex';
    fDiv.style.justifyContent = 'center';
    fDiv.style.gap = '30px';
    for (let i = 0; i < 4; i++) {
        const pileDiv = document.createElement('div');
        pileDiv.style.width = '60px';
        pileDiv.style.height = '80px';
        pileDiv.style.border = '2px solid #ffe066';
        pileDiv.style.borderRadius = '8px';
        pileDiv.style.background = '#fffbe6';
        pileDiv.style.display = 'flex';
        pileDiv.style.alignItems = 'center';
        pileDiv.style.justifyContent = 'center';
        pileDiv.style.fontSize = '2em';
        pileDiv.innerText = foundations[i].length ? cardText(foundations[i][foundations[i].length-1]) : '';
        pileDiv.onclick = () => handleFoundation(i);
        fDiv.appendChild(pileDiv);
    }
    gameDiv.appendChild(fDiv);

    // Tableau
    const tDiv = document.createElement('div');
    tDiv.style.display = 'flex';
    tDiv.style.justifyContent = 'center';
    tDiv.style.gap = '16px';
    tDiv.style.marginTop = '18px';
    for (let i = 0; i < 7; i++) {
        const pileDiv = document.createElement('div');
        pileDiv.style.width = '60px';
        pileDiv.style.minHeight = '120px';
        pileDiv.style.position = 'relative';
        for (let j = 0; j < piles[i].length; j++) {
            const card = piles[i][j];
            const cardDiv = document.createElement('div');
            cardDiv.style.position = 'absolute';
            cardDiv.style.top = (j*22)+'px';
            cardDiv.style.left = '0';
            cardDiv.style.width = '60px';
            cardDiv.style.height = '80px';
            cardDiv.style.border = '2px solid #1877c9';
            cardDiv.style.borderRadius = '8px';
            cardDiv.style.background = card.up ? '#fff' : '#b3d1f7';
            cardDiv.style.color = colors[card.s] === 'red' ? '#c00' : '#222';
            cardDiv.style.fontSize = '1.5em';
            cardDiv.style.display = 'flex';
            cardDiv.style.alignItems = 'center';
            cardDiv.style.justifyContent = 'center';
            cardDiv.style.cursor = card.up ? 'pointer' : 'default';
            cardDiv.innerText = card.up ? cardText(card) : '';
            cardDiv.onclick = () => handlePile(i, j);
            pileDiv.appendChild(cardDiv);
        }
        tDiv.appendChild(pileDiv);
    }
    gameDiv.appendChild(tDiv);

    // Deck
    const deckDiv = document.createElement('div');
    deckDiv.style.marginTop = '18px';
    deckDiv.style.textAlign = 'center';
    const drawBtn = document.createElement('button');
    drawBtn.innerText = 'Karte ziehen';
    drawBtn.onclick = drawCard;
    drawBtn.style.padding = '8px 24px';
    drawBtn.style.fontSize = '1.1em';
    drawBtn.style.borderRadius = '8px';
    drawBtn.style.background = '#ffe066';
    drawBtn.style.border = '1px solid #1877c9';
    drawBtn.style.cursor = 'pointer';
    deckDiv.appendChild(drawBtn);
    gameDiv.appendChild(deckDiv);

    // Reset
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

function cardText(card) {
    let r = card.r;
    if (r === 1) r = 'A';
    if (r === 11) r = 'J';
    if (r === 12) r = 'Q';
    if (r === 13) r = 'K';
    return r + card.s;
}

function handlePile(i, j) {
    if (!piles[i][j].up) {
        if (j === piles[i].length-1) {
            piles[i][j].up = true;
            render();
        }
        return;
    }
    if (selected) {
        // Move selected to here if allowed
        let sel = selected;
        let moving = piles[sel[0]].slice(sel[1]);
        let dest = piles[i][j];
        if (
            moving[0].r === dest.r-1 &&
            colors[moving[0].s] !== colors[dest.s]
        ) {
            piles[i] = piles[i].concat(moving);
            piles[sel[0]].splice(sel[1]);
            selected = null;
            render();
        } else {
            selected = null;
            render();
        }
    } else {
        selected = [i, j];
    }
}

function handleFoundation(i) {
    if (!selected) return;
    let sel = selected;
    let moving = piles[sel[0]].slice(sel[1]);
    if (moving.length === 1) {
        let card = moving[0];
        let f = foundations[i];
        if (
            (f.length === 0 && card.r === 1) ||
            (f.length > 0 && card.s === f[f.length-1].s && card.r === f[f.length-1].r+1)
        ) {
            foundations[i].push(card);
            piles[sel[0]].splice(sel[1]);
            selected = null;
            render();
        }
    }
}

function drawCard() {
    // Ziehe Karte aus Deck auf Tableau
    for (let i = 0; i < 7; i++) {
        if (deck.length) {
            let card = deck.pop();
            card.up = true;
            piles[i].push(card);
        }
    }
    render();
}

// Verbesserte Logik: Drag & Drop mit Maus/Touch, Animation, Reset
let drag = null;
gameDiv.addEventListener('mousedown', function(e) {
    // Drag & Drop für Karten (optional: später implementieren)
});
gameDiv.addEventListener('touchstart', function(e) {
    // Drag & Drop für Karten (optional: später implementieren)
}, {passive: false});
document.addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.key === " ") resetGame();
});

resetGame();
