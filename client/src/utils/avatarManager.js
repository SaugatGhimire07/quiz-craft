export const getOrCreateAvatar = (playerId, quizId) => {
  const storageKey = `avatar_${playerId}_${quizId}`;
  let avatarSeed = sessionStorage.getItem(storageKey);

  if (!avatarSeed) {
    // Generate a deterministic seed using only playerId
    avatarSeed = `avatar_${playerId}`;
    sessionStorage.setItem(storageKey, avatarSeed);
  }

  return avatarSeed;
};
