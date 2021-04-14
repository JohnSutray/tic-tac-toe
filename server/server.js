const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const port = process.env.PORT || 3000;
const {
  CLIENT_EVENTS,
  SERVER_EVENTS
} = require('../src/events.js');

app.use(express.static(path.join(__dirname, 'dist')));
server.listen(port, () => console.log(`Listening on ${port}`));

const rooms = [];

const getRooms = () => ({
  rooms: rooms.map(room => ({ hostName: room.socket.username, tags })),
});

const removeRoom = (username) => {
  const indexOfRoom = rooms.findIndex(room => room.socket.username === username);
  rooms.splice(indexOfRoom, 1);
};

const addRoom = (socket, tags ) => rooms.push({ socket, tags });

const findRoom = (hostName) => rooms.find(host => host.socket.username === hostName);

const createGame = (hostName, username) => ({
  moves: [[], [], []],
  firstPlayer: hostName,
  secondPlayer: username,
});

const getTags = () => {
  const set = new Set();

  rooms.map(room => room.tags).forEach(
    tags => tags.forEach(
      tag => set.add(tag),
    ),
  );

  return Array.from(set);
};

io.on('connection', socket => {
  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error('invalid username'));
  }

  socket.username = username;

  socket.on(CLIENT_EVENTS.HOST_GAME, (tags) => {
    addRoom(socket, tags);
    socket.broadcast.emit(SERVER_EVENTS.UPDATE_HOSTS, getRooms());
  });

  socket.on(CLIENT_EVENTS.STOP_HOST, () => {
    removeRoom(username);
    socket.broadcast.emit(SERVER_EVENTS.UPDATE_HOSTS, getRooms());
  });

  socket.on(CLIENT_EVENTS.JOIN_GAME, (hostName) => {
    const room = findRoom(hostName);
    const game = createGame(hostName, username);
    removeRoom(hostName);

    room.socket.emit(SERVER_EVENTS.ANOTHER_JOINED, { username, game });
    onGameReady(room);
  });
});

const onGameReady = (socket, otherSocket, game) => {
  socket.on(CLIENT_EVENTS.MOVE, (move) => {
    game.moves[move.x][move.y] = move.value;
    const winner = findWinner(game);

    if (winner) {
      socket.emit(SERVER_EVENTS.WIN, { winner });
      otherSocket.emit(SERVER_EVENTS.WIN, { winner });
    }
  });
};

const findWinner = game => {
  if (isWinner(game.moves, 'x')) {
    return game.firstPlayer;
  }

  if (isWinner(game.moves, 'o')) {
    return game.secondPlayer;
  }

  return null;
};

function selectOneFromPair(first, second) {
  return Math.random() > 0.5 ? first : second;
}

function isWinner(moves, value) {
  return moves.some(row => isRowFull(row))
    || moves.some((row, index) => isColumnFull(moves, index, value))
    || isDiagonalFull(moves, value)
    || isReversedDiagonalFull(moves, value);
}

function isRowFull(row, value) {
  return row.every(item => item === value);
}

function isColumnFull(rows, columnIndex, value) {
  return rows.every(row => row[columnIndex] === value);
}

function isDiagonalFull(rows, value) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    if (row[rowIndex] !== value) {
      return false;
    }
  }

  return true;
}

function isReversedDiagonalFull(rows, value) {
  for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
    const row = rows[Math.abs(rowIndex - (rows.length - 1))];

    if (row[rowIndex] !== value) {
      return false;
    }
  }

  return true;
}
