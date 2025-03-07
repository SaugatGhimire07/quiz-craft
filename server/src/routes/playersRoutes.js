import express from "express";
import { addPlayer, getPlayersByGamePin } from "../controllers/playersController.js";

const router = express.Router();

router.post("/join", addPlayer);
router.get("/:gamePin", getPlayersByGamePin);

export default router;