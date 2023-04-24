/*
Author : Caouini Youssef
StudentID : B01299523
 */

const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const net = require('net');
const { dialog } = require('electron')


var round = 0;
var game = {roundArray: [{P1: null, P2: null}, {P1:null, P2:null}, {P1:null, P2:null}]};
var showMove;
var showWinner;
var rematchReset;
var displayPlayerNumber;
var socket;
var playerNumber = 0;
var advantageMoveDict = {
  'Rock': 'Scissors',
  'Paper': 'Rock',
  'Scissors': 'Paper'
}
var disadvantageMoveDict = {
  'Scissors': 'Rock',
  'Rock': 'Paper',
  'Paper': 'Scissors'
}

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  ipcMain.on('connect', connectSocket);
  ipcMain.handle('connect', (_event, address) => {connectSocket(address);})
  ipcMain.handle('close', () => {closeSocket();})
  ipcMain.handle('make-move', (_event, move) => {makeMove(move);})

  showMove = function (round, player, move){mainWindow.webContents.send('show-move', round, player, move);};
  showWinner = function (round, winner){mainWindow.webContents.send('show-winner', round, winner);};
  rematchReset = function (resetConnect){mainWindow.webContents.send('rematch-reset', resetConnect);};
  displayPlayerNumber = function (player){mainWindow.webContents.send('display-player-number', player);}

  mainWindow.openDevTools();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
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

function resetGame (resetConnect) {
  rematchReset(resetConnect);
  round = 0;
  game = {roundArray: [{P1:null, P2:null}, {P1:null, P2:null}, {P1:null, P2:null}]}
}


socket = new net.Socket();

socket.on('close', function() {
});

function closeSocket() {
  socket.destroy();
  resetGame(true);
}

function connectSocket(address) {
  data = address.toString().split(':');
  if (data.length !== 2)
    return;
  socket.connect(data[1], data[0]);
}


function makeMove(move) {
  if(playerNumber === 1){
    if (game.roundArray[round].P1 !== null)
      return;
    game.roundArray[round].P1 = move;
  }
  if(playerNumber === 2) {
    if (game.roundArray[round].P2 !== null)
      return;
    game.roundArray[round].P2 = move;
  }
  showMove(round, playerNumber, move);
  socket.write('P'+playerNumber+'|'+round+'|'+move);
}

function finishRound(newRound, winner) {
  let otherPlayerMove;
  if (winner === 'Tie') {
    if (playerNumber === 1)
      otherPlayerMove = game.roundArray[round].P1;
    if (playerNumber === 2)
      otherPlayerMove = game.roundArray[round].P2;
  }
  if (winner === 'P1') {
    if (playerNumber === 1)
      otherPlayerMove = advantageMoveDict[game.roundArray[round].P1];
    if (playerNumber === 2)
      otherPlayerMove = disadvantageMoveDict[game.roundArray[round].P2];
  }
  if (winner === 'P2') {
    if (playerNumber === 1)
      otherPlayerMove = disadvantageMoveDict[game.roundArray[round].P1];
    if (playerNumber === 2)
      otherPlayerMove = advantageMoveDict[game.roundArray[round].P2];
  }
  console.log(game.roundArray[round]);
  console.log(otherPlayerMove);
  if (playerNumber === 1)
  {
    showMove(round, playerNumber, game.roundArray[round].P1);
    showMove(round, 2, otherPlayerMove);
  }
  if (playerNumber === 2)
  {
    showMove(round, playerNumber, game.roundArray[round].P2);
    showMove(round, 1, otherPlayerMove);
  }
  showWinner(round, winner);
  round = newRound;
}

socket.on('data', function(data) {
  data = data.toString().trim();
  let array_received = data.split('|');
  console.log(array_received);
  if (array_received[0] !== 'rematch-yes' && array_received[0] !== 'wait-rematch' && array_received[0] !== 'rematch-no' && array_received[0] !== 'wait' && array_received[0] !== 'close' && array_received[0] !== 'P1' && array_received[0] !== 'P2' && array_received[0] !== 'Tie')
    return;
  if (array_received[0] === 'rematch-yes')
  {
    resetGame(false);
    dialog.showMessageBox({message: 'Rematch !'});
  }
  if (array_received[0] === 'wait-rematch')
  {
    dialog.showMessageBox({message: 'Waiting for the other Player for rematch'});
  }
  if (array_received[0] === 'rematch-no')
  {
    closeSocket();
    dialog.showMessageBox({message: 'Rematch cancelled'});
  }
  if (array_received[0] === 'wait')
  {
    dialog.showMessageBox({message: 'Waiting for the other player move'});
  }
  if (array_received[0] === 'close')
  {
    closeSocket();
    dialog.showMessageBox({message: 'The server closed the connection'});
  }

  if (array_received[0] !== 'P1' && array_received[0] !== 'P2' && array_received[0] !== 'Tie')
    return;
  if (array_received[1] === 'wait')
  {
    playerNumber = parseInt(array_received[0].at(1));
    displayPlayerNumber(playerNumber);
    dialog.showMessageBox({message: 'You are connected to the server and waiting for P2\n You will be notified when he connects'});
  }
  if (array_received[1] === 'play')
  {
    playerNumber = parseInt(array_received[0].at(1));
    displayPlayerNumber(playerNumber);
    dialog.showMessageBox({message: 'Both Players are connected, the game can begin now'});
  }
  if (array_received[1] === 'win')
  {
    let res;
    if (array_received[0] === 'Tie')
      res = dialog.showMessageBox({message:'Tie, nobody won the Game !\nDo you want to rematch ?', buttons: ['Yes', 'No']});
    else
      res = dialog.showMessageBox({message: array_received[0]+' won the Game !\nDo you want to rematch ?', buttons: ['Yes', 'No']});
    res.then((response) => {
      if (response.response === 0)
      {
        socket.write('P' + playerNumber + '|rematch-yes');
      }
      else if (response.response === 1)
      {
        socket.write('P' + playerNumber + '|rematch-no');
        closeSocket();
      }
    })
    return;
  }
  if (parseInt(array_received[1]) === 1 || parseInt(array_received[1]) === 2 || parseInt(array_received[1]) === 3 || array_received[0] === 'Tie')
  {
    finishRound(parseInt(array_received[1]), array_received[0]);
    if (array_received[0] === 'Tie')
      dialog.showMessageBox({message: 'Tie : Nobody won the round'});
    else
      dialog.showMessageBox({message: array_received[0] + ' won the round ' + array_received[1]});
  }
});