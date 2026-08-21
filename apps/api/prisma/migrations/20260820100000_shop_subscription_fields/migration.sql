CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

ALTER TABLE "shops"
ADD COLUMN "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "subscription_start_at" TIMESTAMP(3),
ADD COLUMN "subscription_end_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "shops_subscription_status_idx" ON "shops"("subscription_status");
