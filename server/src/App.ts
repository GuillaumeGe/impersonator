import WebSocket from 'ws';
import express from 'express';

import {Session} from './Session';
import { AuthrizationService } from './AuthorizationService';

const WS_MESSAGE_TYPE_UNKNOWN = "";
const WS_MESSAGE_TYPE_UPDATE_SESSION = "";
const WS_MESSAGE_TYPE_UPDATE_PLAYERS = "";
const WS_MESSAGE_TYPE_SESSION_EXPIRED = "";


function WSMessage(messageType, data) {
    return {
        type: messageType,
        data: data
    }
}

const DEFAULT_PORT = 3000;
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
    clients: any[];
    sessions: any[];
    wss: express.WebSocket;
    httpServer: any;
    authService: AuthrizationService;
    session: any;

    constructor(port: number) {
        this.clients = []; // Store connected clients
        this.sessions = [];
        this.wss = new WebSocket.Server({ noServer: true }); // Create a WebSocket server instance
        this.wss.on('connection', this.onWSSConnection);
        this.httpServer = express();
        this.authService = new AuthrizationService(); 

        this.httpServer.listen(port, () => {
            console.log(`HTTP server running on port ${port}`);
        });

        // Upgrade HTTP server to support WebSocket
        this.httpServer.on('upgrade', (req: Request, socket: WebSocket, head) => {
            this.wss.handleUpgrade(req, socket, head, (ws) => {
                this.wss.emit('connection', ws, req);
            });
        });
        this.httpServer.use(express.json())    // <==== parse request body as JSON
        this.initRouter();
    }

    initRouter = () => {
        this.httpServer.put('/authorize', (req: express.Request, res: express.Response) => {
            const token = this.authService.authorize(req.body.username, req.body.password);

            if (token !== undefined) {
                res.json({
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken,
                    expires: token.expirationDate.toString(),
                    generated: token.generationDate.toString()
                });
            } else {
                res.writeHead(403);
            }
            res.end();
        });


        this.httpServer.get('/sessions', (req: express.Request, res: express.Response) => {
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
            res.end();
        });

        this.httpServer.get('/sessions/:sessionId', (req: express.Request, res: express.Response) => {
            const session = this.getSessionById(req.params.sessionId);
            if (session !== undefined) {
                res.json(
                    this.session.JSON()
                );
            } else {
                res.writeHead(404, "No session with ID " + req.params.sessionId);
            }
            res.end();
        });

        this.httpServer.get('/sessions/:sessionId/players', (req: express.Request, res: express.Response) => {
            const session = this.getSessionById(req.params.sessionId);
            if (session !== undefined) {
                res.json(
                    this.session.players.map(p => p.id)
                );
            } else {
                res.writeHead(404, "No session with ID " + req.params.sessionId);
            }
            res.end();
        });

        this.httpServer.post('/sessions', (req: express.Request, res: express.Response) => {
            //TODO: authorize
            if (this.sessions.length < MAX_SESSIONS) {
                const config = req.body.config ?? BASE_SESSION_CONFIG;
                const player = req.body.player;
                const session = new Session(config, this.removeSession, player != undefined ? [player] : []);
                this.sessions.push(session);
                res.json(session.JSON());
            } else {
                res.writeHead(422, "Too many sessions are running ! Try again later");
            }
            res.end();
        });

        this.httpServer.post('/sessions/:sessionId/players', (req: express.Request, res: express.Response) => {
            const session = this.getSessionById(req.params.sessionId);
            const dataObject = req.body;
            if (session !== undefined) {
                const player = session.addPlayer(dataObject.name);
                if (player !== undefined) {
                    //response.statusCode = 200;
                    res.json(player.JSON());
                } else {
                    //response.statusCode = 422;
                    res.writeHead(422, "Session is full");
                }
            } else {
                res.writeHead(404, "No session with ID " + req.params.sessionId);
            }
            res.end();
        });

        this.httpServer.put('/sessions/:sessionId/players/:playerId', (req: express.Request, res: express.Response) => {
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
                } else {
                    res.writeHead(404, `No player with ID ${req.params.playerId} in session with ID ${req.params.sessionId}`);
                }
            } else {
                res.writeHead(404, "No session with ID " + req.params.sessionId);
            }
            res.end();
        });

        this.httpServer.delete("/sessions", (req: Request, res: express.Response) => {
            this.removeAllSessions();
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
            res.end();
        });

        this.httpServer.delete("/sessions/:sessionId/players/:playerId", (req: express.Request, res: express.Response) => {
            //this.removeAllSessions();
            res.json({
                sessions: this.sessions.map((session) => session.id), 
            });
            res.end();
        });
    }

    onWSSConnection = (ws: WebSocket) => {
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
            this.clients.splice(this.clients.indexOf(ws), 1);
        });
    }

    getSessionById = (id: string) => {
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

    removeSession = (session: Session) => {
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
    
    removeAllSessions(): void {
        for (const session of this.sessions) {
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

const app = new App(DEFAULT_PORT);






