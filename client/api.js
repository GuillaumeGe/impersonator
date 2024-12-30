function ImpersonatorAPI (serverBaseUrl, errorCallback) {
	this.baseUrl = serverBaseUrl;
	this.token = undefined;
	this.onError = errorCallback;
	this.onFailure = undefined;
	
	this._call = async function(method, path, body, queryParams, authRequest) {
		if (authRequest) {
			
		}

		let p = new Promise((resolve, reject) => {
			if (path != undefined && method != undefined) {
				let fullPath = this.baseUrl + path;
				const self = this;
				const authRequest = path == "/authorize";

				if (queryParams === undefined) {
					queryParams = {};
				}
				if (this.token !== undefined) {
					queryParams["token"] = this.token;
				}

				let queryString = new URLSearchParams(queryParams).toString();
				if (queryString !== undefined && queryString !== "") {
					fullPath += "?" + queryString;
				}

				$.ajax({
					type: method,
					url:  fullPath,
					data: JSON.stringify(body),
					dataType: 'json',
					contentType: 'application/json',
					headers: {
						"Custom-Authenticate": "Yes"
					},
					success: function(response) {
						resolve(response);
					},
					error:function(response, error) {
						if (!authRequest) {
							if (self.onError !== undefined) {
								self.onError(response);
							}
						}

						reject(error);
					},
					fail: function(response) {
						if (self.onFailure !== undefined) {
							self.onFailure(response);
						}

						reject(response);
					}
				});
			} else {
				resolve(undefined);
			}
		});

		return await p;
	}
	
	this.authorize = async function (username, password) {
		const result = await this._call(
			"GET", 
			"authorize", 
			{
				"username": username,
				"password": password 
			}, 
			undefined,
			true
		);
	}

	this.getSession = async function(sessionId) {
		return await this._call("GET", `/sessions/${sessionId}`);
	}
	
	this.createSession = async function(playerInfos, config) {
		return await this._call("POST", `/sessions`, playerInfos);
	}
	
	this.joinSessionCreatePlayer = async function(sessionId, playerInfos) {
		return await this._call("POST", `/sessions/${sessionId}/players`, playerInfos);
	}

	this.joinSessionUpdatePlayer = async function(sessionId, playerId, playerInfos) {
		return await this._call("POST", `/sessions/${sessionId}/players/${playerId}`, playerInfos);
	}
	
	this.startSession = async function(sessionId) {
		return await this._call("POST", `/sessions/${sessionId}/actions/start`);
	}

	this.getPlayers = async function(sessionId) {
		return await this._call("GET", `/sessions/${sessionId}/players`);
	}
	
	this.deleteSession = async function(sessionId) {
		return await this._call("DELETE", `/sessions/${sessionId}`);
	}
	
	this.deleteAllSession = async function() {
		return await this._call("DELETE", `/sessions`);
	}
}

function ImpersonatorMockAPI() { 

	this.config = {};

	//TODO: refactor and send 401 if unauthorized
	this.authorize = async function (username, password) {
		let access = "revoked";
		if (username === "mockUser" && password  === "mockPassword") {
			access = "granted";
		}

		return {
			access: access,
			token: "mockToken"
		}
	}

	this._promise = function(response) {
		return response;
	}
	
	this.startSession = async function(sessionId) {
		return {}
	}
	
	this.deleteSession = async function(sessionId) {
		return {}
	}
	
	this.deleteAllSession = async function() {
		return {}
	}

    this._createPlayers = () => {
        return [
            this._createPlayer("1", "Guillaume", 9, 150 , ["Aubergine", "sucre", "poisson"]),
            this._createPlayer("2", "Mr. T", 5, 275, ["truffe", "viande", "aliment"]),
            this._createPlayer("3", "Seb", 8, 450, ["etat", "bouche", "nourriture"]),
            this._createPlayer("4", "Franklin", 7, 50, ["boisson", "miel", "rouge"]),
            this._createPlayer("5", "Martin", 0, 275, ["bocal", "pêche", "ocean"]),
            this._createPlayer("6", "Anonyme", 3, 200, ["mer", "Alcool", "manger"]),
            this._createPlayer("7", "Jack", 2, 120, ["gazeux", "lait", "ruche"]),
            this._createPlayer("8", "Test", 11, 375, ["festin", "anniversaire", "truite"]),
        ]
    }

	this._getDefaultConfig = () => {
		return {

		}
	}

	this.joinSessionCreatePlayer = async function(sessionId, playerInfos) {
        return {
            id: (await this.getSession(sessionId)).playerIds.length + 1,
            name: playerInfos.name,
            avatarIndex: playerInfos.avatarIndex,
            score: 0,
            words: [],
            isOffline: false,
            votes: []
		}
    }

	this.joinSessionUpdatePlayer = async function(sessionId, playerId, playerInfos) {
		return {
            id: playerId,
            name: playerInfos.name,
            avatarIndex: playerInfos.avatarIndex,
            score: 0,
            words: [],
            isOffline: false,
            votes: []
        };
	}

	this.getPlayer = async (playerId) => {
		return this._createPlayer[6];
	}

	this.getPlayers = async function(sessionId) {
		return this._createPlayers;
	}

	this.createSession = async (playerInfos, config) => {
		if (config !== undefined) {
			this.config = config;
		}
		return {
            id: "MOCK_SESSION_ID",
            playerIds: [playerInfos?.id],
            impersonatorIds: [],
            turnIndex: 0,
            currentWord: "bottle",
            words: ["cream", "tea", "bottle", "wine"],
            idleTime: 0,
            config: this.config
        }
	}

	this.getSession = async function(sessionId) {
		return {
            id: sessionId,
            playerIds: ["1", "2"],
            impersonatorIds: [],
            turnIndex: 0,
            currentWord: "bottle",
            words: ["cream", "tea", "bottle", "wine"],
            idleTime: 0,
            config: this.config
        };
	}
};
