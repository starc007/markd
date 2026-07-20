export interface ReleaseUpdateInfo {
  currentVersion: string;
  version: string;
  body?: string;
  rawJson?: Record<string, unknown>;
}

function versionParts(version: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Feature releases show notes first; fix-only releases install immediately. */
export function shouldShowReleaseNotes(update: ReleaseUpdateInfo): boolean {
  const explicitType = update.rawJson?.release_type;
  if (typeof explicitType === "string") {
    const normalized = explicitType.toLocaleLowerCase();
    if (["feature", "minor", "major"].includes(normalized)) return true;
    if (["fix", "bugfix", "patch"].includes(normalized)) return false;
  }

  const current = versionParts(update.currentVersion);
  const next = versionParts(update.version);
  if (!current || !next) return Boolean(update.body?.trim());
  return next[0] > current[0] || next[1] > current[1];
}
