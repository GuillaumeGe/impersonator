const WebSocket = require('ws');
//const http = require('http');
const express = require('express');
const Session = require('./classes/Session.js');
const Player = require('./classes/Player.js');

const WS_MESSAGE_TYPE_UNKNOWN = "";
const WS_MESSAGE_TYPE_UPDATE_SESSION = "";
const WS_MESSAGE_TYPE_UPDATE_PLAYERS = "";
const WS_MESSAGE_TYPE_SESSION_EXPIRED = "";

const AUTHORIZED_USERS = [
    {
        username: "guillaume",
        password: "JeSuisUnNainPosteur"
    },
    {
        username: "marcello",
        password: "JeSuisUnNainPosteur"
    }
]

function WSMessage(messageType, data) {
    return {
        type: messageType,
        data: data
    }
}

const MAX_SESSIONS = 10;
const BASE_SESSION_CONFIG = {
    minPlayers: 4,
    maxPlayers: 10,
    maxImpersonators: 1,
    maxWords: 10,
    maxTurns: 3,
    enablePlayerTimer: false,
    lang: "fr"
}

class App {
    constructor(port) {
        this.clients = []; // Store connected clients
        this.sessions = [];
        this.wss = new WebSocket.Server({ noServer: true }); // Create a WebSocket server instance
        this.wss.on('connection', this.onWSSConnection);
        this.httpServer = express();
        this.tokens = [];

        // Start the HTTP server
        const PORT = port ?? 3000;
        this.httpServer.listen(PORT, () => {
            console.log(`HTTP server running on port ${PORT}`);
        });

        // Upgrade HTTP server to support WebSocket
        this.httpServer.on('upgrade', (req, socket, head) => {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        });
        this.httpServer.use(express.json())    // <==== parse request body as JSON
        this.initRouter();
    }

    authorize = (token) => {
        return true;
    }

    initRouter = () => {
        this.httpServer.put('/authorize', (req, res) => {
            if (1) {
                res.json({
                    token: "aaabbb444", 
                });
            } else {
                res.writeHead(403);
                res.end();
            }
        });


        this.httpServer.get('/sessions', (req, res) => {
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
        });

        this.httpServer.get('/sessions/:sessionId', (req, res) => {
            const session = this.getSessionById(req.params.sessionId);
            if (session !== undefined) {
                res.json(
                    this.session.JSON()
                );
            }
        });

        this.httpServer.get('/sessions/:sessionId/players', (req, res) => {
            const session = this.getSessionById(req.params.sessionId);
            if (session !== undefined) {
                res.json(
                    this.session.players.map(p => p.id)
                );
            }
        });

        this.httpServer.post('/sessions', (req, res) => {
            if (this.sessions.length < MAX_SESSIONS) {
                const config = req.body ?? BASE_SESSION_CONFIG;
                const session = new Session(config, this.removeSession);
                this.sessions.push(session);
                res.json(session.JSON());
            } else {
                //TODO: response.statusCode = 422;
                res.json({ error: "Too many sessions are running ! Try again later" });
            }
        });

        this.httpServer.post('/sessions/:sessionId/players', (req, res) => {
            const session = this.getSessionById(req.params.sessionId);
            const dataObject = req.body;
            if (session !== undefined) {
                const player = session.addPlayer(dataObject.name);
                if (player !== undefined) {
                    //response.statusCode = 200;
                    res.json(player.JSON());
                } else {
                    //response.statusCode = 422;
                    res.json({ error: "Session is full" });
                }
            }
        });

        this.httpServer.put('/sessions/:sessionId/players/:playerId', (req, res) => {
            const session = this.getSessionById(req.params.sessionId);
            const dataObject = req.body;
            if (session !== undefined) {
                const player = session.getPlayerById(req.params.playerId);
                if (player !== undefined) {
                    player.name = dataObject.name;
                    player.avatarIndex = dataObject.avatarIndex;

                    this.broadcast(WSMessage(WS_MESSAGE_TYPE_UPDATE_PLAYERS, {
                        players: session.players.map(p => p.JSON())
                    }))
                    res.json(player.JSON());
                }
            }
        });

        this.httpServer.delete("/sessions", (req, res) => {
            this.removeAllSessions();
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
        });

        this.httpServer.delete("/sessions/:sessionId/players/:playerId", (req, res) => {
            //this.removeAllSessions();
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
        });
    }

    onWSSConnection = (ws) => {
        console.log('Client connected');
    
        // Add client to the list
        this.clients.push(ws);
    
        // Handle incoming messages
        ws.on('message', (message) => {
            console.log('Received:', message);
            
            // Broadcast the received message to all clients
            this.broadcast(WSMessage(WS_MESSAGE_TYPE_UNKNOWN, message));
        });
    
        // Handle client disconnection
        ws.on('close', () => {
            console.log('Client disconnected');
            
            // Remove client from the list
            this.clients.splice(clients.indexOf(ws), 1);
        });
    }

    getSessionById = (id) => {
        if (id === undefined) {
            return undefined;
        }
        //TODO: convert to dict ?

        for(const session of this.sessions) {
            if (session.id === id) {
                return session;
            }
        }
    }

    removeSession = (session) => {
        const sessionIndex = this.sessions.findIndex(s => s.id == session.id);
        if (sessionIndex !== undefined) {
            const message = "Session " + session.id + " has expired !";
            session.close();
            console.warn(message);
            this.broadcast(WSMessage(WS_MESSAGE_TYPE_SESSION_EXPIRED, {
                sessionId: session.id
            }));
            //TODO: split array
            this.sessions.splice(sessionIndex, 1);
        }
    }
    
    removeAllSessions = () => {
        for (const session in this.sessions) {
            this.removeSession(session);
        }
    }
    
    // Broadcast function to send messages to all clients
    broadcast = (message) => {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    };
}

const app = new App(3000);






