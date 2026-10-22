-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20),
ADD COLUMN "password_reset_token_hash" VARCHAR(64),
ADD COLUMN "password_reset_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- Require at least one sign-in identifier.
ALTER TABLE "users" ADD CONSTRAINT "users_email_or_phone_check" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL);
