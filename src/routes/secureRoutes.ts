import express from "express";
import { checkOtp, getFriendUserById, getUserById, logoutUser, updateUser } from "../controlers/user";
import { acceptFriendRequest, createFriendRequest, getFriendList, getFriendRequests, getUsersToSendFriendRequest, rejectFriendRequest } from "../controlers/friendRequest";
import { getMessages, markMessagesAsRead, sendMessage } from "../controlers/messages";
import { getContact } from "../controlers/contact";

const secureRoutes = express.Router();

// Route to check OTP
secureRoutes.post("/checkOtp", checkOtp)

// Route to update user
secureRoutes.post("/updateUser", updateUser)


secureRoutes.get("/logout/:id", logoutUser)

// Route to get user by ID
secureRoutes.get("/getUser", getUserById)

// Route to get users to send friend requests
secureRoutes.get("/getUsersToSendFriendRequest", getUsersToSendFriendRequest)

// Route to send friend requests
secureRoutes.post("/sendFriendRequest", createFriendRequest)

// Router to get friend requests
secureRoutes.get("/getFriendRequest", getFriendRequests)

// Router to accept friend requests
secureRoutes.post("/acceptFriendRequest", acceptFriendRequest)

// router to reject friend requests
secureRoutes.post("/rejectFriendRequest", rejectFriendRequest)

// Route to get friend list 
secureRoutes.get("/getFriendList", getFriendList)

// get another user by user id
secureRoutes.get("/getFriendUserById/:id", getFriendUserById)


//messages routes

//route to send message 
secureRoutes.post("/sendMessage", sendMessage)

//route to get message 
secureRoutes.get("/getMessages/:userId", getMessages)

// route to get contact list 
secureRoutes.get("/getContactList", getContact)

//route to mark Messages As Read 
secureRoutes.get("/markMessagesAsRead/:userId", markMessagesAsRead)

export default secureRoutes;
