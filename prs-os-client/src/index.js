const { app, BrowserWindow } = require('electron');
const path = require('path');
const net = require('net');

var round = 0;
var game = {roundArray: [{P1: null, P2: null}, {P1:null, P2:null}, {P1:null, P2:null}]};
var showMove;
var showWinner;
var rematchReset;


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

  showMove = function (round, player, move){mainWindow.webContents.send('show-move', round, player, move);};
  showWinner = function (round, winner){mainWindow.webContents.send('show-winner', round, winner);};


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


var client = new net.Socket();
client.connect(1337, '127.0.0.1', function() {
  console.log('Connected');
});

client.on('data', function(data) {
  console.log('Received: ' + data);
});

client.on('close', function() {
  console.log('Connection closed');
});