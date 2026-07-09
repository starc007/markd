// Monochrome silver gradient presets for the Grainient backdrops — keeps every
// animated stage strictly ink/paper, no color.
export type GrainientPreset = {
  color1: string;
  color2: string;
  color3: string;
  grainAmount: number;
  contrast: number;
  zoom: number;
};

export const MONO: GrainientPreset = {
  color1: "#f2f1ee",
  color2: "#c4c3bf",
  color3: "#7c7b77",
  grainAmount: 0.08,
  contrast: 1.12,
  zoom: 0.9,
};

export const MONO_SOFT: GrainientPreset = {
  color1: "#f6f5f2",
  color2: "#d3d2ce",
  color3: "#9a9994",
  grainAmount: 0.08,
  contrast: 1.08,
  zoom: 0.9,
};
