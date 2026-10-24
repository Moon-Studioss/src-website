import { sql } from "drizzle-orm";
import { db } from "./src/lib/db";

async function main() {
  console.log("Applying schema migrations manually...");
  
  try {
    await db.execute(sql`ALTER TABLE settings ADD COLUMN overdue_delete_timer integer NOT NULL DEFAULT 15`);
    console.log("Added overdue_delete_timer column to settings");
  } catch (e: any) {
    console.log("Error adding overdue_delete_timer (might already exist):", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE product_categories ADD CONSTRAINT product_categories_name_unique UNIQUE (name)`);
    console.log("Added unique constraint to product_categories");
  } catch (e: any) {
    console.log("Error adding unique constraint (might already exist):", e.message);
  }

  console.log("Done");
  process.exit(0);
}

main();
