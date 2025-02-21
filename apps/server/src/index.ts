import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const server = http.createServer();

const ws = new WebSocketServer({ server });
const rooms = new Map<number, Set<{ socket: WebSocket, email: string }>>();

ws.on("connection", (socket) => {
    let userRoom: number | null = null;

    socket.on("message", async (message, isBinary) => {
        const data = JSON.parse(message.toString());


        if (data.type == "create-room") {
            const checkRoom = await prisma.room.findUnique({
                where: { roomNo: Number(data.roomNo) }
            });

            if (!checkRoom) {
                await prisma.room.create({
                    data: { roomNo: Number(data.roomNo), password: data.password }
                });

                rooms.set(Number(data.roomNo), new Set());
                socket.send(JSON.stringify({ message: "Room Created" }));
            } else {
                socket.send(JSON.stringify({ message: "Room Already Created" }));
            }
        }

        if (data.type === "join-room") {
            const checkRoom = await prisma.room.findFirst({
                where: { roomNo: Number(data.roomNo), password: data.password }
            });

            if (!checkRoom) {
                socket.send(JSON.stringify({ message: "Invalid Credentials" }));
                return;
            }

            const checkUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (!checkUser) {
                const hashPassword = await bcrypt.hash(data.emailPsw, 10);
                await prisma.user.create({ data: { email: data.email, password: hashPassword } });
            } else {
                const validPassword = await bcrypt.compare(data.emailPsw, checkUser.password);
                if (!validPassword) {
                    socket.send(JSON.stringify({ message: "Invalid password" }));
                    return;
                }
            }

            const roomNumber = Number(data.roomNo);
            userRoom = roomNumber;
            if (!rooms.has(userRoom)) {
                rooms.set(userRoom, new Set());
            }

            rooms.get(userRoom)?.add({ socket, email: data.email });
            socket.send(JSON.stringify({ status: "success", message: "User Successfully Joined Room", email: data.email }));

            const users = Array.from(rooms.get(userRoom) || []).map(user => user.email);
            rooms.get(userRoom)?.forEach(({ socket }) => {
                socket.send(JSON.stringify({ type: "users-list", users }));
            });
        }

        if (data.type === "code_update") {
            if (userRoom !== null && rooms.has(userRoom)) {
                rooms.get(userRoom)?.forEach(({ socket }) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: "code_update", code: data.code }));
                    }
                });
            }
        }

        if (data.type === "get-user") {
            if (userRoom !== null && rooms.has(userRoom)) {
                const users = Array.from(rooms.get(userRoom) || []).map(user => user.email);
                socket.send(JSON.stringify({ type: "users-list", users }));
            }
        }

        if (data.type === "leave") {
            if (userRoom !== null && rooms.has(userRoom)) {
                const roomUsers = rooms.get(userRoom);
                if (roomUsers) {
                    for (const user of roomUsers) {
                        if (user.socket === socket) {
                            roomUsers.delete(user);
                            break;
                        }
                    }
        
                    const users = Array.from(rooms.get(userRoom) || []).map(user => user.email);
                    rooms.get(userRoom)?.forEach(({ socket }) => {
                        socket.send(JSON.stringify({ type: "users-list", users }));
                    });
        
                    if (roomUsers.size === 0) {
                        rooms.delete(userRoom);
                    }
                }
            }
        }
        
        socket.on("close", () => {
            if (userRoom !== null && rooms.has(userRoom)) {
                const roomUsers = rooms.get(userRoom);
        
                if (roomUsers) {
                    for (const user of roomUsers) {
                        if (user.socket === socket) {
                            roomUsers.delete(user);
                            break;
                        }
                    }
        
                    const users = Array.from(rooms.get(userRoom) || []).map(user => user.email);
                    rooms.get(userRoom)?.forEach(({ socket }) => {
                        socket.send(JSON.stringify({ type: "users-list", users }));
                    });
        
                    if (roomUsers.size === 0) {
                        rooms.delete(userRoom);
                    }
                }
            }
        });
        

    });

    socket.on("error", (err) => console.log(err));

    socket.on("close", () => {
        if (userRoom !== null && rooms.has(userRoom)) {
            const roomUsers = rooms.get(userRoom);

            if (roomUsers) {
                // Find the user object with the matching socket
                for (const user of roomUsers) {
                    if (user.socket === socket) {
                        roomUsers.delete(user);
                        break;
                    }
                }

                const users = Array.from(rooms.get(userRoom) || []).map(user => user.email);
                    socket.send(JSON.stringify({ type: "users-list", users }));


                if (roomUsers.size === 0) {
                    rooms.delete(userRoom);
                }
            }
        }
    });
});

// Start the server
server.listen(4000, () => {
    console.log("Server is running on port 4000");
});

