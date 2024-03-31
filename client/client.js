const INIT_view = document.querySelector(".view.init");
const INIT_createSessionButton = document.querySelector(".view.init button.create");
const INIT_joinSessionButton = document.querySelector(".view.init button.join");
const INIT_startSessionButton = document.querySelector(".view.init button.start");
const INIT_qrCodeWrapper = document.querySelector(".view.init .qr-code");
const INIT_playerList = document.querySelector(".view.init .list.players");
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

const api = new ImpersonatorAPI("127.0.0.1:3000");

INIT_createSessionButton.addEventListener('click', async function() {
	const response = await api.createSession();
	if (response) {
		console.log(response);
		// Create a new QRCode instance with the element ID where you want to render the QR code
		const qrcode = new QRCode(INIT_qrCodeWrapper, {
			text: "127.0.0.1:3000/sessions/{sessionId}/players", // The content you want to encode into the QR code
			width: 256, // Width of the QR code
			height: 256, // Height of the QR code
		});
	}
})


