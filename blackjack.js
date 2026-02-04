function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

let dealerSum = 0;
let dealerAceCount = 0;
let hidden;
let deck;
let numDecks = 1;
let numPlayers = 1;
let playerNames = [];

// Multiplayer state
let playerSums = [];
let playerAceCounts = [];
let playerActive = [];
let currentPlayer = 0;

window.onload = function() {
    // Show modal to select number of decks and players
    document.getElementById("startup-modal").style.display = "flex";
    document.getElementById("start-game-btn").onclick = function() {
        let decksInput = document.getElementById("num-decks-input").value;
        let playersInput = document.getElementById("num-players-input").value;
        numDecks = Math.max(1, Math.min(8, parseInt(decksInput) || 1));
        numPlayers = Math.max(1, Math.min(7, parseInt(playersInput) || 1));
        // Generate player names: Player 1, Player 2, ...
        playerNames = [];
        for (let i = 1; i <= numPlayers; i++) {
            playerNames.push("Player " + i);
        }
        document.getElementById("startup-modal").style.display = "none";
        buildDeck();
        shuffleDeck();
        startGame();
    };
}

function buildDeck() {
    let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let types = ["C", "D", "H", "S"];
    deck = [];

    for (let d = 0; d < numDecks; d++) {
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < values.length; j++) {
                deck.push(values[j] + "-" + types[i]); //A-C -> K-C, A-D -> K-D
            }
        }
    }
}

function startGame() {
    // Clear previous hands if any
    document.getElementById("dealer-cards").innerHTML = '<img id="hidden" src="./cards/BACK.png">';
    const playersRow = document.getElementById("players-row");
    playersRow.innerHTML = "";

    // Render player seats in a straight row with separators
    for (let p = 0; p < numPlayers; p++) {
        if (p > 0) {
            const sep = document.createElement("div");
            sep.className = "player-separator";
            playersRow.appendChild(sep);
        }
        const seat = document.createElement("div");
        seat.className = "player-seat";
        seat.innerHTML = `<div class=\"player-name\">${playerNames[p]}</div><div class=\"player-cards\" id=\"player-cards-${p}\"></div><div class=\"player-sum\" id=\"player-sum-${p}\"></div>`;
        playersRow.appendChild(seat);
    }

    // Dealer logic
    hidden = deck.pop();
    dealerSum = 0;
    dealerAceCount = 0;
    dealerSum += getValue(hidden);
    dealerAceCount += checkAce(hidden);
    while (dealerSum < 17) {
        let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "./cards/" + card + ".png";
        cardImg.alt = card + " card";
        cardImg.onerror = function() {
            this.src = "./cards/BACK.png";
            this.alt = "Card back";
        };
        dealerSum += getValue(card);
        dealerAceCount += checkAce(card);
        document.getElementById("dealer-cards").append(cardImg);
    }

    // Deal 2 cards to each player
    playerSums = [];
    playerAceCounts = [];
    playerActive = [];
    for (let p = 0; p < numPlayers; p++) {
        let sum = 0;
        let aceCount = 0;
        for (let i = 0; i < 2; i++) {
            let cardImg = document.createElement("img");
            let card = deck.pop();
            cardImg.src = "./cards/" + card + ".png";
            cardImg.alt = card + " card";
            cardImg.onerror = function() {
                this.src = "./cards/BACK.png";
                this.alt = "Card back";
            };
            sum += getValue(card);
            aceCount += checkAce(card);
            document.getElementById(`player-cards-${p}`).append(cardImg);
        }
        playerSums.push(sum);
        playerAceCounts.push(aceCount);
        playerActive.push(true);
        document.getElementById(`player-sum-${p}`).textContent = `Sum: ${sum}`;
    }

    // Disable buttons during dealing
    document.getElementById("hit").disabled = true;
    document.getElementById("stay").disabled = true;

    currentPlayer = 0;
    updatePlayerTurnUI();
    document.getElementById("hit").onclick = hit;
    document.getElementById("stay").onclick = stay;

    // Enable buttons after a short delay to ensure all cards are displayed
    setTimeout(() => {
        updatePlayerTurnUI();
    }, 300);
}

    function updatePlayerTurnUI() {
        // Highlight current player
        for (let p = 0; p < numPlayers; p++) {
            const seat = document.getElementById(`player-cards-${p}`).parentElement;
            if (p === currentPlayer && playerActive[p]) {
                seat.style.boxShadow = "0 0 16px 4px #2ecc40";
            } else {
                seat.style.boxShadow = "none";
            }
        }
        // Enable/disable buttons
        document.getElementById("hit").disabled = !playerActive[currentPlayer];
        document.getElementById("stay").disabled = !playerActive[currentPlayer];
    }

    function hit() {
        if (!playerActive[currentPlayer]) return;
        let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "./cards/" + card + ".png";
        cardImg.alt = card + " card";
        cardImg.onerror = function() {
            this.src = "./cards/BACK.png";
            this.alt = "Card back";
        };
        playerSums[currentPlayer] += getValue(card);
        playerAceCounts[currentPlayer] += checkAce(card);
        document.getElementById(`player-cards-${currentPlayer}`).append(cardImg);
        document.getElementById(`player-sum-${currentPlayer}`).textContent = `Sum: ${playerSums[currentPlayer]}`;
        if (reduceAce(playerSums[currentPlayer], playerAceCounts[currentPlayer]) > 21) {
            playerActive[currentPlayer] = false;
            nextPlayer();
        }
        updatePlayerTurnUI();
    }

    function stay() {
        if (!playerActive[currentPlayer]) return;
        playerActive[currentPlayer] = false;
        nextPlayer();
        updatePlayerTurnUI();
    }

    function nextPlayer() {
        // Advance to next active player
        let found = false;
        for (let i = currentPlayer + 1; i < numPlayers; i++) {
            if (playerActive[i]) {
                currentPlayer = i;
                found = true;
                break;
            }
        }
        if (!found) {
            // All players done, reveal dealer and show results
            endRound();
        }
    }

    function endRound() {
        document.getElementById("hit").disabled = true;
        document.getElementById("stay").disabled = true;
        document.getElementById("hidden").src = "./cards/" + hidden + ".png";
        dealerSum = reduceAce(dealerSum, dealerAceCount);
        let results = "";
        for (let p = 0; p < numPlayers; p++) {
            let sum = reduceAce(playerSums[p], playerAceCounts[p]);
            let msg = "";
            if (sum > 21) {
                msg = "Bust!";
            } else if (dealerSum > 21) {
                msg = "Win!";
            } else if (sum === dealerSum) {
                msg = "Tie!";
            } else if (sum > dealerSum) {
                msg = "Win!";
            } else {
                msg = "Lose!";
            }
            results += `${playerNames[p]}: ${msg} `;
        }
        document.getElementById("results").innerText = results;
    }
    // ...removed legacy single-player dealing code...


    // ...all obsolete single-player code removed...

function getValue(card) {
    let data = card.split("-"); // "4-C" -> ["4", "C"]
    let value = data[0];

    if (isNaN(value)) { //A J Q K
        if (value == "A") {
            return 11;
        }
        return 10;
    }
    return parseInt(value);
}

function checkAce(card) {
    if (card[0] == "A") {
        return 1;
    }
    return 0;
}

function reduceAce(playerSum, playerAceCount) {
    while (playerSum > 21 && playerAceCount > 0) {
        playerSum -= 10;
        playerAceCount -= 1;
    }
    return playerSum;
}
