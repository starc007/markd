import { create } from "zustand";
import type { PatternType } from "../generators/core";
import {
  generateGradient,
  hashToSeeds,
  selectPatternType,
} from "../generators/core";
import * as commands from "@/lib/tauri/commands";

export interface FingerprintData {
  gradientColors: string[];
  patternType: PatternType;
  patternData: Record<string, unknown>;
}

interface VisualIdentityState {
  fingerprints: Map<string, FingerprintData>;
  loading: Set<string>;
  regenerationTriggers: Map<string, number>; // Track regeneration count per note
  getFingerprint: (
    noteId: string,
    title: string,
    content: string,
    _size?: number // Size is optional, kept for backward compatibility
  ) => Promise<FingerprintData>;
  preloadFingerprints: (
    notes: Array<{
      id: string;
      title: string;
      content?: string;
      preview?: string;
    }>
  ) => Promise<void>;
  invalidateFingerprint: (noteId: string) => void;
  regenerateFingerprint: (
    noteId: string,
    title: string,
    content: string,
    _size?: number // Size is optional, kept for backward compatibility
  ) => Promise<FingerprintData>;
  getRegenerationTrigger: (noteId: string) => number;
}

export const useVisualIdentityStore = create<VisualIdentityState>(
  (set, get) => ({
    fingerprints: new Map(),
    loading: new Set(),
    regenerationTriggers: new Map(),

    getFingerprint: async (
      noteId: string,
      title: string,
      content: string,
      _size?: number
    ): Promise<FingerprintData> => {
      const state = get();

      // Check cache first
      const cached = state.fingerprints.get(noteId);
      if (cached) {
        return cached;
      }

      // Check if already loading
      if (state.loading.has(noteId)) {
        // Wait for it to finish
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            const fingerprint = state.fingerprints.get(noteId);
            if (fingerprint) {
              clearInterval(checkInterval);
              resolve(fingerprint);
            }
          }, 50);
        });
      }

      // Mark as loading
      set((state) => ({
        loading: new Set(state.loading).add(noteId),
      }));

      try {
        // Normalize content - use empty string if content is empty/null
        const normalizedContent = content || "";
        const normalizedTitle = title || "Untitled";

        // Try to get from backend first
        let fingerprint: FingerprintData | null = null;
        try {
          const stored = await commands.getNoteVisualIdentity(noteId);
          if (stored) {
            fingerprint = {
              gradientColors: stored.gradient_colors,
              patternType: stored.pattern_type as PatternType,
              patternData: stored.pattern_data
                ? JSON.parse(stored.pattern_data)
                : {},
            };
          }
        } catch (error) {
          console.warn("Failed to get stored visual identity:", error);
        }

        // If not in database, generate new one
        if (!fingerprint) {
          // For empty content, use noteId + title for deterministic generation
          // Include noteId to ensure uniqueness even for empty notes with same title
          const contentForHash =
            normalizedContent || `${noteId}__${normalizedTitle}`;

          // Generate hash and seeds
          const hashString = `${normalizedTitle}__${contentForHash}`;

          const seeds = await hashToSeeds(hashString);
          const patternType = selectPatternType(seeds[0]);
          const gradient = generateGradient(seeds);

          fingerprint = {
            gradientColors: gradient.colors,
            patternType,
            patternData: {
              seed: seeds[0],
              hash: hashString,
            },
          };

          // Save to backend (fire and forget)
          commands
            .saveNoteVisualIdentity(
              noteId,
              fingerprint.gradientColors,
              fingerprint.patternType,
              JSON.stringify(fingerprint.patternData),
              null // No image_data for CSS patterns
            )
            .catch((error) => {
              console.warn("Failed to save visual identity:", error);
            });
        }

        // Cache it
        set((state) => {
          const newFingerprints = new Map(state.fingerprints);
          newFingerprints.set(noteId, fingerprint!);
          const newLoading = new Set(state.loading);
          newLoading.delete(noteId);
          return {
            fingerprints: newFingerprints,
            loading: newLoading,
          };
        });

        return fingerprint;
      } catch (error) {
        console.error("Failed to generate fingerprint:", error);
        set((state) => {
          const newLoading = new Set(state.loading);
          newLoading.delete(noteId);
          return { loading: newLoading };
        });

        // Return fallback
        return {
          gradientColors: ["#6366f1", "#8b5cf6"],
          patternType: "mesh",
          patternData: {},
        };
      }
    },

    preloadFingerprints: async (
      notes: Array<{
        id: string;
        title: string;
        content?: string;
        preview?: string;
      }>
    ): Promise<void> => {
      const state = get();
      // Use preview for faster generation (it's already available in metadata)
      const promises = notes.map((note) => {
        if (state.fingerprints.has(note.id)) {
          return Promise.resolve();
        }
        // Use preview if available, otherwise empty string (will still generate)
        const contentForFingerprint = note.preview || note.content || "";
        return state.getFingerprint(
          note.id,
          note.title || "Untitled",
          contentForFingerprint,
          64 // Standard size for preloading
        );
      });

      await Promise.all(promises);
    },

    regenerateFingerprint: async (
      noteId: string,
      title: string,
      content: string,
      _size?: number
    ): Promise<FingerprintData> => {
      // Invalidate cache first
      get().invalidateFingerprint(noteId);

      // Delete from backend to force regeneration
      try {
        await commands.regenerateNoteVisualIdentity(noteId);
      } catch (error) {
        console.warn(
          "[regenerateFingerprint] Failed to delete old visual identity:",
          error
        );
      }

      // Add timestamp and random component to ensure new pattern generation
      // This makes each regeneration produce a different pattern
      const timestamp = Date.now();
      const randomComponent = Math.random().toString(36).substring(7);
      const randomComponent2 = Math.random().toString(36).substring(7);
      const normalizedContent = content || "";
      const normalizedTitle = title || "Untitled";
      // Add multiple random components and timestamp to ensure uniqueness
      const contentWithVariation = `${normalizedContent}__REGEN__${timestamp}__${randomComponent}__${randomComponent2}__${Math.random()}`;

      // Generate new fingerprint with variation to ensure uniqueness
      const hashString = `${normalizedTitle}__${contentWithVariation}`;

      const seeds = await hashToSeeds(hashString);
      const patternType = selectPatternType(seeds[0]);
      const gradient = generateGradient(seeds);

      const fingerprint: FingerprintData = {
        gradientColors: gradient.colors,
        patternType,
        patternData: {
          seed: seeds[0],
          hash: hashString,
          regeneratedAt: timestamp,
        },
      };

      console.log("[regenerateFingerprint] Generated fingerprint:", {
        patternType,
        colors: gradient.colors,
        hash: hashString.substring(0, 30) + "...",
      });

      // Update both fingerprint cache and trigger in a single state update
      // This ensures they're synchronized and component sees both changes
      set((state) => {
        const newFingerprints = new Map(state.fingerprints);
        newFingerprints.set(noteId, fingerprint);

        const newTriggers = new Map(state.regenerationTriggers);
        const currentTrigger = newTriggers.get(noteId) || 0;
        const newTrigger = currentTrigger + 1;
        newTriggers.set(noteId, newTrigger);

        return {
          fingerprints: newFingerprints,
          regenerationTriggers: newTriggers,
        };
      });

      // Force a small delay to ensure state is updated before returning
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Save to backend (fire and forget)
      commands
        .saveNoteVisualIdentity(
          noteId,
          fingerprint.gradientColors,
          fingerprint.patternType,
          JSON.stringify(fingerprint.patternData),
          null
        )
        .then(() => {
          console.log("[regenerateFingerprint] Saved to backend successfully");
        })
        .catch((error) => {
          console.warn(
            "[regenerateFingerprint] Failed to save regenerated visual identity:",
            error
          );
        });

      console.log("[regenerateFingerprint] Regeneration complete");
      return fingerprint;
    },

    getRegenerationTrigger: (noteId: string) => {
      return get().regenerationTriggers.get(noteId) || 0;
    },

    invalidateFingerprint: (noteId: string) => {
      set((state) => {
        const newFingerprints = new Map(state.fingerprints);
        newFingerprints.delete(noteId);
        return { fingerprints: newFingerprints };
      });
    },
  })
);
