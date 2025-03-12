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
  const renderParticipants = () => {
    if (!Array.isArray(players) || players.length === 0) {
      return (
        <p className="no-participants">
          Share the game PIN with others to join!
        </p>
      );
    }

    return (
      <div className="participant-grid">
        {players.map((player) => {
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
              <span className="participant-name">{player.name}</span>
              {isCurrentPlayer && <span className="you-badge">You</span>}
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
          {players.length > 0
            ? `Participants (${players.length})`
            : "Waiting for participants..."}
        </h2>
        {renderParticipants()}
      </div>
    </div>
  );
};

ParticipantsList.propTypes = {
  players: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatarSeed: PropTypes.string,
      userId: PropTypes.string,
    })
  ).isRequired,
  isHost: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
  currentPlayerId: PropTypes.string,
  user: PropTypes.object,
};

export default ParticipantsList;
