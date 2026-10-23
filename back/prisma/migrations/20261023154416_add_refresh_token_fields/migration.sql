/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token_hash]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "users_refresh_token_hash_key" ON "users"("refresh_token_hash");
