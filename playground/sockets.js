// for socket io need to also add following...
// also need to add to html file of public direcotry
// <script src="/socket.io/socket.io.js"></script> to html file
// <script src="/js/chat.js"></script>
// create /public/js/chat.js

let count = 0

// socket is an object that contains info about the new connection
io.on('connection', (socket) => {
    console.log('new websocket connection')
    // send event to client
    // socket.emit only sends to one client
    socket.emit('countUpdated',count)

    // recieve event from client called increment
    socket.on('increment', () => {
        count++
        // io.emit() sends event to all connected clients
        io.emit('countUpdated', count)
    })
})


//

// recieve event from server
socket.on('countUpdated', (count) => {
    console.log('The count has been updated', count)
})


// emit event from client called increment
document.querySelector('#increment').addEventListener('click', () => {
    console.log('Button clicked')
    socket.emit('increment')
})