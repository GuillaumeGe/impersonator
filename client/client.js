function showElement(element, show) {
	if (element !== undefined && element !== null) {
		if (show) {
			element.classList.remove("hidden");
		} else {
			element.classList.add("hidden");
		}
	}
}

function getDOMElement(selectorString) {
	return document.querySelector(selectorString);
}

function getDOMElements(selectorString) {
	const result =  document.querySelectorAll(selectorString);
	return result != undefined ? result : [];
}

// function showQRCode(url) {
// 	new QRCode(INIT_qrCodeWrapper, {
// 		text: url, // The content you want to encode into the QR code
// 		width: 256, // Width of the QR code
// 		height: 256, // Height of the QR code
// 	});

// 	showElement(INIT_qrCodeWrapper, true);
// }

getDOMElements(".collapse-btn").forEach(function(btn) {
	btn.addEventListener("click", function(event) {
		const elem = event.currentTarget;
		elem.classList.toggle("collapsed");
	});
});

const mock = new MOCK();

const ClientAppState = Object.freeze({
	Init: 0,
	Game: 1,
	Vote: 2,
	Ladder: 3
});

function ClientApp(address, parameters) {
	this.api = new ImpersonatorAPI(address);
	//const api = new ImpersonatorAPI("127.0.0.1:3000");

	this.isSessionInitiator = false;
	this.sessionId = parameters.get("sessionId");
	this.player = undefined;
	this.username = undefined;
	this.password = undefined;
	this.state = undefined;

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
		this.INIT_createSessionSection = ".view.init section.session-creation";
		this.INIT_wsFeedSection = ".view.init section.ws-feed";
		this.INIT_createPlayerSection = ".view.init section.player-creation";
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

		this.LADB_view = ".view.ladder";
		this.LABD_playerList = ".view.ladder .list.players";
		this.LABD_nextWordButton = ".view.ladder button.next";
	}

	this.buildAvatarList = () => {
		let avatarListContent = "";
	
		for (let i = 0; i < AVATAR_IMGS.length; i++) {
			avatarListContent += '<div class="img-wrapper ' + (i == 0 ? "selected" : "") + '" data-index="' + i + '"><img src="../res/' + AVATAR_IMGS[i] + '"/></div>';
		}
		
		// getDOMElement(this.INIT_avatarListContent).innerHTML = avatarListContent;
		getDOMElement(this.INIT_avatarCarouselContent).innerHTML = avatarListContent;
		getDOMElement(this.INIT_joinSessionButton).innerHTML = this.sessionId == undefined ? "Créer une session" : "Rejoindre";
	}

	this.buildPlayerList = (players, state) => {
		if (state === undefined) {
			this.buildPlayerList(players, ClientAppState.Init);
			this.buildPlayerList(players, ClientAppState.Game);
			this.buildPlayerList(players, ClientAppState.Vote);
			this.buildPlayerList(players, ClientAppState.Ladder);
			return;
		}

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
					break;
				default:
					break;
			}

			if (playerListItemTemplate !== undefined && playerListElement !== undefined) {
				playerListElement.innerHTML = "";

				for (const player of players) {
					const html = this.buildPlayerListItem(playerListItemTemplate, player);
						
					if (html !== undefined) {
						playerListElement.innerHTML += html;
					}
				}
			}
		}
	}

	// Replaces everything it can replaces if specified needle is found
	this.buildPlayerListItem = (template, player) => {
		let result = template.trim();

		result = result.replace(/%PLAYER_NAME%/g, player.name);
		result = result.replace(/%PLAYER_SCORE%/g, player.score);
        result = result.replace(/%IMG_SRC%/g, "src='../res/" + AVATAR_IMGS[player.avatarIndex] + "'");

		if (this.player !== undefined && this.player.id == player.id) {
			
		}
		
		return result;
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
			showElement(getDOMElement(this.INIT_view), this.state === ClientApp.Init);
			showElement(getDOMElement(this.GAME_view), this.state === ClientApp.Game);
			showElement(getDOMElement(this.VOTE_view), this.state === ClientApp.Vote);
			showElement(getDOMElement(this.LABD_view), this.state === ClientApp.Ladder);
		}

		switch(this.state) {
			case ClientAppState.Init:
				showElement(getDOMElement(this.INIT_createSessionSection), this.sessionId == undefined);
				showElement(getDOMElement(this.INIT_wsFeedSection), this.player !== undefined);
				showElement(getDOMElement(this.INIT_createPlayerSection), true);
				break;
			case ClientAppState.Game:
				break;
			case ClientAppState.Vote:
				break;
			case ClientAppState.Ladder:
				break;
			default:
				break;
		}
	}

	this.selectCarouselAvatar = (indexIncrement) => {
		const selectedAvatarElement = getDOMElement(this.INIT_avatarCarouselListItems + ".selected");
		const selectedIndex = (parseInt(selectedAvatarElement.getAttribute("data-index")) + indexIncrement + AVATAR_IMGS.length) % AVATAR_IMGS.length;
		const newSelectedAvatarElement = getDOMElement(this.INIT_avatarCarouselListItems + "[data-index='"+ selectedIndex +"']");
		selectedAvatarElement.classList.toggle("selected");
		newSelectedAvatarElement.classList.toggle("selected");
	}

	this.updateJoinButton = () => {
		if (getDOMElement(this.INIT_playerNameInput).value.length > 0) {
			getDOMElement(this.INIT_joinSessionButton).disabled = false;
		} else {
			getDOMElement(this.INIT_joinSessionButton).disabled = true;
		}
	}

	this.updatePlayers = (players) => {
		if (players !== undefined && Array.isArray(players)) {
			getDOMElement(".n-players").innerHTML = players.length;
		}
		this.buildPlayerList(players, this.state);
	}

	this.initEventListeners = () => {
		//INITIALIZE all event listeners
		getDOMElement(this.INIT_playerNameInput).addEventListener('keyup', function(event) {
			this.updateJoinButton();
		}.bind(this));
	
		getDOMElement(this.INIT_joinSessionButton).addEventListener('click', async function() {
			if (!this.sessionId) {
				//create the session if session id null (no qp in page)
				const response = await this.api.createSession();
			
				if (response) {
					console.log(response);
					//sessionId = response.id;
					this.isSessionInitiator = true;
					this.sessionId = response.id;
				}
			}
	
			let response = undefined;
			const playerInfos = {
				name: getDOMElement(this.INIT_playerNameInput).value,
				avatarIndex: getDOMElement(this.INIT_avatarCarouselListItems + ".selected").getAttribute("data-index")
			};
	
			if (this.player === undefined) {
				// create
				response = await this.api.joinSessionCreatePlayer(this.sessionId, playerInfos);
			} else {
				// update
				response = await this.api.joinSessionUpdatePlayer(this.sessionId, this.player.id, playerInfos);
			}
	
			if (response !== undefined) {
				this.player = response;
				showElement(getDOMElement(this.INIT_wsFeedSection), this.player !== undefined);
			}
		}.bind(this));
	
		// getDOMElements(this.INIT_avatarListItems).forEach(function(avatarListItem) {
		// 	avatarListItem.addEventListener("click", function(event) {
		// 		const elem = event.currentTarget;
		// 		const selectedAvatarElement = getDOMElement(this.INIT_avatarListItems + ".selected");
		// 		selectedAvatarElement.classList.toggle("selected");
		// 		elem.classList.toggle("selected");
		// 		console.log(elem.getAttribute("data-index"));
		// 	}.bind(this));
		// }.bind(this));

		getDOMElement(this.INIT_avatarCarouselNextButton).addEventListener('click', function() {
			this.selectCarouselAvatar(1);
		}.bind(this));
		getDOMElement(this.INIT_avatarCarouselPrevButton).addEventListener('click', function() {
			this.selectCarouselAvatar(-1);
		}.bind(this));
	}

	this.initSelectors();
	this.buildAvatarList();
	this.initEventListeners();
	this.setState(ClientAppState.Init);

	//TESTS
	this.updatePlayers(mock.createPlayers());
	this.setState(ClientAppState.Ladder);

	console.log(this.sessionId);
	console.log("App Started !");
}

const app = new ClientApp("146.59.226.180:3000", new URLSearchParams(window.location.search));