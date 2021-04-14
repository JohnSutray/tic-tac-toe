const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
// const io = require('socket.io')(server, {
//   cors: {
//     origin: '*',
//   },
// });
// const port = process.env.PORT || 3000;
//
// server.listen(port, () => console.log(`Listening on ${port}`));
//
// const rooms = [];
//
// io.on('connection', socket => {
//   const username = socket.handshake.auth.username;
//   if (!username) {
//     return next(new Error('invalid username'));
//   }
//   socket.username = username;
//   next();
//
//   socket.on('host game', (tags) => {
//     rooms.push({ socket, tags });
//   });
//
//   socket.on('stop host', () => {
//     rooms.splice(rooms.indexOf(username), 1);
//   });
//
//   socket.on('join game', (hostName) => {
//     const room = rooms.find(host => host.socket.username === hostName);
//
//     room.socket.emit('another joined', { username });
//
//
//   });
// });

// const onGameReady = (socket, game) => {
//   socket.on('move', (move) => {
//     game.moves[move.x][move.y] = move.value;
//
//     if ()
//       });
// };
//
// const findWinner = game => {
//   if () {
//
//   }
// };

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
    const row = rows[rowIndex - (rows.length - 1)];

    if (row[rowIndex] !== value) {
      return false;
    }
  }

  return true;
}

console.log(isWinner([
  [0, 0, 1],
  [0, 1, 0],
  [1, 1, 0]
], 1));

// app.use(express.static(path.join(__dirname, 'dist')));