function MOCK() { 

    createPlayer() = function(id, name, avatarIndex, score, words) {
        return {
            id: id,
            name: name,
            avatarIndex: avatarIndex,
            score: score,
            words: words !== undefined ? words : []
        };
    }

    createPlayers() = function() {
        return [
            this.createPlayer("26739123", "Guillaume", 9),
            this.createPlayer("26739289", "Seb", 5),
            this.createPlayer("26739246", "Martin", 8),
            this.createPlayer("26739207", "Franklin", 7),
        ]
    }

    createSession = function(players) {
        return {
            sessionId: "123665",
            playerIds: this.createPlayers().map(player => player.id),
            impersonatorIds: players !== undefined ? [players[0].id] : undefined,
            turnIndex: 0,
            currentWord: "bottle",
            words: ["cream", "tea", "bottle", "wine"],
            idleTime: 0
        };
    }


    
};
