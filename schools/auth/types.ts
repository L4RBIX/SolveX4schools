/**
 * Who is using the product.
 *
 * Kept free of `server-only` so a client component can be typed against a
 * session summary without dragging the store into the browser bundle.
 */

export type SchoolRole = "student" | "teacher" | "admin";

export interface SchoolAccount {
  userId: string;
  schoolId: string;
  role: SchoolRole;
  username: string;
  displayName: string;
  mustChangePassword: boolean;
  disabledAt: string | null;
}

/** What a page may safely know about the person reading it. */
export interface SessionUser {
  userId: string;
  schoolId: string;
  role: SchoolRole;
  displayName: string;
  username: string;
  mustChangePassword: boolean;
}

export interface ClassRef {
  schoolId: string;
  classId: string;
  name: string;
}
