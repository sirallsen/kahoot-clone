const WebSocket = require('ws');
var utility = require('./utility.js');


const port = process.env.PORT || 8080;
let rooms = {};

const wss = new WebSocket.Server({port: port}, () =>
{
    console.log('server started');
});

wss.broadcastPlayers = function(roomId, data)
{
    rooms[roomId].roomClients.forEach(client => client.send(data.toString()));
}

wss.sendToGame = function(roomId, data)
{
    rooms[roomId].gameClient.send(data.toString());
}

wss.on('connection', (ws) =>
{
    ws.on('message', (dataJSON) =>
    {
        console.log("message received: " + dataJSON.toString());
        let data = JSON.parse(dataJSON.toString());
        utility.createTextFile(data.roomId, utility.generatePIN(), dataJSON.toString())
    
        if(data.msgType === "Handshake")
        {
            wss.sendToGame(data.roomId, dataJSON);
            wss.broadcastPlayers(data.roomId, dataJSON);
        }

        if(data.msgType === "Create")
        {
            rooms[data.roomId] = {};
            rooms[data.roomId].roomClients = [];
            rooms[data.roomId].players = {};

            rooms[data.roomId].gameClient = ws;
            
            const isHost = true;

            ws.send(JSON.stringify({msgType: "Connected", additional: isHost, roomId: data.roomId}));
        }
        else if(data.msgType === "Connection")
        {
            if(rooms[data.roomId] == undefined)
            {
                ws.send("There is no room with the specified code.".toString());
                return;
            }
            else if(rooms[data.roomId].hasGameStarted)
            {
                ws.send("You can't join a game after it has started.".toString());
                return;
            }
            else if(rooms[data.roomId].roomClients.includes(ws))
            {
                ws.send("You are already connected to this room.".toString());
                return;
            }
            else if(rooms[data.roomId].players.hasOwnProperty(data.username))
            {
                ws.send("This username is already in use.".toString());
                return;
            }
            
            rooms[data.roomId].roomClients.push(ws);
            if (!rooms[data.roomId].players.hasOwnProperty(data.username)) {
                rooms[data.roomId].players[data.username] = 0;
            }
            
            wss.sendToGame(data.roomId, dataJSON);

            ws.send(JSON.stringify({msgType: "Connected", additional: ""}));
        }
        else if(data.msgType === "StartGame")
        {
            rooms[data.roomId].hasGameStarted = true;
            rooms[data.roomId].questions = data.questions;
            wss.sendToGame(data.roomId, dataJSON);
            wss.broadcastPlayers(data.roomId, dataJSON);
        }
        else if(data.msgType === "SendInput")
        {
            rooms[data.roomId].players[data.username] += data.input == data.correctAnswer ? 1 : 0;
            wss.sendToGame(data.roomId, dataJSON);

            ws.send(utility.WaitMessage());
        }
        else if(data.msgType === "EndInput")
        {
            wss.sendToGame(data.roomId, dataJSON);
        }
        else if(data.msgType === "EndGame")
        {
            let scores = {};
            scores.msgType = "Scores";
            scores.players = rooms[data.roomId].players;

            let json = JSON.stringify(scores);
            wss.sendToGame(data.roomId, json);
            wss.broadcastPlayers(data.roomId, json);
        }
    })
});


wss.on('listening', () =>
{
    console.log('server listening on port ' + port);
});