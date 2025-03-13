export const getOrCreateAvatar = (playerId, quizId) => {
  const storageKey = `avatar_${playerId}_${quizId}`;
  let avatarSeed = sessionStorage.getItem(storageKey);

  if (!avatarSeed) {
    // Generate a random seed if none exists
    avatarSeed = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem(storageKey, avatarSeed);
  }

  return avatarSeed;
};
