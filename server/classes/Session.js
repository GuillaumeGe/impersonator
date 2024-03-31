const fs = require('fs');
const path = require('path');

function generateID() {
    return 'yxxxAxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function pickRandomElements(array, x) {
    // Create a copy of the original array to avoid modifying it
    const copyArray = array.slice();
    const randomElements = [];

    // Pick x random elements
    for (let i = 0; i < x; i++) {
        // Generate a random index within the range of the copyArray length
        const randomIndex = Math.floor(Math.random() * copyArray.length);
        
        // Remove the selected element from the copyArray and add it to the result
        randomElements.push(copyArray.splice(randomIndex, 1)[0]);
    }

    return randomElements;
}

module.exports = class Session {
    constructor(config, sessionExpiredCallBack) {
        this.id = generateID();
        this.players = [];
        this.impersonators = []; // ref to one or more players
        this.turnIndex = 0;
        this.wordIndex = 0;
        this.words = [];
        this.config = config;
        this.idleTime = 0;
        this._sessionExpiredCallBack = sessionExpiredCallBack;
        this._loopTimer = undefined;

        this.reset();
    }

    reset = function () {
        this.turnIndex = 0;
        this.wordIndex = 0;
        this.words = [];

        try {
            const data = fs.readFileSync("../data/dataset_fr_1.json", 'utf8');
            const wordsDataset = JSON.parse(data)["words"];
            this.words = pickRandomElements(wordsDataset, this.config.maxWords);
        } catch {
            console.log("Failed to load words");
        }
        
        clearInterval(this._loopTimer);

        this._loopTimer = setInterval(function () {
            this.idleTime += 1;
            if (this.idleTime >= 3600 && this._sessionExpiredCallBack !== undefined) {
                this._sessionExpiredCallBack(this);
            }
        }.bind(this), 1000);
    };

    addPlayer = function (name) {
        if (this.players.length < this.config.maxPlayers) {
            const player = new Player(name);
            this.players.push(player);

            return player;
        }
    };

    getPlayerById = function(id) {
        if (id === undefined) {
            return undefined;
        }

        for(const player of this.players) {
            if (player.id === id) {
                return player;
            }
        }
    }

    close = function () {
        clearInterval(this._loopTimer);
    };

    getCurrentWord = function () {
        if (this.wordIndex < this.words) {
            return this.words[this.wordIndex];
        }

        return undefined;
    };

    nextWord = function () {
        if (this.players.length > this.config.minPlayers) {
            this.impersonators = pickRandomElements(this.players, this.config.maxImpersonators);
        }
        this.wordIndex++;
        this.idleTime = 0;
        return getCurrentWord();
    };

    nextTurn = function () {
        this.idleTime = 0;
    };

    JSON = function () {
        return {
            sessionId: this.id,
            config: this.config,
            totalPlayers: this.players.length,
            totalImpersonators: this.impersonators.length,
            turnIndex: this.turnIndex,
            currentWord: this.getCurrentWord(),
            words: this.words,
            idleTime: this.idleTime
        };
    };
}