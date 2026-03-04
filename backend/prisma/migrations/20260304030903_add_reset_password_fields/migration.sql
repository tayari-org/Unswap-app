-- AlterTable
ALTER TABLE "User" ADD COLUMN "reset_password_expires" DATETIME;
ALTER TABLE "User" ADD COLUMN "reset_password_otp" TEXT;
