// visualize.js
module.exports = `Using the brand context below, design a concrete visual direction - actual choices a designer could use immediately, not vague description.

Context: {{context}}

Choose the heading and body font ONLY from this trusted pairing reference (use the names exactly as written):
- Modern/clean: heading "Sora" or "Space Grotesk", body "Inter" or "Work Sans"
- Elegant/premium: heading "Fraunces" or "Playfair Display", body "Lora" or "Source Serif Pro"
- Playful/friendly: heading "Baloo 2" or "Fredoka", body "Nunito" or "Quicksand"
- Technical/precise: heading "IBM Plex Mono" or "JetBrains Mono", body "IBM Plex Sans" or "Inter"
- Bold/confident: heading "Archivo Black" or "Bebas Neue", body "Archivo" or "Manrope"

Return a JSON object with exactly these keys:
{
  "typography": {
    "headingFont": string - exact font name copied from the reference above,
    "bodyFont": string - exact font name copied from the reference above,
    "pairingRationale": string - one sentence tying this pairing to the brand personality
  },
  "colorPalette": [
    { "name": string, "hex": string - a valid 6-digit hex code like "#1E3A8A", "role": "primary" | "secondary" | "accent" | "neutral-light" | "neutral-dark" }
  ],
  "imageryStyle": string,
  "conceptsToAvoid": string[],
  "mark": {
    "shape": "circle" | "hexagon" | "triangle" | "wave" | "square",
    "style": "geometric" | "organic" | "monogram",
    "monogramLetter": string - a single uppercase letter to use only if style is "monogram", otherwise an empty string,
    "rationale": string - one sentence on why this shape/style fits the brand
  }
}

Rules:
- "colorPalette" must have exactly 5 entries, one for each role listed above, each a real, distinct hex code that works together as one cohesive palette.
- Pick fonts and colors that fit the audience and personality already established in the context - do not default to generic startup blue/purple every time.
- Respond with ONLY the JSON object - no markdown fences, no preamble, no explanation.`;