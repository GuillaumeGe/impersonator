const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');


function generateUUID() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, function(c) {
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

function Player(name, imgIndex) {
    this.id = generateUUID();
    this.name = name;
    this.words = [];
    this.vote = undefined;
    this.score = 0;

    this.JSON = function() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            words: this.words
        }
    }
}

function Session(config) {
    this.id = generateUUID();
    this.players = [];
    this.impersonators = []; // ref to one or more players
    this.turnIndex = 0;
    this.wordIndex = 0;
    this.words = [];
    this.config = config;
    this.idleTime = 0;
    this.loopTimer = undefined;

    this.reset = function() {
        this.turnIndex = 0;
        this.wordIndex = -1;
        this.words = [];
        
        if (this.config.datasetURL != undefined) {
            const data = fs.readFileSync(this.config.datasetURL, 'utf8');
            if (data) {
                try {
                    const wordsDataset = JSON.parse(data)["words"];
                    this.words = pickRandomElements(wordsDataset, maxWords);
                } catch {
    				
                }
            }
        }
        
        clearInterval(this.loopTimer);

        this.loopTimer = setInterval(function() {
            this.idleTime += 1;
        }.bind(this), 1000);
    }

    this.addPlayer = function(name) {
        if (this.players.length < this.config.maxPlayers) {
            const player = new Player(name);
            this.players.push(player);

            return player;
        }
    }

    this.close = function() {
        clearInterval(this.loopTimer);
    }

    this.getCurrentWord = function() {
        if (this.wordIndex < this.words && 0 < this.wordIndex) {
            return this.words[this.wordIndex];
        }
        return undefined;
    }

    this.nextWord = function() {
        if (this.players.length > this.config.minPlayers) {
            this.impersonators = pickRandomElements(this.players, this.config.maxImpersonators);
        }
        this.wordIndex++;
        this.idleTime = 0;
        return getCurrentWord();
    }

    this.nextTurn = function() {
        this.idleTime = 0;
    }

    this.JSON = function() {
        return {
            sessionId: this.id,
            totalPlayers: this.players.length,
            totalImpersonators: this.impersonators.length,
            turnIndex: this.turnIndex,
            wordIndex: this.wordIndex,
            words: this.words,
            idleTime: this.idleTime
        }
    }
    
    this.reset();
}

// Create a WebSocket server instance
const wss = new WebSocket.Server({ noServer: true });

// Store connected clients
const wssClients = [];
const sessions = [];

const MAX_SESSIONS = 10;
const BASE_SESSION_CONFIG = {
    datasetURL: "./data/dataset_1.json",
    minPlayers: 4,
    maxPlayers: 10,
    maxImpersonators: 1,
    maxWords: 10,
    maxTurns: 3,
    enablePlayerTimer: false
}

//TODO: convert to dict ?
function getSessionById(id) {
    if (id === undefined) {
        return undefined;
    }

    for(let i = 0; i < sessions.length; i++) {
        if (sessions[i].id === id) {
            return sessions[i];
        }
    }
}

// Broadcast function to send messages to all clients
const broadcast = (message) => {
    wssClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// WebSocket server event handlers
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Add client to the list
    wssClients.push(ws);

    // Handle incoming messages
    ws.on('message', (message) => {
        console.log('Received:', message);
        
        // Broadcast the received message to all clients
        broadcast(message);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        
        // Remove client from the list
        wssClients.splice(wssClients.indexOf(ws), 1);
        // Mark player as inactive
    });
});

function getRequestBody(request) {
    return new Promise((resolve) => {
      const bodyParts = [];
      let body;
      request.on('data', (chunk) => {
        bodyParts.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(bodyParts).toString();
        resolve(body)
      });
    });
  }

// Create an HTTP server
const server = http.createServer((req, res) => {
    let response = {
        statusCode: 404,
        headers: {'Content-Type': 'application/json'},
        data: JSON.stringify({ error: '404 Not Found' })
    };

    const pathComponents = req.url.split("/");
    pathComponents.shift();
    console.log(req.method);
    console.log(pathComponents);

    if (pathComponents.length > 0) {
        if (req.method === 'GET') {
            if (pathComponents[0] === 'sessions') {
                if (pathComponents.length > 1) {
                    const session = getSessionById(pathComponents[1]);
                    if (session !== undefined) {
                        response.statusCode = 200;
                        response.data = JSON.stringify(
                            session.JSON()
                        );
                    }
                } else {
                    response.statusCode = 200;
                    response.data = JSON.stringify(
                        {
                            sessions: sessions.map((session) => session.id), 
                            totalCount: sessions.length
                        }
                    );
                }
            }
        } else if (req.method === 'POST') {
            if (pathComponents[0] === 'sessions') {
                //TODO: close idle sessions
                if (sessions.length < MAX_SESSIONS) {
                    if (pathComponents.length > 1) {
                        const session = getSessionById(pathComponents[1]);
                        if (session !== undefined) {
                            if (pathComponents.length > 2) {
                                if (pathComponents[2] == 'players') {
                                    const dataObject = req.data;
                                    const player = session.addPlayer(dataObject.name);
                                    if (player !== undefined) {
                                        response.statusCode = 200;
                                        response.data = JSON.stringify(
                                            player.JSON()
                                        );
                                    } else {
                                        response.statusCode = 422;
                                        response.data = JSON.stringify({ error: "Session is full" });
                                    }
                                }
                            }
                        }
                    } else {
                        //TODO: config by client
                        const session = new Session(BASE_SESSION_CONFIG);
                        sessions.push(session);
        
                        response.statusCode = 200;
                        response.data = JSON.stringify(
                            session.JSON()
                        );
                    }
                } else {
                    response.statusCode = 422;
                    response.data = JSON.stringify({ error: "Too many sessions are running ! Try again later" });
                }
            }
        } else if  (req.method === 'DELETE') {
            if (pathComponents[0] === 'sessions') {
                //reset sessions
                sessions = [];
                response.statusCode = 200;
                response.data = JSON.stringify(
                    {
                        sessions: sessions.map((session) => session.id), 
                        totalCount: sessions.length
                    }
                );
            }
        }
    }
    
 
    // Handle other requests
    res.writeHead(response.statusCode, response.headers);
    res.end(response.data);
});

// Upgrade HTTP server to support WebSocket
server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
});

// Start the HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});
