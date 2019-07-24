const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')
const $messages = document.querySelector('#messages')
const $locationMessages = document.querySelector('#location-messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// ignoreQueryPrefix ignores ? mark
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Autoscroll
const autoscroll = () => {
    // New message element
    // lastElementChild will grab new message as an element
    const $newMessage = $messages.lastElementChild

    // Get height/margin of new message
    // getComputedStyle gets styles of new message sent
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Get visible height of chat window
    const visibleHeight = $messages.offsetHeight

    // Height of messages container 
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    // scrollTop will give distance from the top of container to how far scrolled down
    const scrollOffset = $messages.scrollTop + visibleHeight

    // find out if scrolled to bottom before last message was added
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // autoscroll to the bottom
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Events recieved from server
// socket.on() are listener events
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// emit event from client called sendMessage when form is submitted
$messageForm.addEventListener('submit', (e) => {
    // prevent full page refresh
    // if refresh you lose data
    e.preventDefault()

    // disable form button until message has been sent
    $messageFormButton.setAttribute('disabled', 'disabled' )

    // get message from input field
    let message = e.target.elements.message.value

    // add acknowledgement from server that message was recieved
    // it's the last function
    socket.emit('sendMessage', message, (error) => {
        // enable form button
        $messageFormButton.removeAttribute('disabled')
        // wipe text from form input field
        $messageFormInput.value = ''
        // refocus attention to field
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('The message was delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('GeoLocation is not supported by your browser')
    }

    // disable share location button
    $sendLocationButton.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        // redirect to homepage
        location.href= '/'
    }
})