export const getOrCreateAvatar = (playerId, quizId) => {
  const storageKey = `avatar_${playerId}_${quizId}`;
  let avatarSeed = sessionStorage.getItem(storageKey);

  if (!avatarSeed) {
    // Use consistent seed format
    avatarSeed = `avatar_${playerId}`;
    sessionStorage.setItem(storageKey, avatarSeed);
  }

  return avatarSeed;
};

export const updateAvatarSeed = (playerId, quizId, seed) => {
  const storageKey = `avatar_${playerId}_${quizId}`;
  sessionStorage.setItem(storageKey, seed);
};
