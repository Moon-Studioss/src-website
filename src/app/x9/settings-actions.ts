"use server";

import { db, withRetry } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Ensures a settings row exists and returns it.
 */
export async function getSettings() {
  let [currentSettings] = await withRetry(() => db.select().from(settings).limit(1));
  if (!currentSettings) {
    [currentSettings] = await withRetry(() =>
      db.insert(settings).values({
        adminPassword: process.env.ADMIN_PASSWORD!,
        isUnderConstruction: false,
        isStoreUnderConstruction: false,
      }).returning()
    );
  }
  return currentSettings;
}

export async function saveAllSettings({ 
  newPassword, 
  isUnderConstruction, 
  isStoreUnderConstruction,
  autoDeleteTimer,
  overdueDeleteTimer,
  whatsappTemplate
}: { 
  newPassword?: string, 
  isUnderConstruction: boolean, 
  isStoreUnderConstruction?: boolean,
  autoDeleteTimer: number,
  overdueDeleteTimer: number,
  whatsappTemplate?: string
}) {
  const currentSettings = await getSettings();
  
  const updates: any = {
    isUnderConstruction,
    isStoreUnderConstruction: isStoreUnderConstruction ?? false,
    autoDeleteTimer,
    overdueDeleteTimer
  };
  
  if (whatsappTemplate) {
    updates.whatsappTemplate = whatsappTemplate;
  }
  
  if (newPassword) {
    updates.adminPassword = newPassword;
  }
  
  await db.update(settings)
    .set(updates)
    .where(eq(settings.id, currentSettings.id));
    
  // Revalidate routes to immediately reflect changes
  revalidatePath("/", "layout");
  revalidatePath("/store");
  revalidatePath("/x9");
}
