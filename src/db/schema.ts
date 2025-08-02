import { integer, pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const decksTable = pgTable("decks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  userId: varchar({ length: 255 }).notNull(), // Clerk user ID
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const cardsTable = pgTable("cards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  front: text().notNull(),
  back: text().notNull(),
  deckId: integer().notNull().references(() => decksTable.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Study sessions table to track study sessions
export const studySessionsTable = pgTable("study_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deckId: integer().notNull().references(() => decksTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(),
  mode: varchar({ length: 50 }).notNull(), // 'standard', 'shuffle', 'timed'
  totalCards: integer().notNull(),
  cardsStudied: integer().notNull().default(0),
  correctAnswers: integer().notNull().default(0),
  completed: boolean().notNull().default(false),
  startedAt: timestamp().defaultNow().notNull(),
  completedAt: timestamp(),
});

// Card progress table to track individual card performance
export const cardProgressTable = pgTable("card_progress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cardId: integer().notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 }).notNull(),
  deckId: integer().notNull().references(() => decksTable.id, { onDelete: "cascade" }),
  totalReviews: integer().notNull().default(0),
  correctReviews: integer().notNull().default(0),
  lastReviewed: timestamp(),
  masteryLevel: integer().notNull().default(0), // 0-100 percentage
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});