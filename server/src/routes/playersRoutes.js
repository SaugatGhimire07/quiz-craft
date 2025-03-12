import express from "express";
import {
  addPlayer,
  getPlayersByGamePin,
  getSessionParticipants,
} from "../controllers/playersController.js";

const router = express.Router();

router.post("/join", addPlayer);
router.get("/:gamePin", getPlayersByGamePin);
router.get("/session/:pin/participants", getSessionParticipants);

export default router;
