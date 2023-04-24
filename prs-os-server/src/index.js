/*
Author : Caouini Youssef
StudentID : B01299523
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

var playersSockets = {P1: null, P2: null};
var playerCount = 0;
var round = 0;
var game = {roundArray: [{P1: null, P2: null}, {P1:null, P2:null}, {P1:null, P2:null}]};
var rematch = {P1:null, P2:null};
var logToTextArea;
var showMove;
var showWinner;
var rematchReset;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
const { dialog } = require('electron')

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 420,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  ipcMain.handle('address', () => {return server.address();})
  ipcMain.handle('closeP1', () => {closeP1(true);})
  ipcMain.handle('closeP2', () => {closeP2(true);})
  ipcMain.handle('closeAll', () => {closeAll();})

  logToTextArea = function (data){mainWindow.webContents.send('logging', data);};
  showMove = function (round, player, move){mainWindow.webContents.send('show-move', round, player, move);};
  showWinner = function (round, winner){mainWindow.webContents.send('show-winner', round, winner);};
  rematchReset = function (resetTextArea){mainWindow.webContents.send('rematch-reset', resetTextArea);};

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();

};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  app.quit();
})

var server = net.createServer(function(socket) {
  server.maxConnections = 2;
});

server.listen(0, '0.0.0.0', () => {
  console.log(server.address());
});

server.on('connection', function (socket) {
  let remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
  if (playerCount > 1)
  {
    logToTextArea('Too much Players');
  }
  if (playerCount === 0)
  {
    logToTextArea('P1 Connected on address : ' + remoteAddress);
    playersSockets.P1 = socket;
    playerCount++;
    if (playersSockets.P2 == null)
    {
      socket.write('P1'+'|wait');
      logToTextArea('P1 is waiting for P2');
    }
    else
    {
      socket.write('P1'+'|play');
      playersSockets.P2.write('P2|play');
      logToTextArea('Both players are connected, game can begin');
    }
    socket.on('data', function (data) {P1SocketHandler(data)});
    socket.on('end', function() {closeP1(false)});
  }
  else if (playerCount === 1)
  {
    logToTextArea('P2 Connected on address : ' + remoteAddress);
    playersSockets.P2 = socket;
    playerCount++;
    if (playersSockets.P1 == null)
    {
      logToTextArea('P2 is waiting for P1');
      socket.write('P2'+'|wait');
    }
    else
    {
      socket.write('P2'+'|play');
      playersSockets.P1.write('P1|play');
      logToTextArea('Both players are connected, game can begin');
    }
    socket.on('data', function (data) {P2SocketHandler(data)});
    socket.on('end', function() {closeP2(false)});
  }

});

function winner(P1, P2){
  if (P1 === P2) {
    return 'Tie';
  }
  else if (P1 === 'Rock') {
    if (P2 === 'Paper') {
      return 'P2';
    }
    if (P2 === 'Scissors') {
      return 'P1';
    }
  }
  else if (P1 === 'Paper') {
    if (P2 === 'Scissors') {
      return 'P2';
    }
    if (P2 === 'Rock') {
      return 'P1';
    }
  }
  else if (P1 === 'Scissors') {
    if (P2 === 'Rock') {
      return 'P2';
    }
    if (P2 === 'Paper') {
      return 'P1';
    }
  }
  return 'error-game'
}


function resetGame (resetSocket) {
  if (resetSocket)
  {
    playersSockets.P1.destroy();
    playersSockets.P2.destroy();
    playersSockets = {P1: null, P2: null};
    logToTextArea('Both players have been disconnected')
  }
  rematchReset(resetSocket);
  playerCount = 0;
  round = 0;
  game = {roundArray: [{P1:null, P2:null}, {P1:null, P2:null}, {P1:null, P2:null}]}
  rematch = {P1:null, P2:null};
}

function checkRound () {
  if (round < 0 || round > 2) {
    let gameWinner1 = gameWinner();
    if (gameWinner1 === 'Tie')
      logToTextArea('Tie, nobody won the Game !');
    else
      logToTextArea(gameWinner1 + ' won the Game !');
    logToTextArea('Asking for rematch');
    playersSockets.P1.write(gameWinner1 + '|win');
    playersSockets.P2.write(gameWinner1 + '|win');
  }
}

function sendRematch () {
  resetGame(false);
  playersSockets.P1.write('rematch-yes');
  playersSockets.P2.write('rematch-yes');
  rematchReset();
}

function gameWinner() {
  let P1 = 0, P2 = 0;
  game.roundArray.forEach((round) => {
    let winnerGame = winner(round.P1, round.P2);
    if (winnerGame === 'P1')
      P1++;
    else if (winnerGame === 'P2')
      P2++;
  });
  if (P1 === P2)
    return 'Tie';
  else if (P1 > P2)
    return 'P1';
  else if (P1 < P2)
    return 'P2';
}


function P2SocketHandler(data) {
  data = data.toString().trim();
  let array_received = data.split('|');
  if (array_received[0] !== 'P2') {
    playersSockets.P2.write('error-player');
  }
  else if (array_received[0] === 'P2')
  {
    if (array_received[1] === 'rematch-yes') {
      logToTextArea('P2 accepted the rematch');
      rematch.P2 = array_received[1];
      if (rematch.P1 === 'rematch-yes') {
        logToTextArea('Rematch !');
        sendRematch();
        return;
      }
      playersSockets.P2.write('wait-rematch');
      return;
    }
    else if (array_received[1] === 'rematch-no') {
      playersSockets.P1.write('rematch-no');
      logToTextArea('P2 refused the rematch');
      resetGame(true);
      return;
    }

    if (array_received[1] !== round.toString()) {
      playersSockets.P2.write('error-round');
      return;
    }
    if (array_received[2] !== 'Rock' && array_received[2] !== 'Paper' && array_received[2] !== 'Scissors') {
      playersSockets.P2.write('error-move');
      return;
    }
    if (game.roundArray[round].P2 !== null)
      return;
    game.roundArray[round].P2 = array_received[2];
    showMove(round, 2, array_received[2]);
    logToTextArea('P2 made move : ' + array_received[2] + ' on round : ' + (round+1));
    if (game.roundArray[round].P1 !==null) {
      let winnerPlayer = winner(game.roundArray[round].P1, game.roundArray[round].P2);
      playersSockets.P2.write(winnerPlayer+'|'+(round+1));
      playersSockets.P1.write(winnerPlayer+'|'+(round+1));
      showWinner(round, winnerPlayer);
      logToTextArea('Round : ' + (round+1) + ' Result : ' + winnerPlayer);
      round += 1;
      logToTextArea('Passing to round ' + (round+1));
      setTimeout(checkRound, 500);
    }
    else {
      playersSockets.P2.write('wait');
    }
  }
  else {
    playersSockets.P2.write('error-data');
  }
}

function P1SocketHandler(data) {
  data = data.toString().trim();
  if (data == null)
    return;
  let array_received = data.split('|');
  if (array_received[0] !== 'P1') {
    playersSockets.P1.write('error-player');
  }
  else if (array_received[0] === 'P1')
  {
    if (array_received[1] === 'rematch-yes') {
      rematch.P1 = array_received[1];
      logToTextArea('P1 accepted the rematch');
      if (rematch.P2 === 'rematch-yes') {
        logToTextArea('Rematch !');
        sendRematch();
        return;
      }
      playersSockets.P1.write('wait-rematch');
      return;
    }
    else if (array_received[1] === 'rematch-no') {
      playersSockets.P2.write('rematch-no');
      logToTextArea('P1 refused the rematch');
      resetGame(true);
      return;
    }

    if (array_received[1] !== round.toString()) {
      playersSockets.P1.write('error-round');
      return;
    }
    if (array_received[2] !== 'Rock' && array_received[2] !== 'Paper' && array_received[2] !== 'Scissors') {
      playersSockets.P1.write('error-move');
      return;
    }
    if (game.roundArray[round].P1 !== null)
      return;
    game.roundArray[round].P1 = array_received[2];
    showMove(round, 1, array_received[2]);
    logToTextArea('P1 made move : ' + array_received[2] + ' on round : ' + (round+1));
    if (game.roundArray[round].P2 !== null) {
      let winnerPlayer = winner(game.roundArray[round].P1, game.roundArray[round].P2);
      playersSockets.P1.write(winnerPlayer+'|'+(round+1));
      playersSockets.P2.write(winnerPlayer+'|'+(round+1));
      showWinner(round, winnerPlayer);
      if (winnerPlayer === 'P1' || winnerPlayer === 'P2')
        logToTextArea(winnerPlayer + ' won the round ' + (round+1));
      else
        logToTextArea('Tie on the round :' + (round+1));
      round += 1;
      logToTextArea('Passing to round ' + (round+1));
      setTimeout(checkRound, 500);
    }
    else {
      playersSockets.P1.write('wait');
    }
  }
  else {
    playersSockets.P1.write('error-data');
  }
}

function closeP1 (notify){
  if (notify)
    playersSockets.P1.write('close');
  playersSockets.P1.destroy();
  playersSockets.P1 = null;
  resetGame(false);
  logToTextArea('P1 has been disconnected');
}

function closeP2 (notify){
  if (notify)
    playersSockets.P2.write('close');
  playersSockets.P2.destroy();
  playersSockets.P2 = null;
  resetGame(false);
  logToTextArea('P2 has been disconnected');
}

function closeAll() {
  closeP1(true);
  closeP2(true);
  resetGame(true);
}
