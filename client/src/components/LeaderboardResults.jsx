import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useEffect } from "react";

const LeaderboardResults = ({
  score,
  leaderboard,
  currentPlayerId,
  isLoading,
}) => {
  const navigate = useNavigate();

  // Log rendered leaderboard for debugging
  useEffect(() => {
    console.log("Rendering leaderboard:", {
      score,
      leaderboardEntries: leaderboard.length,
      currentPlayerId,
      isLoading,
    });
  }, [score, leaderboard, currentPlayerId, isLoading]);

  return (
    <div className="quiz-results-container">
      <div className="quiz-results-card">
        <h2>Quiz Complete!</h2>
        <p className="your-score">Your Score: {score}</p>

        <div className="leaderboard">
          <h3>Results</h3>
          {isLoading ? (
            <div className="loading-results">
              <div className="spinner"></div>
              <p>Loading final results...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <p>No results available. Please try refreshing the page.</p>
          ) : (
            <div className="results-table">
              <div className="results-header">
                <span className="rank-header">Rank</span>
                <span className="player-header">Player</span>
                <span className="score-header">Score</span>
                <span className="answers-header">Correct Answers</span>
              </div>

              {leaderboard.map((entry, index) => {
                // Identify if this entry is the current player
                const isCurrentPlayer = entry.playerId === currentPlayerId;

                return (
                  <div
                    key={entry.playerId || `player-${index}`}
                    className={`results-row ${
                      isCurrentPlayer ? "current-live-player" : ""
                    }`}
                  >
                    <span className="rank-cell">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}.`}
                    </span>
                    <span className="player-cell">
                      {entry.playerName}
                      {isCurrentPlayer && (
                        <span className="you-live-badge"> (You)</span>
                      )}
                    </span>
                    <span className="score-cell">{entry.score}</span>
                    <span className="answers-cell">
                      {entry.correctAnswers}/{entry.totalQuestions}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="results-actions">
            <button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

LeaderboardResults.propTypes = {
  score: PropTypes.number.isRequired,
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string,
      playerName: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      correctAnswers: PropTypes.number.isRequired,
      totalQuestions: PropTypes.number.isRequired,
    })
  ).isRequired,
  currentPlayerId: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default LeaderboardResults;
