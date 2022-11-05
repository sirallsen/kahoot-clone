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
    
        if(data.msgType === "Handshake")
        {
            wss.sendToGame(data.roomId, dataJSON);
            wss.broadcastPlayers(data.roomId, dataJSON);
        }

        if(data.msgType === "Create")
        {
            rooms[data.roomId] = {};
            rooms[data.roomId].roomClients = [];
            rooms[data.roomId].players = [];

            rooms[data.roomId].gameClient = ws;
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
            else if(rooms[data.roomId].players.includes(data.username))
            {
                ws.send("This username is already in use.".toString());
                return;
            }

            //check if player limit is reached
            const isHost = rooms[data.roomId].players.length == 0;
            rooms[data.roomId].roomClients.push(ws);
            rooms[data.roomId].players.push(data.username);
            wss.sendToGame(data.roomId, dataJSON);

            ws.send(JSON.stringify({msgType: "Connected", additional: isHost ? "host" : ""}));
        }
        else if(data.msgType === "StartGame")
        {
            rooms[data.roomId].hasGameStarted = true;
            wss.sendToGame(data.roomId, dataJSON);
            wss.broadcastPlayers(data.roomId, dataJSON);
        }
        else if(data.msgType === "StartInput")
        {
            wss.broadcastPlayers(data.roomId, dataJSON);
        }
        else if(data.msgType === "IndividualInput")
        {
            wss.broadcastPlayers(data.roomId, dataJSON);
        }
        else if(data.msgType === "SendInput")
        {
            wss.sendToGame(data.roomId, dataJSON);

            ws.send(utility.WaitMessage());
        }
        else if(data.msgType === "EndInput")
        {
            wss.broadcastPlayers(data.roomId, dataJSON);
        }
    })
});


wss.on('listening', () =>
{
    console.log('server listening on port ' + port);
});