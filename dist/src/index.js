var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import connectToDatabase from "./database/connection/index.js";
import router from "./routes/index.js";
import secureRoutes from "./routes/secureRoutes.js";
import { validateUser } from "./middleware/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { User } from "./database/models/index.js";
import { Expo } from 'expo-server-sdk';
// // Determine which .env file to load based on the NODE_ENV
// const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
// // Load the environment variables from the appropriate file
// dotenv.config({ path: envFile });
dotenv.config();
console.log(process.env.NODE_ENV);
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;
app.use(express.json());
let expo = new Expo();
app.get("/", (req, res) => {
    console.log(Expo.isExpoPushToken("Exponen"));
    expo.sendPushNotificationsAsync([
        {
            to: "ExponentPushToken[DdSTn7MdHsKgOe-rslZDAJ]",
            title: "Arun Patel",
            body: "testing the server aaa",
            channelId: "default",
            data: { "screen": "friendrequest" }
        }
    ]);
    res.json({ msg: "Express + TypeScript Server" });
});
app.use("/api", router);
app.use("/auth/api", validateUser, secureRoutes);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        allowedHeaders: ["Authorization"],
        credentials: true
    },
    connectionStateRecovery: {}
}); // Create a Socket.IO server
app.set("app-io", io);
app.set("app-expo", expo);
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk.bgBlue.white("A user connected", socket.handshake.headers.authorization, "->", socket.id));
    const userId = socket.handshake.headers.authorization;
    const updateSocketId = yield User.findByIdAndUpdate(userId, { socketId: socket.id, isOnline: true });
    socket.broadcast.emit("userOnline", updateSocketId === null || updateSocketId === void 0 ? void 0 : updateSocketId._id.toString());
    if (updateSocketId) {
        app.set("chat-socket", socket);
    }
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(chalk.red("User disconnected", socket.id));
        const user = yield User.findOne({ socketId: socket.id });
        if (user) {
            const updateUser = yield User.findByIdAndUpdate(user._id, { socketId: "", isOnline: false, lastSeen: new Date() });
            socket.broadcast.emit("userOffline", { userId: updateUser === null || updateUser === void 0 ? void 0 : updateUser._id, lastSeen: new Date(), isOnline: false });
        }
    }));
}));
// app.listen(port, () => {
//   console.log(chalk.bgBlue.white(`✅ [server]: Server is running at http://localhost:${port}`));
//   connectToDatabase()
// });
httpServer.listen(port, () => {
    console.log(chalk.bgBlue.white(`✅ [server]: Server is running at http://localhost:${port}`));
    connectToDatabase();
});
