import PropTypes from "prop-types";

const WaitingForResults = ({ score, playerName }) => {
  return (
    <div className="waiting-results-container">
      <div className="waiting-results-card">
        <h2>Quiz Complete!</h2>
        <p className="your-score">Your Score: {score}</p>
        <div className="result-waiting-message">
          <div className="spinner"></div>
          <p>Waiting for other participants to finish the quiz...</p>
          <p className="small-text">
            Results will be displayed when everyone completes the quiz
          </p>
        </div>
        <div className="player-info">
          <p>
            <strong>{playerName}</strong>, you&apos;ve finished the quiz!
          </p>
        </div>
      </div>
    </div>
  );
};

WaitingForResults.propTypes = {
  score: PropTypes.number.isRequired,
  playerName: PropTypes.string.isRequired,
};

export default WaitingForResults;
