
let dealerSum = 0;
let dealerAceCount = 0;
let hidden;
let deck;
let numDecks = 1;
let numPlayers = 1;
let playerNames = [];

// Per-player state
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
    function startGame() {
        // Clear previous hands if any
        document.getElementById("dealer-cards").innerHTML = '<img id="hidden" src="./cards/BACK.png">';
        document.getElementById("players-area").innerHTML = "";

        // Render player seats in horseshoe
        const playersArea = document.getElementById("players-area");
        const rect = playersArea.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height * 0.85;
        const radius = Math.min(centerX, centerY) * 0.85;
        const angleStart = Math.PI * 0.8;
        const angleEnd = Math.PI * 2.2;
        for (let p = 0; p < numPlayers; p++) {
            const angle = angleStart + (angleEnd - angleStart) * (p / (numPlayers - 1 || 1));
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const seat = document.createElement("div");
            seat.className = "player-seat";
            seat.style.left = `${x - 60}px`;
            seat.style.top = `${y - 40}px`;
            seat.innerHTML = `<div class=\"player-name\">${playerNames[p]}</div><div class=\"player-cards\" id=\"player-cards-${p}\"></div><div class=\"player-sum\" id=\"player-sum-${p}\"></div>`;
            playersArea.appendChild(seat);
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
                sum += getValue(card);
                aceCount += checkAce(card);
                document.getElementById(`player-cards-${p}`).append(cardImg);
            }
            playerSums.push(sum);
            playerAceCounts.push(aceCount);
            playerActive.push(true);
            document.getElementById(`player-sum-${p}`).textContent = `Sum: ${sum}`;
        }

        currentPlayer = 0;
        updatePlayerTurnUI();
        document.getElementById("hit").onclick = hit;
        document.getElementById("stay").onclick = stay;
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
    let yourSum = 0;
    let yourAceCount = 0;
    for (let i = 0; i < 2; i++) {
        let cardImg = document.createElement("img");
        let card = deck.pop();
        cardImg.src = "./cards/" + card + ".png";
        yourSum += getValue(card);
        yourAceCount += checkAce(card);
        document.getElementById("player-cards-0").append(cardImg);
    }
    document.getElementById("player-sum-0").textContent = `Sum: ${yourSum}`;

    document.getElementById("hit").addEventListener("click", hit);
    document.getElementById("stay").addEventListener("click", stay);
}

function hit() {
    if (!canHit) {
        return;
    }

    let cardImg = document.createElement("img");
    let card = deck.pop();
    cardImg.src = "./cards/" + card + ".png";
    yourSum += getValue(card);
    yourAceCount += checkAce(card);
    document.getElementById("your-cards").append(cardImg);

    if (reduceAce(yourSum, yourAceCount) > 21) { //A, J, 8 -> 1 + 10 + 8
        canHit = false;
    }

}

function stay() {
    dealerSum = reduceAce(dealerSum, dealerAceCount);
    yourSum = reduceAce(yourSum, yourAceCount);

    canHit = false;
    document.getElementById("hidden").src = "./cards/" + hidden + ".png";

    let message = "";
    if (yourSum > 21) {
        message = "You Lose!";
    }
    else if (dealerSum > 21) {
        message = "You win!";
    }
    //both you and dealer <= 21
    else if (yourSum == dealerSum) {
        message = "Tie!";
    }
    else if (yourSum > dealerSum) {
        message = "You Win!";
    }
    else if (yourSum < dealerSum) {
        message = "You Lose!";
    }

    document.getElementById("dealer-sum").innerText = dealerSum;
    document.getElementById("your-sum").innerText = yourSum;
    document.getElementById("results").innerText = message;
}

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
