import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

export const generateAvatar = (seed) => {
  const finalSeed = seed || Math.random().toString(36).substring(2, 15);

  const avatar = createAvatar(botttsNeutral, {
    seed: finalSeed,
    size: 128,
    radius: 50,
    backgroundType: ["gradientLinear", "solid"],
    mouth: [
      "bite",
      "diagram",
      "grill01",
      "grill02",
      "grill03",
      "smile01",
      "smile02",
      "square01",
      "square02",
    ],
    eyes: [
      "bulging",
      "dizzy",
      "eva",
      "frame1",
      "frame2",
      "glow",
      "happy",
      "hearts",
      "robocop",
      "round",
      "sensor",
      "shade01",
    ],
    backgroundColor: [
      "00acc1",
      "1e88e5",
      "5e35b1",
      "6d4c41",
      "7cb342",
      "8e24aa",
      "039be5",
      "43a047",
      "546e7a",
      "00897b",
      "3949ab",
      "757575",
      "c0ca33",
      "d81b60",
      "e53935",
      "f4511e",
      "fb8c00",
      "fdd835",
      "ffb300",
    ],
  });

  const svgString = avatar.toString();
  const encoded = window.btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${encoded}`;
};
