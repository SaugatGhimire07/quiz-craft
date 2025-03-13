import PropTypes from "prop-types";
import { generateAvatar } from "../utils/avatarGenerator";
import "../styles/waiting-room.css";

const ParticipantsList = ({
  players,
  isHost,
  currentUserId,
  currentPlayerId,
  user,
}) => {
  // Filter out hosts and show only connected participants
  const activePlayers = players.filter(
    (player) => player.isConnected && !player.isHost && player.role !== "host"
  );

  const renderParticipants = () => {
    if (!Array.isArray(activePlayers) || activePlayers.length === 0) {
      return (
        <p className="no-participants">
          Share the game PIN with others to join!
        </p>
      );
    }

    return (
      <div className="participant-grid">
        {activePlayers.map((player) => {
          const isCurrentPlayer =
            !isHost &&
            (currentPlayerId === player._id ||
              (user && user._id === player.userId));

          return (
            <div
              key={player._id}
              className={`participant-card ${
                isCurrentPlayer ? "current-player" : ""
              }`}
            >
              <img
                src={generateAvatar(player.avatarSeed || player.name)}
                alt={`${isCurrentPlayer ? "Your" : `${player.name}'s`} avatar`}
                className="participant-avatar"
                width="64"
                height="64"
                loading="lazy"
              />
              <span className="participant-name">
                {isCurrentPlayer ? "You" : player.name}
              </span>
              {isCurrentPlayer && (
                <span className="you-badge">Current Player</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="waiting-message">
      <div className="participant-status">
        <h2 className="participant-header">
          {activePlayers.length > 0
            ? `Participants (${activePlayers.length})`
            : "Waiting for participants..."}
        </h2>
        {renderParticipants()}
      </div>
    </div>
  );
};

// Update PropTypes to include isConnected
ParticipantsList.propTypes = {
  players: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatarSeed: PropTypes.string,
      userId: PropTypes.string,
      isConnected: PropTypes.bool,
    })
  ).isRequired,
  isHost: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
  currentPlayerId: PropTypes.string,
  user: PropTypes.object,
};

export default ParticipantsList;
