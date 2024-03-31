const INIT_view = document.querySelector(".view.init");
const INIT_createSessionSection = document.querySelector(".view.init section.session-creation");
const INIT_wsFeedSection = document.querySelector(".view.init section.ws-feed");
const INIT_createPlayerSection = document.querySelector(".view.init section.player-creation");

const INIT_createSessionButton = document.querySelector(".view.init button.create");
const INIT_joinSessionButton = document.querySelector(".view.init button.join");
const INIT_startSessionButton = document.querySelector(".view.init button.start");
const INIT_qrCodeWrapper = document.querySelector(".view.init .qr-code");
const INIT_playerList = document.querySelector(".view.init .list.players");
const INIT_avatarList = document.querySelector(".view.init .list.avatars");
const INIT_playerListItemTemplate = document.querySelector(".templates .init .player");

const GAME_view = document.querySelector(".view.game");
const GAME_submitButton = document.querySelector(".view.game button.submit");
const GAME_wordInput = document.querySelector(".view.game input.word");
const GAME_timerWrapper = document.querySelector(".view.game label.timer");
const GAME_playerList = document.querySelector(".view.game .list.players");
const GAME_playerListItemTemplate = document.querySelector(".templates .game .player");

const VOTE_view = document.querySelector(".view.vote");
const VOTE_playerList = document.querySelector(".view.vote .list.players");
const VOTE_playerListItemTemplate = document.querySelector(".templates .vote .player");

const LADB_view = document.querySelector(".view.ladder-board");
const LABD_playerList = document.querySelector(".view.ladder-board .list.players");
const LABD_playerListItemTemplate = document.querySelector(".templates .ladder-board .player");
const LABD_nextWordButton = document.querySelector(".view.ladder-board button.next");

let isSessionInitiator = false;
let sessionId = undefined;
let player = undefined;
let username = undefined;
let password = undefined;

function showElement(element, show) {
	if (element !== undefined) {
		if (show) {
			element.classList.remove("hidden");
		} else {
			element.classList.add("hidden");
		}
	}
}

function showQRCode(url) {
	new QRCode(INIT_qrCodeWrapper, {
		text: url, // The content you want to encode into the QR code
		width: 256, // Width of the QR code
		height: 256, // Height of the QR code
	});

	showElement(INIT_qrCodeWrapper, true);
}

//const api = new ImpersonatorAPI("127.0.0.1:3000");
const api = new ImpersonatorAPI("146.59.226.180:3000");

function setup() {
	INIT_joinSessionButton.addEventListener('click', async function() {
		if (!sessionId) {

			//create the session if session id null (no qp in page)
			const response = await api.createSession();
		
			if (response) {
				console.log(response);
				//sessionId = response.id;
				isSessionInitiator = true;
				sessionId = response.id;
			}
		}

		let response = undefined;
		const playerInfos = {
			name: "",
			avatarIndex: 2
		};

		if (player !== undefined) {
			// create
			response = await api.joinSessionCreatePlayer(sessionId, playerInfos);
		} else {
			// update
			response = await api.joinSessionUpdatePlayer(sessionId, player.id, playerInfos);
		} 

		if (response != undefined) {
			showElement(INIT_wsFeedSection, true);
		}
	});

	const qp = new URLSearchParams(window.location.search);
	let avatarListContent = "";

	for (let i = 0; i < AVATAR_IMGS.length; i++) {
		avatarListContent += '<img class="selected" src="../res/' + AVATAR_IMGS[i] + '" data-index="' + i +'"/>';
	}
	sessionId = qp.get("sessionId");
	console.log(sessionId);

	INIT_avatarList.setHTML(avatarListContent);
	INIT_joinSessionButton.setHTML(sessionId == undefined ? "Créer une session" : "Rejoindre")

	showElement(INIT_createSessionSection, sessionId == undefined);
	showElement(INIT_wsFeedSection, false);
	showElement(INIT_createPlayerSection, true);

	showElement(INIT_view, false);	//DELETE
	showElement(GAME_view, true);	//DELETE
}

setup();