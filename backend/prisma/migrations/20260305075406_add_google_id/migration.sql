/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "google_id" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_email" TEXT NOT NULL,
    "verification_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "document_url" TEXT,
    "document_type" TEXT,
    "organization" TEXT,
    "staff_grade" TEXT,
    "duty_station" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "reviewer_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Verification" ("created_at", "document_type", "document_url", "id", "notes", "reviewed_at", "reviewed_by", "status", "updated_at", "user_email", "verification_type") SELECT "created_at", "document_type", "document_url", "id", "notes", "reviewed_at", "reviewed_by", "status", "updated_at", "user_email", "verification_type" FROM "Verification";
DROP TABLE "Verification";
ALTER TABLE "new_Verification" RENAME TO "Verification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");
