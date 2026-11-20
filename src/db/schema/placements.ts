import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const placementsTable = pgTable("placements", {
  id: text("id").primaryKey(),
  studentName: text("student_name").notNull(),
  companyName: text("company_name").notNull(),
  position: text("position"),
  graduatedYear: text("graduated_year").notNull(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(99).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});
