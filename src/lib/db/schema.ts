import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  jsonb,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";

// ─── Project Requests ────────────────────────────────────────────
export const requests = pgTable("requests", {
  id:           uuid("id").primaryKey().defaultRandom(),
  refCode:      text("ref_code").unique().notNull(),          // SRC-7K2M
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),

  // Student info
  studentName:  text("student_name").notNull(),
  college:      text("college").notNull(),
  phone:        text("phone").notNull(),
  whatsapp:     text("whatsapp"),
  email:        text("email").notNull(),

  // Project info
  category:     text("category").notNull(),                   // web|app|ml|iot|software|unsure
  title:        text("title").notNull(),
  description:  text("description").notNull(),
  deliverable:  text("deliverable").notNull(),                // prototype|complete|modify|demo|unsure
  techNotes:    text("tech_notes"),
  branchAnswers: jsonb("branch_answers"),                     // category-specific Q&A
  deadline:     date("deadline").notNull(),
  budgetBand:   text("budget_band").notNull(),

  // Extra
  extraNotes:   text("extra_notes"),
  source:       text("source"),                               // how they heard about us

  // Admin fields
  status:       text("status").default("new").notNull(),      // new|reviewing|accepted|rejected|in_progress|completed
  starred:      boolean("starred").default(false).notNull(),
  adminNotes:   text("admin_notes"),
  rejectedAt:   timestamp("rejected_at"),                     // set when rejected; used for 3-month auto-delete
});

// ─── Attachments ─────────────────────────────────────────────────
export const attachments = pgTable("attachments", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requestId:   uuid("request_id").references(() => requests.id, { onDelete: "cascade" }).notNull(),
  storageKey:  text("storage_key").notNull(),                 // Uploadthing file key
  fileName:    text("file_name").notNull(),
  fileUrl:     text("file_url").notNull(),                    // Uploadthing public URL
  sizeBytes:   serial("size_bytes"),
  mimeType:    text("mime_type"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Settings ──────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  adminPassword: text("admin_password").notNull(),
  isUnderConstruction: boolean("is_under_construction").default(false).notNull(),
  isStoreUnderConstruction: boolean("is_store_under_construction").default(false).notNull(),
  autoDeleteTimer: integer("auto_delete_timer").default(2880).notNull(), // default 2 days in minutes
  overdueDeleteTimer: integer("overdue_delete_timer").default(15).notNull(), // default 15 days
  whatsappTemplate: text("whatsapp_template").default("Hi {name}, this is regarding your project request {ref} ({title}). I can take this up. Let's discuss the details.").notNull(),
});

// ─── Product Categories ──────────────────────────────────────────
export const productCategories = pgTable("product_categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Products ────────────────────────────────────────────────────
export const products = pgTable("products", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  description: text("description"),
  price:       integer("price").notNull(),              // price in INR paise (e.g. 49900 = ₹499)
  category:    text("category"),                        // free-form text, linked to productCategories.name
  images:      jsonb("images").$type<string[]>().default([]),
  inStock:     boolean("in_stock").default(true).notNull(),
  featured:    boolean("featured").default(false).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────
export type Request         = typeof requests.$inferSelect;
export type NewRequest      = typeof requests.$inferInsert;
export type Attachment      = typeof attachments.$inferSelect;
export type Settings        = typeof settings.$inferSelect;
export type Product         = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
