// Helper to create a card image element
function createCardImg(card) {
    let cardImg = document.createElement("img");
    cardImg.src = "./cards/" + card + ".png";
    cardImg.alt = card + " card";
    cardImg.onerror = function() {
        this.src = "./cards/BACK.png";
        this.alt = "Card back";
    };
    return cardImg;
}

// Helper to display a player's sum
function displayPlayerSum(playerIdx) {
    const sumElem = document.getElementById(`player-sum-${playerIdx}`);
    if (sumElem) {
        sumElem.textContent = `Sum: ${reduceAce(playerSums[playerIdx], playerAceCounts[playerIdx])}`;
    }
}
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
    // Show/hide player name inputs when number of players changes
    const numPlayersInput = document.getElementById("num-players-input");
    numPlayersInput.oninput = function() {
        let n = Math.max(1, Math.min(7, parseInt(numPlayersInput.value) || 1));
        const namesArea = document.getElementById("player-names-area");
        namesArea.innerHTML = "";
        for (let i = 1; i <= n; i++) {
            const label = document.createElement("label");
            label.textContent = `Player ${i} Name:`;
            label.setAttribute("for", `player-name-input-${i}`);
            label.style.marginRight = "0.5em";
            const input = document.createElement("input");
            input.type = "text";
            input.id = `player-name-input-${i}`;
            input.value = `Player ${i}`;
            input.style.marginBottom = "0.5em";
            input.style.fontSize = "1em";
            namesArea.appendChild(label);
            namesArea.appendChild(input);
            namesArea.appendChild(document.createElement("br"));
        }
    };
    numPlayersInput.oninput(); // initialize on load

    document.getElementById("start-game-btn").onclick = function() {
        let decksInput = document.getElementById("num-decks-input").value;
        let playersInput = document.getElementById("num-players-input").value;
        numDecks = Math.max(1, Math.min(8, parseInt(decksInput) || 1));
        numPlayers = Math.max(1, Math.min(7, parseInt(playersInput) || 1));
        // Get player names from inputs
        playerNames = [];
        for (let i = 1; i <= numPlayers; i++) {
            let nameInput = document.getElementById(`player-name-input-${i}`);
            let name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : `Player ${i}`;
            playerNames.push(name);
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

    // Dealer logic: deal two cards, one hidden
    hidden = deck.pop(); // face down
    let visible = deck.pop(); // face up
    dealerSum = getValue(hidden) + getValue(visible);
    dealerAceCount = checkAce(hidden) + checkAce(visible);
    // Show hidden card (face down)
    document.getElementById("dealer-cards").innerHTML = `<img id='hidden' src='./cards/BACK.png' alt='Hidden card'>`;
    // Show visible card (face up)
    document.getElementById("dealer-cards").append(createCardImg(visible));

    // Deal 2 cards to each player
    playerSums = [];
    playerAceCounts = [];
    playerActive = [];
    for (let p = 0; p < numPlayers; p++) {
        let sum = 0;
        let aceCount = 0;
        for (let i = 0; i < 2; i++) {
            let card = deck.pop();
            let cardImg = createCardImg(card);
            sum += getValue(card);
            aceCount += checkAce(card);
            document.getElementById(`player-cards-${p}`).append(cardImg);
        }
        playerSums.push(sum);
        playerAceCounts.push(aceCount);
        playerActive.push(true);
        displayPlayerSum(p);
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
        let card = deck.pop();
        let cardImg = createCardImg(card);
        playerSums[currentPlayer] += getValue(card);
        playerAceCounts[currentPlayer] += checkAce(card);
        document.getElementById(`player-cards-${currentPlayer}`).append(cardImg);
        displayPlayerSum(currentPlayer);
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
            // All players done, dealer's turn
            dealerTurn();
        }
    function dealerTurn() {
        // Reveal hidden card
        const hiddenImg = document.getElementById("hidden");
        if (hiddenImg) {
            hiddenImg.src = "./cards/" + hidden + ".png";
            hiddenImg.alt = hidden + " card";
        }
        // Dealer draws until 17 or higher
        while (reduceAce(dealerSum, dealerAceCount) < 17) {
            let card = deck.pop();
            let cardImg = createCardImg(card);
            dealerSum += getValue(card);
            dealerAceCount += checkAce(card);
            document.getElementById("dealer-cards").append(cardImg);
        }
        endRound();
    }
    }

    function endRound() {
        document.getElementById("hit").disabled = true;
        document.getElementById("stay").disabled = true;
        document.getElementById("hidden").src = "./cards/" + hidden + ".png";
        dealerSum = reduceAce(dealerSum, dealerAceCount);
        let results = "";
        // Dealer result logic
        let dealerResult = "";
        let dealerClass = "";
        if (dealerSum > 21) {
            dealerResult = "Bust!";
            dealerClass = "result-bust";
        } else {
            dealerResult = `Sum: ${dealerSum}`;
            dealerClass = "result-win";
        }
        // Display dealer sum and result
        const dealerSumElem = document.getElementById("dealer-sum");
        if (dealerSumElem) {
            dealerSumElem.innerHTML = `${dealerSum} <span class='${dealerClass}'>(${dealerResult})</span>`;
        }

        for (let p = 0; p < numPlayers; p++) {
            let sum = reduceAce(playerSums[p], playerAceCounts[p]);
            let msg = "";
            let resultClass = "";
            if (sum > 21) {
                msg = "Bust!";
                resultClass = "result-bust";
            } else if (dealerSum > 21) {
                msg = "Win!";
                resultClass = "result-win";
            } else if (sum === dealerSum) {
                msg = "Tie!";
                resultClass = "result-tie";
            } else if (sum > dealerSum) {
                msg = "Win!";
                resultClass = "result-win";
            } else {
                msg = "Lose!";
                resultClass = "result-lose";
            }
            // Display result next to player's sum with vibrant color
            const sumElem = document.getElementById(`player-sum-${p}`);
            if (sumElem) {
                sumElem.innerHTML = `Sum: ${sum} <span class='${resultClass}'>(${msg})</span>`;
            }
            // Highlight player seat with result color
            const seatElem = document.getElementById(`player-cards-${p}`)?.parentElement;
            if (seatElem) {
                seatElem.classList.remove("seat-result-win", "seat-result-bust", "seat-result-tie", "seat-result-lose");
                seatElem.classList.add(`seat-${resultClass}`);
            }
            results += `<span class='${resultClass}'>${playerNames[p]}: ${msg}</span> `;
        }
        document.getElementById("results").innerText = results;
        // Show Next Round button
        const nextBtn = document.getElementById("next-round");
        if (nextBtn) {
            nextBtn.style.display = "inline-block";
        }
        // Next Round button handler
        document.getElementById("next-round").onclick = function() {
            resetRound();
        };
    // Reset for a new round, keeping player names and settings
    function resetRound() {
        // Hide Next Round button
        const nextBtn = document.getElementById("next-round");
        if (nextBtn) nextBtn.style.display = "none";
        // Clear results
        document.getElementById("results").innerText = "";
        // Remove seat highlights
        for (let p = 0; p < numPlayers; p++) {
            const seatElem = document.getElementById(`player-cards-${p}`)?.parentElement;
            if (seatElem) {
                seatElem.classList.remove("seat-result-win", "seat-result-bust", "seat-result-tie", "seat-result-lose");
            }
        }
        // Rebuild and shuffle deck
        buildDeck();
        shuffleDeck();
        // Start new round
        startGame();
    }
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
