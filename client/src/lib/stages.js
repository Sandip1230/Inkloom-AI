export const STAGES = [
  { key: "understand", label: "Discover", subtitle: "Your Idea", icon: "bulb", short: "The idea, audience and constraints." },
  { key: "position", label: "Position", subtitle: "Find Your Edge", icon: "target", short: "Category, differentiator, value prop." },
  { key: "shape", label: "Shape", subtitle: "Name & Voice", icon: "person", short: "Personality, naming, voice, tagline." },
  { key: "visualize", label: "Visualize", subtitle: "Design Direction", icon: "image", short: "Typography, color, imagery direction." },
  { key: "challenge", label: "Challenge", subtitle: "Refine & Improve", icon: "spark", short: "Clichés and weak assumptions, flagged." },
  { key: "deliver", label: "Deliver", subtitle: "Your Brand Kit", icon: "rocket", short: "The consistency-checked brand kit." },
];

export const STAGE_KEYS = STAGES.map((stage) => stage.key);

export function nextStageKey(currentKey) {
  const index = STAGE_KEYS.indexOf(currentKey);
  if (index === -1 || index === STAGE_KEYS.length - 1) return null;
  return STAGE_KEYS[index + 1];
}

export function previousStageKey(currentKey) {
  const index = STAGE_KEYS.indexOf(currentKey);
  if (index <= 0) return null;
  return STAGE_KEYS[index - 1];
}