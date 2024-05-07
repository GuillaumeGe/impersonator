function MOCK() { 
    this.createPlayer = (id, name, avatarIndex, score, words, offline)=>  {
        return {
            id: id,
            name: name,
            avatarIndex: avatarIndex,
            score: score,
            words: words !== undefined ? words : [],
            isOffline: offline,
            votes: []
        };
    }

    this.createPlayers = () => {
        return [
            this.createPlayer("26739123", "Guillaume", 9, 150 , ["Aubergine", "sucre", "poisson"]),
            this.createPlayer("26739289", "Marcello", 5, 275, ["truffe", "viande", "aliment"]),
            this.createPlayer("26739246", "Seb", 8, 450, ["etat", "bouche", "nourriture"]),
            this.createPlayer("26739207", "Franklin", 7, 50, ["boisson", "miel", "rouge"]),
            this.createPlayer("26739129", "Martin", 0, 275, ["bocal", "pêche", "ocean"]),
            this.createPlayer("26739280", "Anonyme", 3, 200, ["mer", "Alcool", "manger"]),
            this.createPlayer("26739242", "Jack", 2, 120, ["gazeux", "lait", "ruche"]),
            this.createPlayer("26739245", "Test", 11, 375, ["festin", "anniversaire", "truite"]),
        ]
    }

    this.createSession = (config, player, id) => {
        return {
            id: id ?? "MOCK_TEST_ID",
            playerIds: [player?.id],
            impersonatorIds: [player?.id],
            turnIndex: 0,
            currentWord: "bottle",
            words: ["cream", "tea", "bottle", "wine"],
            idleTime: 0,
            config: config
        };
    }
};
