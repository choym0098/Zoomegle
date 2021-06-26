const socket = io('/');

socket.on('connect', () => {
    console.log('successfully connected to web socket server');
    console.log(socket.id);
});
