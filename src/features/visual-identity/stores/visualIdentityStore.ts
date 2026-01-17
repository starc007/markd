import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { FingerprintData } from "../utils/canvas";
import { generateFingerprint } from "../utils/canvas";
import { hashToSeeds } from "../generators/core";

interface VisualIdentityState {
  fingerprints: Map<string, FingerprintData>;
  loading: Set<string>;
  getFingerprint: (
    noteId: string,
    title: string,
    content: string,
    size: number
  ) => Promise<FingerprintData>;
  preloadFingerprints: (
    notes: Array<{ id: string; title: string; content?: string }>
  ) => Promise<void>;
  invalidateFingerprint: (noteId: string) => void;
}

export const useVisualIdentityStore = create<VisualIdentityState>(
  (set, get) => ({
    fingerprints: new Map(),
    loading: new Set(),

    getFingerprint: async (
      noteId: string,
      title: string,
      content: string,
      size: number
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
        // Try to get from database first
        let fingerprint: FingerprintData | null = null;
        try {
          const stored = await invoke<{
            gradient_colors: string[];
            pattern_type: string;
            pattern_data: string | null;
            image_data: string | null;
          } | null>("get_note_visual_identity", { noteId });

          if (stored && stored.image_data) {
            fingerprint = {
              gradientColors: stored.gradient_colors,
              patternType:
                stored.pattern_type as FingerprintData["patternType"],
              patternData: stored.pattern_data
                ? JSON.parse(stored.pattern_data)
                : {},
              imageData: stored.image_data,
            };
          }
        } catch (error) {
          console.warn("Failed to get stored visual identity:", error);
        }

        // If not in database, generate new one
        if (!fingerprint) {
          // Get seed from backend
          const seedData = await invoke<{
            seeds: number[];
            hash: string;
          }>("generate_note_visual_identity_seed", {
            params: {
              note_id: noteId,
              title,
              content,
            },
          });

          // Generate fingerprint
          fingerprint = await generateFingerprint(
            noteId,
            title,
            content,
            size,
            seedData.hash
          );

          // Save to database (fire and forget)
          invoke("save_note_visual_identity", {
            noteId,
            gradientColors: fingerprint.gradientColors,
            patternType: fingerprint.patternType,
            patternData: JSON.stringify(fingerprint.patternData),
            imageData: fingerprint.imageData,
          }).catch((error) => {
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
      notes: Array<{ id: string; title: string; content?: string }>
    ): Promise<void> => {
      const state = get();
      const promises = notes.map((note) => {
        if (state.fingerprints.has(note.id)) {
          return Promise.resolve();
        }
        return state.getFingerprint(
          note.id,
          note.title,
          note.content || "",
          64 // Standard size for preloading
        );
      });

      await Promise.all(promises);
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
