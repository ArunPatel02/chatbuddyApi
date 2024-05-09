import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import connectToDatabase from "./database/connection";
import router from "./routes";
import secureRoutes from "./routes/secureRoutes";
import { validateUser } from "./middleware";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { User } from "./database/models";
import { Expo } from 'expo-server-sdk';

// // Determine which .env file to load based on the NODE_ENV
// const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

// // Load the environment variables from the appropriate file
// dotenv.config({ path: envFile });


dotenv.config();

console.log(process.env.NODE_ENV)

const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json())

let expo = new Expo()

app.get("/", (req: Request, res: Response) => {
  console.log(Expo.isExpoPushToken("Exponen"))
  expo.sendPushNotificationsAsync([
    {
      to: "ExponentPushToken[DdSTn7MdHsKgOe-rslZDAJ]",
      title: "Arun Patel",
      body: "testing the server aaa",
      channelId: "default",
      data: { "screen": "friendrequest" }
    }
  ])
  res.json({ msg: "Express + TypeScript Server" });
});

app.use("/api", router)

app.use("/auth/api", validateUser, secureRoutes)

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  connectionStateRecovery: {}
}); // Create a Socket.IO server

app.set("app-io", io)
app.set("app-expo", expo)

io.on("connection", async (socket: Socket) => {
  console.log(chalk.bgBlue.white("A user connected", socket.handshake.headers.authorization, "->", socket.id));
  const userId = socket.handshake.headers.authorization
  const updateSocketId = await User.findByIdAndUpdate(userId, { socketId: socket.id, isOnline: true })
  socket.broadcast.emit("userOnline", updateSocketId?._id.toString())
  if (updateSocketId) {
    app.set("chat-socket", socket)
  }
  socket.on("disconnect", async () => {
    console.log(chalk.red("User disconnected", socket.id));
    const user = await User.findOne({ socketId: socket.id })
    if (user) {
      const updateUser = await User.findByIdAndUpdate(user._id, { socketId: "", isOnline: false, lastSeen: new Date() })
      socket.broadcast.emit("userOffline", JSON.stringify({ userId: updateUser?._id, lastSeen: new Date(), isOnline: false }));
    }
  });
});

// app.listen(port, () => {
//   console.log(chalk.bgBlue.white(`✅ [server]: Server is running at http://localhost:${port}`));
//   connectToDatabase()
// });
httpServer.listen(port, () => {
  console.log(chalk.bgBlue.white(`✅ [server]: Server is running at http://localhost:${port}`));
  connectToDatabase()
});