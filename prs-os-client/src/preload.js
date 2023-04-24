const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('functions', {
    connect: (address) => ipcRenderer.invoke('connect', address),
    close: () => ipcRenderer.invoke('close'),
    makeMove: (move) => ipcRenderer.invoke('make-move', move),
})

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('show-move', (_event, round, player, move) => {
        console.log(round, player, move);
        round+=1;
        let box = document.getElementById(player+'|'+round);
        box.classList.add('bg-[url(\'img/'+ move.toLowerCase() +'.svg\')]', 'bg-contain',  'bg-center', 'bg-no-repeat', 'bg-origin-content', 'p-1');
    })
    ipcRenderer.on('show-winner', (_event, round, winner) => {
        let loser;
        round+=1;
        winner = winner[1];
        winner = parseInt(winner);
        winner === 1? loser = 2: loser = 1;
        console.log(round, winner, loser);
        let winner_box = document.getElementById(winner+'|'+round);
        let loser_box = document.getElementById(loser+'|'+round);
        if (winner !== 1 && winner !== 2)
        {
            winner_box = document.getElementById('1|'+round);
            loser_box = document.getElementById('2|'+round);
            winner_box.classList.replace('bg-neutral-100', 'bg-amber-600');
            loser_box.classList.replace('bg-neutral-100', 'bg-amber-600');
        }
        winner_box.classList.replace('bg-neutral-100', 'bg-emerald-500');
        loser_box.classList.replace('bg-neutral-100', 'bg-red-600');
    })

    ipcRenderer.on('rematch-reset', (_event, resetConnect) => {
        if (resetConnect)
        {
            document.getElementById('connected').classList.replace('bg-emerald-500', 'bg-red-600');
            document.getElementById('player').value = '';
        }
        let boxes = document.getElementsByClassName('box');
        Array.from(boxes).forEach((box) => {
            box.classList.remove('bg-[url(\'img/rock.svg\')]', 'bg-[url(\'img/paper.svg\')]', 'bg-[url(\'img/scissors.svg\')]', 'bg-contain',  'bg-center', 'bg-no-repeat', 'bg-origin-content', 'p-1', 'bg-amber-600', 'bg-red-600', 'bg-emerald-500');
            box.classList.add('bg-neutral-100');
        });
    })

    ipcRenderer.on('display-player-number', (_event, player) => {
        document.getElementById('player').value = 'P'+player;
    })
})