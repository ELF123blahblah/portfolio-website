import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  date,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const PROJECT_STATUSES = ["active", "complete", "shelved"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    bannerUrl: text("banner_url"),
    // Stays a plain `text` column per spec §4 — validated with a DB-level
    // CHECK rather than a native Postgres enum type, plus the TS union
    // above for compile-time/Server Action validation.
    status: text("status", { enum: PROJECT_STATUSES }).notNull(),
    startedAt: date("started_at"),
    tech: text("tech").array(),
    repoUrl: text("repo_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "projects_status_check",
      sql`${table.status} IN ('active', 'complete', 'shelved')`
    ),
  ]
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    bodyMd: text("body_md").notNull(),
    entryDate: date("entry_date").notNull(),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("journal_entries_published_entry_date_idx").on(
      table.published,
      table.entryDate.desc()
    ),
    index("journal_entries_project_id_idx").on(table.projectId),
  ]
);

export const entryImages = pgTable("entry_images", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type EntryImage = typeof entryImages.$inferSelect;
export type NewEntryImage = typeof entryImages.$inferInsert;
