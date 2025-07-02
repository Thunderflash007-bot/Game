let selectedGame = null;

function selectGame(game) {
    selectedGame = game;
    document.querySelector('.game-list').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'block';
}

function startGame(mode) {
    window.location.href = `${selectedGame}.html?mode=${mode}`;
}
