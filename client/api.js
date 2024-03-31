function ImpersonatorAPI (serverBaseUrl, errorCallback) {
	this.baseUrl = serverBaseUrl;
	this.token = undefined;
	this.onError = undefined;
	this.onFailure = undefined;
	
	this._call = async function(method, path, body, queryParams, authRequest) {
		if (authRequest) {
			
		}

		let p = new Promise(resolve => {
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
					error:function(response) {
						if (!authRequest) {
							if (self.onError !== undefined) {
								self.onError(response);
							}
						}

						resolve(response);
					},
					fail: function(response) {
						if (self.onFailure !== undefined) {
							self.onFailure(response);
						}

						resolve(response);
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
	
	this.createSession = async function() {
		return await this._call("POST", "/sessions");
	}
	
	this.joinSession = async function(sessionId, playerInfos) {
		return await this._call("POST", '/sessions/{sessionId}/players', playerInfos);
	}
	
	this.startSession = async function(sessionId) {
		return await this._call("POST", '/sessions/{sessionId}/actions/start');
	}
	
	this.deleteSession = async function(sessionId) {
		return await this._call("DELETE", '/sessions/{sessionId}');
	}
	
	this.deleteAllSession = async function() {
		return await this._call("DELETE", '/sessions');
	}
}