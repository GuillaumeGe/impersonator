function MOCK() { 
    this.createPlayer = (id, name, avatarIndex, score, words, offline)=>  {
        return {
            id: id,
            name: name,
            avatarIndex: avatarIndex,
            score: score,
            words: words !== undefined ? words : [],
            isOffline: offline
        };
    }

    this.createPlayers = () => {
        return [
            this.createPlayer("26739123", "Guillaume", 9, 150),
            this.createPlayer("26739289", "Seb", 5, 200),
            this.createPlayer("26739246", "Martin", 8, 400),
            this.createPlayer("26739207", "Franklin", 7, 50),
        ]
    }

    this.createSession = (players) => {
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
