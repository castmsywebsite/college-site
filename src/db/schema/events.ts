import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const homepageEventsTable = pgTable("homepage_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date"),
  imageUrl: text("image_url"),
  eventType: text("event_type"),
  participants: text("participants"),
  isPublished: boolean("is_published").default(true).notNull(),
  displayOrder: integer("display_order").default(99).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});
