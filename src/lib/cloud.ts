import { openUrl } from "@tauri-apps/plugin-opener";
import { ipc } from "@/lib/ipc";

export async function openCloudPlans(): Promise<void> {
  await openUrl(await ipc.cloudPlansUrl());
}

export async function openCloudBillingPortal(): Promise<void> {
  await openUrl(await ipc.cloudBillingPortalUrl());
}
