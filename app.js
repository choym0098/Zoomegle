const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

let connectedPeers = [];

io.on('connection', (socket) => {
    connectedPeers.push(socket.id);

    socket.on('pre-offer', (data) => {
        const { calleePersonalCode, callType } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === calleePersonalCode
        });

        if (connectedPeer) {
            const data = {
                callerSocketId: socket.id,
                callType: callType,
            };

            io.to(calleePersonalCode).emit('pre-offer', data);
        } else {
            const data = {
                preOfferAnswer: 'CALLEE_NOT_FOUND',
            }
            io.to(socket.id).emit('pre-offer-answer', data);
        }
    });

    socket.on('webRTC-signaling', (data) => {
        const { connectedUserSocketId } = data;
        
        const connectedPeer = connectedPeers.find((peerSocketId) => {
            return peerSocketId === connectedUserSocketId
        });
        
        if (connectedPeer) {
            io.to(connectedUserSocketId).emit('webRTC-signaling', data);
        }
    })

    socket.on('pre-offer-answer', (data) => {
        const { callerSocketId } = data;
        console.log('pre offer answer came');
        console.log(data);

        const connectedPeer = connectedPeers.find((peerSocketId) => 
            peerSocketId === callerSocketId
        );

        if (connectedPeer) {
            io.to(data.callerSocketId).emit('pre-offer-answer', data);
        }
    })

    socket.on('user-hanged-up', (data) => {
        const { connectedUserSocketId } = data

        const connectedPeer = connectedPeers.find((peerSocketId) => 
            peerSocketId === connectedUserSocketId
        );

        if (connectedPeer) {
            io.to(connectedUserSocketId).emit('user-hanged-up');
        }
    })

    socket.on('disconnect', () => {
        console.log("user disconnected");

        const newConnectedPeers = connectedPeers.filter((peerSocketId) => {
            return peerSocketId !== socket.id;
        });

        connectedPeers = newConnectedPeers;
        console.log("connected peers : ", connectedPeers);
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
