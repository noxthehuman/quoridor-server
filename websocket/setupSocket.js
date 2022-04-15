const webSocketServer = require('websocket').server;
const http = require('http');
const webSocketServerPort = 8000;

// Start the http server and the websocket server
const server = http.createServer();
server.listen(webSocketServerPort);

const wsServer = new webSocketServer({
	httpServer: server
});

const clients = {};

// Generates unique userid for every user.
const generateUniqueID = () => {

	const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

	return s4() + '-' + s4() + '-' + s4();
};

wsServer.on('request', function(request) {
	var userID = generateUniqueID();

	console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');

	// You can rewrite this part of the code to accept only the requests from allowed origin
	const connection = request.accept(null, request.origin);

	clients[userID] = connection;
	console.log('connected: ' + userID)

});