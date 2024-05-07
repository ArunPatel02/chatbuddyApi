import express from "express";
import { createUser } from "../controlers/user";

const router = express.Router();

router.post("/creteUser" , createUser)

export default router;
