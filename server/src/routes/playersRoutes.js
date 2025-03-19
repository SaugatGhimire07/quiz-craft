import express from "express";
import {
  addPlayer,
  getPlayersByGamePin,
  getSessionParticipants,
  updatePlayerStatus, // Add this import
} from "../controllers/playersController.js";

const router = express.Router();

router.post("/join", addPlayer);
router.get("/:gamePin", getPlayersByGamePin);
router.get("/session/:pin/participants", getSessionParticipants);
router.post("/:playerId/leave", updatePlayerStatus); // Add this route

export default router;
