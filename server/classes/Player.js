function generateID() {
    return 'yxxxAxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = class Player {
    constructor(name, imgIndex) {
        this.id = generateID();
        this.name = name;
        this.words = [];
        this.vote = undefined;
        this.score = 0;
    }

    JSON = function () {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            words: this.words
        };
    };
}