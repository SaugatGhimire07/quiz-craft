import mongoose from "mongoose";
import Player from "../models/Player.js";
import QuizSession from "../models/QuizSession.js";
import PlayerScore from "../models/PlayerScore.js";

/**
 * Cleans up inactive sessions and players
 * Can be called periodically (e.g., daily) or manually
 */
export const cleanupOldSessions = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(
      `Cleaning up sessions and players older than ${daysOld} days (before ${cutoffDate})`
    );

    // Find inactive sessions
    const oldSessions = await QuizSession.find({
      isActive: false,
      $or: [
        { endedAt: { $lt: cutoffDate } },
        { updatedAt: { $lt: cutoffDate } },
      ],
    });

    console.log(`Found ${oldSessions.length} old sessions to archive`);

    // For each session, archive related data
    for (const session of oldSessions) {
      // Archive players (or mark them as archived)
      const playerCount = await Player.updateMany(
        { sessionId: session._id },
        { archived: true }
      );

      // Note: In a production environment with large datasets,
      // you might want to implement a more sophisticated archiving strategy

      console.log(
        `Archived ${playerCount.modifiedCount} players for session ${session._id}`
      );
    }

    console.log("Cleanup completed successfully");
    return {
      success: true,
      sessionsProcessed: oldSessions.length,
    };
  } catch (error) {
    console.error("Error during cleanup:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export other utility functions if needed
