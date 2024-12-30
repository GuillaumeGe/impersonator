function isNullOrUndefined(value) {
	if (value === null || value === undefined) {
		return true;
	}
	return false;
}

function showElement(element, show) {
	if (!isNullOrUndefined(element)) {
		if (show) {
			element.classList.remove("hidden");
		} else {
			element.classList.add("hidden");
		}
	}
}

function SORT_SCORE_ASC(a, b) {
	if (a.score > b.score) return -1;
	if (b.score > a.score) return 1;

	return 0;
}

function SORT_SCORE_DSC(a, b) {
	if (a.score > b.score) return 1;
	if (b.score > a.score) return -1;

	return 0;
}

function getDOMElement(selectorString) {
	return document.querySelector(selectorString);
}

function getDOMElements(selectorString) {
	const result =  document.querySelectorAll(selectorString);
	return result != undefined ? result : [];
}

// 	showElement(INIT_qrCodeWrapper, true);
// }

getDOMElements(".collapse-btn").forEach(function(btn) {
	btn.addEventListener("click", function(event) {
		const elem = event.currentTarget;
		elem.classList.toggle("collapsed");
	});
});

const ClientAppState = Object.freeze({
	Error: -1,
	Init: 0,
	Game: 1,
	Vote: 2,
	Summary: 3,
	Ladder: 4,
	Terminated: 5,
});

function ClientApp(address, sessionId, playerId) {

	if (!isNullOrUndefined(address)) {
		this.api = new ImpersonatorAPI(address);
	} else {
		this.api = new ImpersonatorMockAPI();
	}
	const clientUrl = "https://gglconsulting.net/projects/impersonator/index.html"

	this.isSessionInitiator = false;
	this.session = undefined;
	this.player = undefined;
	this.state = undefined;
	this.user = undefined;

	const NOTIFICATION_ERROR_TYPE = 0;
	const NOTIFICATION_WARNING_TYPE = 1;
	const NOTIFICATION_INFO_TYPE = 2;

	this.initSelectors = function()  {
		this.NOTIFICATION_wrapper = ".notification-wrapper";
		this.INIT_playerListItemTemplate = ".templates .init .template.player-list-item";
		this.GAME_playerListItemTemplate = ".templates .game .template.player-list-item";
		this.LABD_playerListItemTemplate = ".templates .ladder .template.player-list-item";
		this.VOTE_playerListItemTemplate = ".templates .vote .template.player-list-item";

		this.INIT_view = ".view.init";
		this.INIT_createSessionSection = ".view.init .create-session";
		this.INIT_wsFeedSection = ".view.init section.ws-feed";
		this.INIT_createPlayerSection = ".view.init section.create-player";
		this.INIT_createSessionButton = ".view.init button.create";
		this.INIT_joinSessionButton = ".view.init button.join";
		this.INIT_startSessionButton = ".view.init button.start";
		this.INIT_playerNameInput = ".view.init input.name";
		this.INIT_qrCodeWrapper = ".view.init .qr-code";
		this.INIT_playerList = ".view.init .list.players";
		this.INIT_avatarListContent = ".view.init .list.avatars";
		this.INIT_avatarCarouselContent = ".view.init .carousel.avatars .content";
		this.INIT_avatarCarouselNextButton = ".view.init .carousel.avatars button.next";
		this.INIT_avatarCarouselPrevButton = ".view.init .carousel.avatars button.prev";
		this.INIT_avatarCarouselListItems = ".view.init .carousel.avatars .content .img-wrapper";
		this.INIT_avatarListItems = ".view.init .list.avatars .img-wrapper";

		this.GAME_view = ".view.game";
		this.GAME_submitButton = ".view.game button.submit";
		this.GAME_wordInput = ".view.game input.word";
		this.GAME_timerWrapper = ".view.game label.timer";
		this.GAME_playerList = ".view.game .list.players";

		this.VOTE_view = ".view.vote";
		this.VOTE_playerList = ".view.vote .list.players";
		this.VOTE_voteLeftElement = ".view.vote .vote-left";
		this.VOTE_submitButton = ".view.vote button.submit";

		this.LABD_view = ".view.ladder";
		this.LABD_playerList = ".view.ladder .list.players";
		this.LABD_nextWordButton = ".view.ladder button.next";

		this.TERM_view = ".view.terminated";
		this.TERM_restartButton = ".view.terminated .restart";
	}

	this.buildAvatarList = () => {
		let avatarListContent = "";
	
		for (let i = 0; i < AVATAR_IMGS.length; i++) {
			avatarListContent += '<div class="img-wrapper ' + (i == 0 ? "selected" : "") + '" data-index="' + i + '"><img src="../res/' + AVATAR_IMGS[i] + '.png"/></div>';
		}
		
		// getDOMElement(this.INIT_avatarListContent).innerHTML = avatarListContent;
		getDOMElement(this.INIT_avatarCarouselContent).innerHTML = avatarListContent;
		getDOMElement(this.INIT_joinSessionButton).innerHTML = this.sessionId == undefined ? "Créer une session" : "Rejoindre";
	}

	this.buildPlayerList = (players, state) => {
		this.removePlayerItemEventListeners();

		// if (state === undefined) {
		// 	this.buildPlayerList(players, ClientAppState.Init);
		// 	this.buildPlayerList(players, ClientAppState.Game);
		// 	this.buildPlayerList(players, ClientAppState.Vote);
		// 	this.buildPlayerList(players, ClientAppState.Ladder);
		// 	return;
		// }

		if (players !== undefined && Array.isArray(players)) {
			let playerListItemTemplate = undefined;
			let playerListElement = undefined;

			switch(state) {
				case ClientAppState.Init:
					playerListItemTemplate = getDOMElement(this.INIT_playerListItemTemplate).innerHTML;
					playerListElement = getDOMElement(this.INIT_playerList);
					break;
				case ClientAppState.Game:
					playerListItemTemplate = getDOMElement(this.GAME_playerListItemTemplate).innerHTML;
					playerListElement = getDOMElement(this.GAME_playerList);
					break;
				case ClientAppState.Vote:
					playerListItemTemplate = getDOMElement(this.VOTE_playerListItemTemplate).innerHTML;
					playerListElement = getDOMElement(this.VOTE_playerList);
					break;
				case ClientAppState.Ladder:
					playerListItemTemplate = getDOMElement(this.LABD_playerListItemTemplate).innerHTML;
					playerListElement = getDOMElement(this.LABD_playerList);
					players = players.sort(SORT_SCORE_ASC);
					break;
				default:
					break;
			}

			if (playerListItemTemplate !== undefined && playerListElement !== undefined) {
				//TODO: remove listeners
				playerListElement.innerHTML = "";

				for (const player of players) {
					const html = this.buildPlayerListItem(playerListItemTemplate, player);
						
					if (html !== undefined) {
						playerListElement.innerHTML += html;
					}
				}
			}
		}

		this.addPlayerItemEventListeners();
	}

	// Replaces everything it can replaces if specified needle is found
	this.buildPlayerListItem = (template, player) => {
		let result = template.trim();

		result = result.replace(/%player_name%/g, player.name);
		result = result.replace(/%player_score%/g, player.score);
		result = result.replace(/%max_score%/g, 500);
		result = result.replace(/%player_id%/g, player.id);
        result = result.replace(/%img_src%/g, `src='../res/${AVATAR_IMGS[player.avatarIndex]}.png'`);

		if (this.player !== undefined && this.player.id == player.id) {
			result = result.replace(/%player_current%/g, "current");
		} else {
			result = result.replace(/%player_current%/g, "");
		}

		if (Array.isArray(player.words)) {
			let wordsHTML = "";

			for(const word of player.words) {
				wordsHTML += `<div>${word}</div>`
			}

			result = result.replace(/%player_words%/g, wordsHTML);
		}
		
		return result;
	}

	this.removePlayerItemEventListeners = () => {
		getDOMElements(".player").forEach(function(playerItemElement) {
			playerItemElement.removeEventListener("click", () => {});
		});
	}

	this.addPlayerItemEventListeners = () => {
		getDOMElements(this.VOTE_playerList + " .player").forEach(function(playerItemElement) {
			playerItemElement.addEventListener("click", function() {
				
				if (playerItemElement.classList.contains("selected")) {
					playerItemElement.classList.toggle("selected");
				} else if (this.session.impersonatorIds.length == 1) {
					getDOMElement(this.VOTE_playerList + " .player.selected")?.classList.toggle("selected");
					playerItemElement.classList.toggle("selected");
				} else {
					if (getDOMElements(this.VOTE_playerList + " .player.selected").length < this.session.impersonatorIds.length) {
						playerItemElement.classList.toggle("selected");
					}
				}

				this.updateVoteView();
			}.bind(this));
		}.bind(this));
	}

	this.updateJoinButton = () => {
		if (getDOMElement(this.INIT_playerNameInput).value.length > 0) {
			getDOMElement(this.INIT_joinSessionButton).disabled = false;
		} else {
			getDOMElement(this.INIT_joinSessionButton).disabled = true;
		}

		if (!isNullOrUndefined(this.session)) {
			if (isNullOrUndefined(this.player)) {
				getDOMElement(this.INIT_joinSessionButton).innerHTML = "Rejoindre la session";
			} else {
				getDOMElement(this.INIT_joinSessionButton).innerHTML = "Modifier";
			}
		}
	}

	this.updateQRCode = () => {
		if (!isNullOrUndefined(this.session)) {
			const url = `${clientUrl}?sessionId=${this.session.id}`;
			if (getDOMElement(this.INIT_qrCodeWrapper).getAttribute("data-url") !== url) {
				const qr = new QRCode(getDOMElement(this.INIT_qrCodeWrapper), {
					text: url,
					width: 256, // Width of the QR code
					height: 256, // Height of the QR code
				});
				getDOMElement(this.INIT_qrCodeWrapper).setAttribute("data-url", url);
				showElement(getDOMElement(this.INIT_qrCodeWrapper), this.isSessionInitiator);
			}
		}
	}

	this.updateInitView = () => {
		showElement(getDOMElement(this.INIT_createSessionSection), isNullOrUndefined(this.session));
		showElement(getDOMElement(this.INIT_wsFeedSection), !isNullOrUndefined(this.session));
		// showElement(getDOMElement(this.INIT_createPlayerSection), true);
	
		this.updateJoinButton();
		this.updateQRCode();

		showElement(getDOMElement(this.INIT_startSessionButton), this.isSessionInitiator);
		
		if (!isNullOrUndefined(this.session)) {
			getDOMElement(this.INIT_startSessionButton).disabled = this.session.playerIds.length > this.session.config.minPlayers;
		}
	}

	this.updateVoteView = () => {
		const nSelected = getDOMElements(this.VOTE_playerList + " .player.selected").length;

		getDOMElement(this.VOTE_voteLeftElement).innerHTML = this.session.impersonatorIds.length - getDOMElements(this.VOTE_playerList + " .player.selected").length;
		if (nSelected === this.session.impersonatorIds.length) {
			getDOMElement(this.VOTE_submitButton).disabled = false;
		} else {
			getDOMElement(this.VOTE_submitButton).disabled = true;
		}
	}

	this.showTimer = (duration) => {

	}

	this.notifyMessage = (message, type, persist) => {
		const element = getDOMElement(this.NOTIFICATION_wrapper);
		if (element != undefined) {
			let cssClasses = "info";

			switch (type) {
				case NOTIFICATION_ERROR_TYPE:
					cssClasses = "error";
					break;
				case NOTIFICATION_WARNING_TYPE:
					cssClasses = "warning";
					break;
				case NOTIFICATION_INFO_TYPE:
					cssClasses = "info";
					break;
				default:
					cssClasses = "info";
					break;
			}

			if (persist === true) {
				cssClasses += " persisting";
			}

			element.innerHTML = "<div class='" + cssClasses + "'>" + message + '</div>';
			
			$(this.NOTIFICATION_wrapper).show("fast", function () {
				if (!persist) {
					//TODO: fix me
					//setTimeout($(this.NOTIFICATION_wrapper).hide(200), 2000);
				}
			}.bind(this));
		}
	}

	this.setState = (state) => {
		if (this.state !== state) {
			console.log("App State: " + this.state + " -> " + state);
			this.state = state;

			// Update UI accordingly
			showElement(getDOMElement(this.INIT_view), this.state === ClientAppState.Init);
			showElement(getDOMElement(this.GAME_view), this.state === ClientAppState.Game);
			showElement(getDOMElement(this.VOTE_view), this.state === ClientAppState.Vote);
			showElement(getDOMElement(this.LABD_view), this.state === ClientAppState.Ladder);
			showElement(getDOMElement(this.TERM_view), this.state === ClientAppState.Terminated);

			//getDOMElement(this.LABD_playerList).classList.add("no-transition");

			switch(this.state) {
				case ClientAppState.Init:
					
					this.updateInitView();
					break;
				case ClientAppState.Game:
					break;
				case ClientAppState.Vote:
					this.updateVoteView();
					break;
				case ClientAppState.Ladder:
					//getDOMElement(this.LABD_playerList).classList.remove("no-transition");
					break;
				case ClientAppState.Terminated:
					break;
				default:
					break;
			}

			// this.updatePlayers(this.session.players);
		}
	}

	this.selectCarouselAvatar = (indexIncrement) => {
		const selectedAvatarElement = getDOMElement(this.INIT_avatarCarouselListItems + ".selected");
		const selectedIndex = (parseInt(selectedAvatarElement.getAttribute("data-index")) + indexIncrement + AVATAR_IMGS.length) % AVATAR_IMGS.length;
		const newSelectedAvatarElement = getDOMElement(this.INIT_avatarCarouselListItems + "[data-index='"+ selectedIndex +"']");
		selectedAvatarElement.classList.toggle("selected");
		newSelectedAvatarElement.classList.toggle("selected");
	}


	this.updatePlayers = (players) => {
		if (players !== undefined && Array.isArray(players)) {
			getDOMElement(".n-players").innerHTML = players.length;
		}
		this.buildPlayerList(players, this.state);

		switch (this.state) {
			case ClientAppState.Init:
				this.updateInitView();
				break;
		}
	}

	this.getCreateSessionInfos = () => {
		return {
			minPlayers: parseInt(getDOMElement(this.INIT_createSessionSection + " input[name='minPlayers']").value),
			maxPlayers: parseInt(getDOMElement(this.INIT_createSessionSection + " input[name='maxPlayers']").value),
			numberOfImpersonators: parseInt(getDOMElement(this.INIT_createSessionSection + " input[name='numberOfImpersonators']").value),
			numberOfTurns: parseInt(getDOMElement(this.INIT_createSessionSection + " input[name='numberOfTurns']").value),
			enablePlayerTimer: parseInt(getDOMElement(this.INIT_createSessionSection + " input[name='enablePlayerTimer']").checked),
			showWords: parseInt(getDOMElement(this.INIT_createSessionSection + " select[name='showWords']").value)
		};
	}

	this.getCreatePlayerInfos = () => {
		return {
			name: getDOMElement(this.INIT_playerNameInput).value,
			avatarIndex: parseInt(getDOMElement(this.INIT_avatarCarouselListItems + ".selected").getAttribute("data-index"))
		}
	}

	this.initEventListeners = () => {
		//INITIALIZE all event listeners
		getDOMElement(this.INIT_playerNameInput).addEventListener('keyup', function(event) {
			this.updateJoinButton();
		}.bind(this));
	
		getDOMElement(this.INIT_joinSessionButton).addEventListener('click', async function() {
			const sessionInfos = this.getCreateSessionInfos();
			const playerInfos = this.getCreatePlayerInfos();

			console.log(sessionInfos);
			console.log(playerInfos);
			
			if (this.session === undefined) {
				//create the session if session id null (no qp in page)
				//const response = await this.api.createSession(sessionInfos, playerInfos);
				const response = await this.api.createSession(sessionInfos, playerInfos);
			
				if (!isNullOrUndefined(response)) {
					console.log(response);
					this.isSessionInitiator = true;
					this.session = response;
				}
			} else {
				if (isNullOrUndefined(this.player)) {
					// create
					response = await this.api.joinSessionCreatePlayer(this.sessionId, playerInfos);
				} else {
					// update
					response = await this.api.joinSessionUpdatePlayer(this.sessionId, this.player.id, playerInfos);
				}

				//const response = this.api.j(playerInfos.name, playerInfos.avatarIndex);
		
				if (!isNullOrUndefined(response)) {
					this.player = response;
					showElement(getDOMElement(this.INIT_wsFeedSection), this.player !== undefined);
				}
			}

			this.updateInitView();

			console.log(this.session.id);
			
		}.bind(this));
	
		getDOMElement(this.INIT_avatarCarouselNextButton).addEventListener('click', function() {
			this.selectCarouselAvatar(1);
		}.bind(this));
		getDOMElement(this.INIT_avatarCarouselPrevButton).addEventListener('click', function() {
			this.selectCarouselAvatar(-1);
		}.bind(this));
	}

	init = async () => {
		try {
			if (!isNullOrUndefined(sessionId)) {
				//TODO: retrieve session
				this.session = await this.api.getSession(sessionId);
			}
		
			if (!isNullOrUndefined(playerId)) {
				//TODO: retrieve player
				this.player = await this.api.getPlayers(playerId);
			}

			//TODO: add isInitiator in qp to retrieve if refresh and update it
	
			this.initSelectors();
			this.buildAvatarList();
			this.initEventListeners();
		
			this.setState(ClientAppState.Init);
			console.log("App Started !");
		} catch (error) {
			//this.setState(ClientAppState.Error);
			console.log(error);
			this.notifyMessage("Couldn't start the application", NOTIFICATION_ERROR_TYPE, true);
		}
	}
	
	
	//TESTS
	// this.setState(ClientAppState.Game);
	// this.updatePlayers(mock.createPlayers());

	init();	
}

const qp = new URLSearchParams(window.location.search);
const sessionId = qp.get("sessionId");
const playerId = qp.get("playerId");
const sessionInitiator = qp.get("sessionInitiator");
//const app = new ClientApp(undefined, sessionId, playerId);
const app = new ClientApp("127.0.0.1:3000", sessionId, playerId);
//const app = new ClientApp("146.59.226.180:3000", sessionId, playerId);
