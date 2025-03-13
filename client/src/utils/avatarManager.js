export const getOrCreateAvatar = (playerId, quizId) => {
  const storageKey = `avatar_${playerId}_${quizId}`;
  let avatarSeed = sessionStorage.getItem(storageKey);

  if (!avatarSeed) {
    // Generate a deterministic seed based on playerId
    avatarSeed = `${playerId}-${Date.now()}`;
    sessionStorage.setItem(storageKey, avatarSeed);
  }

  return avatarSeed;
};
