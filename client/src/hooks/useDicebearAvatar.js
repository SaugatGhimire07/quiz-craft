import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

/**
 * Custom hook that generates a consistent avatar URL based on a seed
 * @param {string} seed - Seed value for generating consistent avatars
 * @returns {string} Data URI of the generated avatar SVG
 */
const useDicebearAvatar = (seed) => {
  return useMemo(() => {
    // Use provided seed or generate random one
    const finalSeed = seed || Math.random().toString(36).substring(2, 15);

    // Create avatar with Adventurer style
    const avatar = createAvatar(adventurer, {
      seed: finalSeed,
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
      radius: 50,
      backgroundType: ["solid"],
      earrings: ["variant01", "variant02", "variant03"],
      eyebrows: ["variant01", "variant02", "variant03", "variant04"],
      eyes: ["variant01", "variant02", "variant03", "variant04", "variant05"],
      features: ["variant01", "variant02"],
      glasses: [
        "variant01",
        "variant02",
        "variant03",
        "variant04",
        "variant05",
      ],
      hair: ["long", "short", "pixie", "mohawk", "wave"],
      hairColor: ["77311d", "000000", "6c4545", "ff488e", "fc6d26"],
      mouth: ["variant01", "variant02", "variant03", "variant04", "variant05"],
    });

    return avatar.toDataUriSync();
  }, [seed]); // Only regenerate if seed changes
};

export default useDicebearAvatar;
