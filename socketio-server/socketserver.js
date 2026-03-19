const express = require('express');
const app = express();
const http = require('http');
const axios = require('axios');

const Koa = require('koa');
const { createServer } = require('http');
const { Server } = require('socket.io');

const server = new Koa();
const httpServer = createServer(server.callback());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

let rooms = {};
let musicData = [];
let clients = [];
const countdownDuration = 20;
const pauseDuration = 7;
let timer = null;
let currentRound = 0;
const maxRounds = 20;
let playedSongs = [];

const port = process.env.PORT || 5002;
const YOUTUBE_API_KEY = process.env.ytapi; // Füge hier deinen YouTube API-Schlüssel ein

httpServer.listen(port, () => {
  console.log('listening on ' + port);
});

async function getVideoDuration(videoId) {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        id: videoId,
        part: 'contentDetails',
        key: YOUTUBE_API_KEY
      }
    });
    const duration = response.data.items[0].contentDetails.duration;
    return parseISO8601Duration(duration);
  } catch (error) {
    console.error('Error fetching video duration:', error);
    return 10; // Fallback auf 240 Sekunden (4 Minuten)
  }
}

function parseISO8601Duration(duration) {
  const match = duration.match(/PT(\d+M)?(\d+S)?/);
  const minutes = parseInt(match[1] || '0', 10);
  const seconds = parseInt(match[2] || '0', 10);
  return (minutes * 60) + seconds;
}

let playedGames = [];

async function sendSelectedSong(roomName) {
  try {
    const room = rooms[roomName];
    if (!room) return;

    // Wir nutzen die globalen musicData, aber die raumspezifischen playedGames
    const data = musicData; 
    
    if (data.length === 0) {
        console.log("Fehler: musicData ist leer. Lade Daten nach...");
        const res = await axios.get('https://vmq.onrender.com/getAll');
        musicData = res.data;
    }

    if (room.playedGames.length === data.length) {
      console.log(`Lobby ${roomName}: Alle Spiele wurden gespielt. Reset.`);
      room.playedGames = [];
    }

    let selectedGame;
    let isUniqueGame = false;

    // Suche ein Spiel, das in DIESER Lobby noch nicht dran war
    while (!isUniqueGame) {
      const randomGameIndex = Math.floor(Math.random() * data.length);
      selectedGame = data[randomGameIndex];

      if (!room.playedGames.includes(selectedGame.game)) {
        room.playedGames.push(selectedGame.game); 
        isUniqueGame = true;
      }
    }

    const randomSongIndex = Math.floor(Math.random() * selectedGame.songs.length);
    const selectedSongData = selectedGame.songs[randomSongIndex];

    const videoDuration = await getVideoDuration(selectedSongData.link);
    const maxStartTime = videoDuration > 30 ? videoDuration - 30 : 0;
    const startTime = Math.floor(Math.random() * maxStartTime);

    const selectedSong = {
    video: `https://www.youtube.com/embed/${selectedSongData.link}?start=${startTime}&autoplay=1&enablejsapi=1`,
    currentGame: selectedGame,
    currentSong: selectedSongData
};

room.currentSongData = selectedSong; // <--- HIER SPEICHERN für neue Spieler
io.to(roomName).emit('gameStarted', selectedSong, room.maxRounds);
   
  } catch (error) {
    console.log('Error in sendSelectedSong:', error);
  }
}

function resetPlayedSongs() {
  try {
    playedSongs = [];
  } catch (error) {
    console.log('Error in resetPlayedSongs:', error);
  }
}

function updateConnectedClients() {
  try {
    io.emit('updateClients', clients);
  } catch (error) {
    console.log('Error in updateConnectedClients:', error);
  }
}

function startTimer(roomName) {
    const room = rooms[roomName];
    if (!room) return;

    // Stoppe den alten Timer dieses spezifischen Raums
    if (room.timer) clearInterval(room.timer);

    let remainingTime = countdownDuration;
    io.to(roomName).emit('startTimer', { remainingTime });

    room.timer = setInterval(() => {
        remainingTime--;
        
        // Wir prüfen bei jedem Tick, ob der Raum noch existiert
        if (!rooms[roomName]) {
            clearInterval(room.timer);
            return;
        }

        io.to(roomName).emit('updateTimer', { remainingTime });

        if (remainingTime <= 0) {
            clearInterval(room.timer);
            io.to(roomName).emit('timerFinished');
            
            room.currentRound++; // Raumspezifische Runde erhöhen

            if (room.currentRound < room.maxRounds) {
                setTimeout(() => {
                    io.to(roomName).emit('nextSongLoading');
                    setTimeout(() => {
                        sendSelectedSong(roomName); 
                        startTimer(roomName);
                    }, pauseDuration * 1000);
                }, 0);
            } else {
                setTimeout(() => {
                    announceWinner(roomName);
                }, 500);
            }
        }
    }, 1000);
}

function announceWinner(roomName) {
    try {
    const room = rooms[roomName];
    if (!room || !room.clients) return;

    // FIX: Nutze room.clients für die Berechnung
    const allPoints = room.clients.map(c => c.points);
    const maxPoints = Math.max(...allPoints);
    const winners = room.clients.filter(c => c.points === maxPoints);

    // FIX: Nur an diesen Raum emittieren
    io.to(roomName).emit('winnerAnnounced', winners);
    
    room.isStarted = false;
    room.currentRound = 0;
  } catch (error) {
    console.log('Error in announceWinner:', error);
  }
}

/*
*
*
Lobby Logik
*
*
*/
function createRoomData(roomName, password, maxRounds) {
  return {
    roomName: roomName,
    password: password || null,
    maxRounds: parseInt(maxRounds) || 20,
    currentRound: 0,
    clients: [],
    timer: null,
    playedGames: [],
    isStarted: false,
    musicData: []
  };
}

function broadcastLobbyList() {
    const lobbyList = Object.values(rooms).map(r => ({
        name: r.roomName,
        playerCount: r.clients.length,
        hasPassword: !!r.password,
        isStarted: r.isStarted
    }));
    io.emit('lobbyList', lobbyList);
}


io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('setUsername', (username, selectedSkin) => {
    try {
      const skin = selectedSkin || "https://raw.githubusercontent.com/Eder03/vmq_skins/main/skins/1.gif";
      clients.push({ id: socket.id, username: username, points: 0, skin: skin });
      updateConnectedClients();
    } catch (error) {
      console.log('Error in setUsername:', error);
    }
  });







socket.on('getLobbies', () => {
    const lobbyList = Object.values(rooms).map(r => ({
      name: r.roomName,
      playerCount: r.clients.length,
      hasPassword: !!r.password,
      isStarted: r.isStarted
    }));
    socket.emit('lobbyList', lobbyList);
  });

  // 2. Lobby erstellen
  // 2. Lobby erstellen
// Im Server: socket.on('createLobby', ...)
socket.on('createLobby', (data) => {
    const { roomName, password, rounds, username, skin } = data;
    
    // 1. Check ob Name existiert (Case-Insensitive)
    const roomExists = Object.keys(rooms).some(name => name.toLowerCase() === roomName.toLowerCase());
    
    if (roomExists) {
        return socket.emit('error_message', 'Dieser Lobby-Name ist bereits vergeben!');
    }

    // 2. Raum-Daten initialisieren
    rooms[roomName] = {
        roomName: roomName,
        hostId: socket.id,
        password: password || null,
        maxRounds: parseInt(rounds) || 20,
        clients: [], 
        isStarted: false,
        playedGames: [],
        musicData: []
    };

    // 3. Spieler-Objekt erstellen
    const newPlayer = { 
        id: socket.id, 
        username: username, 
        skin: skin, 
        points: 0 
    };

    // 4. WICHTIG: Socket in den Raum bringen
    socket.join(roomName);
    socket.roomName = roomName;

    // 5. Spieler in die Raum-Liste UND die globale Liste (für die Anzeige) pushen
    rooms[roomName].clients.push(newPlayer);
    
    // Falls du die globale 'clients' Liste noch für die Anzeige nutzt:
    if (!clients.find(c => c.id === socket.id)) {
        clients.push(newPlayer);
    }

    // 6. Sofortiges Update an den Raum (Ersteller sieht sich selbst)
    io.to(roomName).emit('updateClients', rooms[roomName].clients);
    
    // 7. Bestätigung an den Client zum Umschalten
    socket.emit('lobbyCreated', { roomName });
    
    // 8. Globale Liste für alle anderen aktualisieren
    broadcastLobbyList();
});

  // 3. Lobby beitreten
 socket.on('joinLobby', ({ roomName, password, username, skin }) => {
    const room = rooms[roomName];
    if (!room) return socket.emit('error_message', 'Lobby nicht gefunden');
    if (room.password && room.password !== password) return socket.emit('error_message', 'Falsches Passwort');

    socket.join(roomName);
    socket.roomName = roomName;

    const newPlayer = { 
        id: socket.id, 
        username: username, 
        points: 0, 
        skin: skin || "https://raw.githubusercontent.com/Eder03/vmq_skins/main/skins/1.gif" 
    };

    room.clients.push(newPlayer);
    if (!clients.find(c => c.id === socket.id)) clients.push(newPlayer);

    // Alle im Raum über den neuen Spieler informieren
    io.to(roomName).emit('updateClients', room.clients);
    broadcastLobbyList();

    // --- LOGIK FÜR LATE JOIN ---
    if (room.isStarted) {
        // 1. Dem neuen Spieler sagen, dass das Spiel läuft
        // Wir senden den 'currentSong', den der Raum gerade spielt
        // Dafür müssen wir den aktuellen Song in room.currentSongData zwischenspeichern (siehe unten)
        if (room.currentSongData) {
            socket.emit('gameStarted', room.currentSongData, room.maxRounds);
            socket.emit('hideStartButton'); // Damit er den Button nicht sieht
        }

        // 2. Den aktuellen Timer-Stand schicken (falls vorhanden)
        // Wir berechnen die verbleibende Zeit oder triggern einfach das Timer-Update
        // (Optional: Du könntest eine Variable room.lastRemainingTime mitführen)
    }
});










  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const roomName = socket.roomName;

    // 1. Aus der globalen Liste löschen
    clients = clients.filter(c => c.id !== socket.id);

    if (roomName && rooms[roomName]) {
        const room = rooms[roomName];

        // 2. Aus der Raum-Liste löschen
        room.clients = room.clients.filter(c => c.id !== socket.id);

        // 3. Falls der Raum nun leer ist -> Raum löschen
        if (room.clients.length === 0) {
            if (room.timer) clearInterval(room.timer); // Timer stoppen!
            delete rooms[roomName];
            console.log(`Lobby ${roomName} gelöscht, da leer.`);
        } else {
            // 4. Falls der Host gegangen ist -> Neuen Host ernennen
            if (room.hostId === socket.id) {
                room.hostId = room.clients[0].id;
            }
            // 5. Andere im Raum informieren
            io.to(roomName).emit('updateClients', room.clients);
        }
    }
    broadcastLobbyList();
});

  socket.on('startGame', async () => {
    const roomName = socket.roomName;
    console.log(roomName)
    const room = rooms[roomName];
    if (!room || socket.id !== room.hostId) return;
    
    room.isStarted = true;
    room.currentRound = 0;
    room.playedGames = []; // Reset für diesen Raum

    try {
        // Global laden, falls noch nicht geschehen
        if (musicData.length === 0) {
            const res = await axios.get('https://vmq.onrender.com/getAll');
            musicData = res.data;
        }

        sendSelectedSong(roomName);
        startTimer(roomName);
    } catch (error) {
        console.error("Fehler beim Starten des Spiels:", error);
    }
});

  socket.on('sendPoints', ({ points }) => {
    try {
     const roomName = socket.roomName; // Raumname vom Socket holen
    const room = rooms[roomName];
    
    if (room) {
      const client = room.clients.find(c => c.id === socket.id);
      if (client) {
        client.points = points;
        // FIX: Sende NUR room.clients (die Spieler dieser Lobby) 
        // statt der globalen 'clients' Liste
        io.to(roomName).emit('updatePoints', room.clients);
      }
    }
    } catch (error) {
      console.log('Error in sendPoints:', error);
    }
  });

  socket.on('loadNextSong', () => {
    try {
      sendSelectedSong();
      startTimer();
    } catch (error) {
      console.log('Error in loadNextSong:', error);
    }
  });

  socket.on('sendWinner', (winner) => {
    try {
      io.emit('winnerAnnounced', winner);
    } catch (error) {
      console.log('Error in sendWinner:', error);
    }
  });

  socket.on('userGuess', ({ username, guess, isCorrect }) => {
    try {
      console.log("UserGuess")
      const roomName = socket.roomName
      console.log(roomName)
      io.to(roomName).emit('updateGuesses', { username, guess, isCorrect });
    } catch (error) {
      console.log('Error in userGuess:', error);
    }
  });

  socket.on('resetGameAndPoints', () => {
    try {
      const roomName = socket.roomName
      io.to(roomName).emit('resetGameState');
      io.to(roomName).emit('resetPoints');
    } catch (error) {
      console.log('Error in resetGameAndPoints:', error);
    }
  });

  socket.on('startGameAndHideButton', () => {
    try {
      const roomName = socket.roomName
      io.to(roomName).emit('hideStartButton');
    } catch (error) {
      console.log('Error in startGameAndHideButton:', error);
    }
  });

  socket.on('sendMessage', (message) => {
    try {
      const roomName = socket.roomName
      io.to(roomName).emit('receiveMessage', message);
    } catch (error) {
      console.log('Error in sendMessage:', error);
    }
  });
});