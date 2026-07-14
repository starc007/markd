"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { GitHubIcon } from "./ui/github-icon";
import { GITHUB, GITHUB_REPO } from "@/lib/config";

const CACHE_KEY = "markd:github-stars";
const CACHE_TTL = 60 * 60 * 1000;

type CachedStars = {
  count: number;
  savedAt: number;
};

function readCachedStars(): number | null {
  try {
    const cached = JSON.parse(
      window.sessionStorage.getItem(CACHE_KEY) ?? "null",
    ) as CachedStars | null;

    if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
      return cached.count;
    }
  } catch {
    window.sessionStorage.removeItem(CACHE_KEY);
  }

  return null;
}

function formatStars(count: number) {
  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const cached = readCachedStars();
    if (cached !== null) {
      setStars(cached);
      return;
    }

    const controller = new AbortController();

    fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load GitHub stars");
        return response.json() as Promise<{ stargazers_count: number }>;
      })
      .then(({ stargazers_count }) => {
        setStars(stargazers_count);
        window.sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ count: stargazers_count, savedAt: Date.now() }),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStars(null);
      });

    return () => controller.abort();
  }, []);

  return (
    <a
      href={GITHUB}
      target="_blank"
      rel="noreferrer"
      aria-label={
        stars === null ? "Markd on GitHub" : `Markd on GitHub, ${stars} stars`
      }
      className="group inline-flex h-9 items-center gap-2.5 rounded-full border border-border-strong bg-paper px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(25,25,23,0.04)] transition-colors hover:bg-hover"
    >
      <GitHubIcon className="size-4" />
      <span>GitHub</span>
      <span className="flex min-w-7 items-center gap-1 text-muted-foreground">
        <Star
          className="size-3.5 transition-transform duration-150 ease-out group-hover:-rotate-12 group-hover:scale-110"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        {stars === null ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-3.5 rounded-full bg-border-strong"
          />
        ) : (
          <motion.span
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="text-[12px] tabular-nums"
          >
            {formatStars(stars)}
          </motion.span>
        )}
      </span>
    </a>
  );
}
