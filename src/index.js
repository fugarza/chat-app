const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('../src/utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// setup express, http, and web sockets
const app = express()
// create server outside express app
const server = http.createServer(app)
// create socket.io and call with raw http server
const io = socketio(server)

const port = process.env.PORT || 3000
// set folder to public directory
const publicDirectoryPath = path.join(__dirname, '../public')


app.use(express.static(publicDirectoryPath))

// for socket io need to also add following...
// also need to add to html file of public direcotry
// <script src="/socket.io/socket.io.js"></script> to html file
// <script src="/js/chat.js"></script>
// create /public/js/chat.js

// socket is an object that contains info about the new connection
io.on('connection', (socket) => {
    console.log('new websocket connection')

    // const user = getUser(socket.id);

    socket.on('join', ({ username, room }, callback) => {
        
        const {error, user} = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
            // send event to currenlty connected client
            // socket.emit only sends to one client
            socket.emit('message', generateMessage('Admin', `Welcome ${user.username}!`))
            // emit to all connected clients except this one
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
    })

    // recieve event from client called sendMessage
    // send acknowledgment message back to client that sent with callback
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        // badwords filter
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        // send event to every connected client in chat room
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    // recieve location from connected client
    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id);
        const location = `https://google.com/maps?q=${position.latitude},${position.longitude}`
        io.to(user.room)
        .emit(
            'locationMessage',
            generateLocationMessage(user.username, location)
	);
        callback()
    })

    // when a socket is disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left.`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
})

server.listen(port, () => {
    console.log(`listening on port ${port}`)
})