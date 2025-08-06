import { emitter } from "@server/eventbus";
import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

const clients: Record<string, Socket> = {};

interface AuthSocket extends Socket {
  user?: {};
}

export function registerSocket(server: HttpServer) {
  const io = new Server(server);

  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    socket.user = {};
    // jwt.verify(token, "YOUR_SECRET_KEY", (err, decoded) => {
    //   if (err) {
    //     return next(new Error("Authentication error"));
    //   }
    //   socket.user = decoded; // Attaches user info to the socket
    //   next();
    // });
    next();
  });

  io.on("connection", (socket: AuthSocket) => {
    clients[socket.id] = socket;

    console.log(`Socket ${socket.id} is connecting.`);
  });

  emitter.on("meeting:init", (data) => {
    io.emit("meeting:init", data);
  });

  emitter.on("action:new-items", (data) => {
    io.emit("action:new-items", data);
  });
}
