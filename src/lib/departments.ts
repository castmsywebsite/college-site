import { departmentsTable } from "@/db/schema/academics";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ilike } from "drizzle-orm";

export type CanonicalDepartment = "Computer" | "English" | "Commerce" | "Others";

export const CANONICAL_DEPARTMENTS: CanonicalDepartment[] = [
  "Computer",
  "English",
  "Commerce",
  "Others",
];

export const HOD_DEPARTMENTS: CanonicalDepartment[] = [
  "Computer",
  "English",
  "Commerce",
];

export const FACULTY_DEPARTMENTS: CanonicalDepartment[] = [
  "Computer",
  "English",
  "Commerce",
  "Others",
];

export const DEPARTMENT_DISPLAY_NAMES: Record<CanonicalDepartment, string> = {
  Computer: "Department of Computer Science",
  English: "Department of English",
  Commerce: "Department of Commerce",
  Others: "Others",
};

/**
 * Normalizes any department string or database department name into a canonical department.
 */
export function getCanonicalDepartment(
  rawName: string | null | undefined
): CanonicalDepartment | null {
  if (!rawName) return null;
  const normalized = rawName.trim().toLowerCase();
  if (normalized.includes("computer")) return "Computer";
  if (normalized.includes("english")) return "English";
  if (normalized.includes("commerce")) return "Commerce";
  if (normalized.includes("other")) return "Others";
  return null;
}

/**
 * Validates staff category and department combination according to requirements.
 */
export function validateStaffCategoryAndDepartment(
  category: string,
  department?: string | null
): { valid: boolean; error?: string; canonicalDept: CanonicalDepartment | null } {
  const normCategory = (category || "").toLowerCase();

  if (normCategory === "principal" || normCategory === "non-teaching") {
    // Department must not be set or required for Principal or Non-Teaching
    return { valid: true, canonicalDept: null };
  }

  if (normCategory === "hod") {
    if (!department || !department.trim()) {
      return {
        valid: false,
        error: "Department is required for HOD (options: Computer, English, Commerce)",
        canonicalDept: null,
      };
    }
    const canonical = getCanonicalDepartment(department);
    if (!canonical || canonical === "Others") {
      return {
        valid: false,
        error: "HOD department must be one of: Computer, English, Commerce. HOD cannot be assigned to Others.",
        canonicalDept: null,
      };
    }
    return { valid: true, canonicalDept: canonical };
  }

  if (normCategory === "faculty") {
    if (!department || !department.trim()) {
      return {
        valid: false,
        error: "Department is required for Faculty (options: Computer, English, Commerce, Others)",
        canonicalDept: null,
      };
    }
    const canonical = getCanonicalDepartment(department);
    if (!canonical) {
      return {
        valid: false,
        error: "Faculty department must be one of: Computer, English, Commerce, Others",
        canonicalDept: null,
      };
    }
    return { valid: true, canonicalDept: canonical };
  }

  return {
    valid: false,
    error: `Invalid staff category: ${category}`,
    canonicalDept: null,
  };
}

/**
 * Resolves the database department ID from departmentsTable for a canonical department.
 * Returns null for "Others" or when not applicable.
 */
export async function resolveDepartmentId(
  dbOrClient: any,
  canonicalDept: CanonicalDepartment | null
): Promise<string | null> {
  if (!canonicalDept || canonicalDept === "Others") {
    return null;
  }

  const keyword = canonicalDept.toLowerCase();

  // If Drizzle DB instance
  if (dbOrClient && typeof dbOrClient.select === "function") {
    try {
      const rows = await dbOrClient
        .select({ id: departmentsTable.id, name: departmentsTable.name })
        .from(departmentsTable)
        .where(ilike(departmentsTable.name, `%${keyword}%`));

      if (rows.length > 0) {
        return rows[0].id;
      }
      return null;
    } catch {}
  }

  // Fallback to Supabase REST
  try {
    const { supabaseAdmin, supabase } = await import("./supabase");
    const client = dbOrClient || supabaseAdmin || supabase;
    const { data } = await client
      .from("departments")
      .select("id, name")
      .ilike("name", `%${keyword}%`)
      .limit(1);

    if (data && data.length > 0) {
      return data[0].id;
    }
  } catch {}

  return null;
}

