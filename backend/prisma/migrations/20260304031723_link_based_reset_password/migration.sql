/*
  Warnings:

  - You are about to drop the column `reset_password_otp` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar_url" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "institution" TEXT,
    "job_title" TEXT,
    "duty_station" TEXT,
    "languages" TEXT NOT NULL DEFAULT '[]',
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "institutional_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "subscription_plan_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "subscription_renewal_date" DATETIME,
    "has_first_year_guarantee" BOOLEAN NOT NULL DEFAULT false,
    "guest_points" INTEGER NOT NULL DEFAULT 500,
    "points_escrow" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "referred_users_verified_count" INTEGER NOT NULL DEFAULT 0,
    "referral_earnings" REAL NOT NULL DEFAULT 0,
    "notification_preferences" TEXT NOT NULL DEFAULT '{}',
    "swap_preferences" TEXT NOT NULL DEFAULT '{}',
    "reset_password_token" TEXT,
    "reset_password_expires" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar_url", "bio", "created_at", "duty_station", "email", "full_name", "guest_points", "has_first_year_guarantee", "id", "institution", "institutional_email_verified", "job_title", "languages", "notification_preferences", "password_hash", "phone", "points_escrow", "referral_code", "referral_earnings", "referred_by", "referred_users_verified_count", "reset_password_expires", "role", "subscription_plan_id", "subscription_renewal_date", "subscription_status", "swap_preferences", "updated_at", "verification_status") SELECT "avatar_url", "bio", "created_at", "duty_station", "email", "full_name", "guest_points", "has_first_year_guarantee", "id", "institution", "institutional_email_verified", "job_title", "languages", "notification_preferences", "password_hash", "phone", "points_escrow", "referral_code", "referral_earnings", "referred_by", "referred_users_verified_count", "reset_password_expires", "role", "subscription_plan_id", "subscription_renewal_date", "subscription_status", "swap_preferences", "updated_at", "verification_status" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referral_code_key" ON "User"("referral_code");
CREATE UNIQUE INDEX "User_reset_password_token_key" ON "User"("reset_password_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
