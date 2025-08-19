import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface SocketWithIO extends NextApiResponse {
  socket: {
    server: SocketServer;
  };
}

export interface UserSocket {
  userId: string;
  storeId?: string;
  socketId: string;
}

class SocketManager {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, UserSocket> = new Map();
  private storeSockets: Map<string, string[]> = new Map(); // storeId -> socketIds[]

  initialize(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Handle user authentication
      socket.on(
        "authenticate",
        (data: { userId: string; storeId?: string }) => {
          this.authenticateUser(socket.id, data.userId, data.storeId);
        }
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnect(socket.id);
      });

      // Join store room for store owners
      socket.on("join-store", (storeId: string) => {
        socket.join(`store-${storeId}`);
      });

      // Join user room for customers
      socket.on("join-user", (userId: string) => {
        socket.join(`user-${userId}`);
      });
    });

    return this.io;
  }

  private authenticateUser(socketId: string, userId: string, storeId?: string) {
    // Remove existing socket for this user
    this.removeUserSocket(userId);

    // Add new socket
    const userSocket: UserSocket = {
      userId,
      storeId,
      socketId,
    };

    this.userSockets.set(userId, userSocket);

    // Add to store sockets if store owner
    if (storeId) {
      if (!this.storeSockets.has(storeId)) {
        this.storeSockets.set(storeId, []);
      }
      this.storeSockets.get(storeId)!.push(socketId);
    }

    console.log(`User ${userId} authenticated on socket ${socketId}`);
  }

  private removeUserSocket(userId: string) {
    const existingSocket = this.userSockets.get(userId);
    if (existingSocket) {
      // Remove from store sockets
      if (existingSocket.storeId) {
        const storeSockets = this.storeSockets.get(existingSocket.storeId);
        if (storeSockets) {
          const index = storeSockets.indexOf(existingSocket.socketId);
          if (index > -1) {
            storeSockets.splice(index, 1);
          }
        }
      }

      this.userSockets.delete(userId);
    }
  }

  private handleDisconnect(socketId: string) {
    // Find and remove user socket
    for (const [userId, userSocket] of this.userSockets.entries()) {
      if (userSocket.socketId === socketId) {
        this.removeUserSocket(userId);
        break;
      }
    }

    console.log("User disconnected:", socketId);
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return false;

    const userSocket = this.userSockets.get(userId);
    if (userSocket) {
      this.io.to(userSocket.socketId).emit(event, data);
      return true;
    }

    // Fallback: emit to user room
    this.io.to(`user-${userId}`).emit(event, data);
    return true;
  }

  // Send notification to store owners
  sendToStore(storeId: string, event: string, data: any) {
    if (!this.io) return false;

    this.io.to(`store-${storeId}`).emit(event, data);
    return true;
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], event: string, data: any) {
    if (!this.io) return false;

    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });

    return true;
  }

  // Send notification to multiple stores
  sendToStores(storeIds: string[], event: string, data: any) {
    if (!this.io) return false;

    storeIds.forEach((storeId) => {
      this.sendToStore(storeId, event, data);
    });

    return true;
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    if (!this.io) return false;

    this.io.emit(event, data);
    return true;
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  getConnectedStores() {
    return Array.from(this.storeSockets.keys());
  }
}

export const socketManager = new SocketManager();
export default socketManager;
