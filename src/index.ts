import { Server } from "socket.io";
import server from 'http'

const rooms: Map<string, Peer[]> = new Map()

const io = new Server(server.createServer());

interface Peer {
    id: string
    socketId: string
    userAgent: string
}



io.on("connection", (socket) => {
    console.log('connection', socket.data)
    // send a message to the client
    // socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });

    // receive a message from the client

    socket.on("disconnect", (...args) => {
        console.log('disconnected')

        const user = socket.data.user
        const roomId = socket.data.room
        let room = rooms.get(roomId) || [];
        if (room.filter(val => val.id == user).length > 0) {


            room = room.filter(value => user !== value.id)

            rooms.set(roomId, room)
        }
    });

    socket.on("connectionrequest", ({ peerId, roomId, userAgent }) => {
        console.log('connectionrequest', peerId, roomId)
        const room = rooms.get(roomId) || [];
        socket.data.room = roomId
        socket.data.user = peerId

        if (room.filter(val => val.id == peerId && val.socketId == socket.id).length < 1) {
            room.push({ id: peerId, socketId: socket.id, userAgent })

            rooms.set(roomId, room)

            socket.join(roomId)
        }
    });


    socket.on("request", ({ type, data, to }) => {
        const peers = rooms.get(socket.data.room)?.filter(val => val.id != to) || [];
        console.log('request', peers, type, data)
        if (peers.length > 0) {
            io.to(peers[0]?.socketId).emit('request', { type, data })
        }
    });

    socket.on("bye", ({ type, data, to }) => {

        socket.in(socket.data.room).emit('request', { type: "bye", data })

    });

    socket.on("peers", ({ roomId, data, }) => {

        // console.log('peers', roomId,  socket.data.user,  rooms)

        socket.emit('request', { type: 'peers', data: rooms.get(roomId)?.filter(value => socket.data.user !== value.id) })

    });
});



io.listen(3000);



console.log('started socket server')