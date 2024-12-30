import { Player } from "./types/Player";
import {SessionConfig} from './types/SessionConfig';
import * as Utils from './Utils';
import * as path from 'path';
import * as fs from 'fs';


export class Session {
    public id: string;
    public players: Player[];
    public impersonators: Player[];
    public turnIndex: number;
    public wordIndex: number;
    public words: string[];
    
    private idleTime: number;
    private config: SessionConfig;
    private sessionExpiredCallBack: (session: Session) => void;
    private loopTimerID: NodeJS.Timeout | undefined;
    
    constructor(config: SessionConfig, sessionExpiredCallBack?: (session: Session) => void, players?: Player[]) {
        this.id = Utils.generateID();
        this.players = players ?? [];
        this.impersonators = []; // ref to one or more players
        this.turnIndex = 0;
        this.wordIndex = 0;
        this.words = [];
        this.config = config;
        this.idleTime = 0;
        this.sessionExpiredCallBack = sessionExpiredCallBack;
        this.loopTimerID = undefined;

        this.reset();
    }

    public reset(): void {
        this.turnIndex = 0;
        this.wordIndex = 0;
        this.words = [];

        try {
            const data = fs.readFileSync("../data/dataset_fr_1.json", 'utf8');
            const wordsDataset = JSON.parse(data)["words"];
            this.words = Utils.pickRandomElements(wordsDataset, this.config.maxWords);
        } catch {
            console.log("Failed to load words");
        }
        
        clearInterval(this.loopTimerID);

        this.loopTimerID = setInterval(function () {
            this.idleTime += 1;
            if (this.idleTime >= 3600 && this._sessionExpiredCallBack !== undefined) {
                this._sessionExpiredCallBack(this);
            }
        }.bind(this), 1000);
    };

    public addPlayer(name: string, avatarIndex: number): Player | undefined {
        if (this.players.length < this.config.maxPlayers) {
            const player = {
                id: Utils.generateID(),
                name: name,
                words:[],
                votePlayerIds: [],
                score: 0,
                avatarIndex: avatarIndex,
                isOffline: false
            } as Player;
            
            this.players.push(player);

            return player;
        }
        return undefined;
    };

    public getPlayerById(id: string): Player | undefined {
        if (id === undefined) {
            return undefined;
        }

        for(const player of this.players) {
            if (player.id === id) {
                return player;
            }
        }
    }

    public close(): void {
        clearInterval(this.loopTimerID);
    };

    public getCurrentWord(): string | undefined {
        if (this.wordIndex < this.words.length) {
            return this.words[this.wordIndex];
        }

        return undefined;
    };

    public nextWord(): string | undefined {
        if (this.players.length > this.config.minPlayers) {
            this.impersonators = Utils.pickRandomElements(this.players, this.config.numberOfImpersonators);
        }
        this.wordIndex++;
        this.idleTime = 0;
        return this.getCurrentWord();
    };

    public nextTurn(): void {
        this.idleTime = 0;
    };

    public nextPlayer(): void {
        this.idleTime = 0;
    }

    public JSON(): {} {
        return {
            id: this.id,
            config: this.config,
            playerIds: this.players.map(player => player.id),
            impersonatorIds: this.impersonators.map(imp => imp.id),
            turnIndex: this.turnIndex,
            currentWord: this.getCurrentWord(),
            words: this.words,
            idleTime: this.idleTime
        };
    };
}