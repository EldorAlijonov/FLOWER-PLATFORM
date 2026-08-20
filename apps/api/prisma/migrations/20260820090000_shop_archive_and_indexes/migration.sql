ALTER TYPE "ShopStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE INDEX IF NOT EXISTS "shops_status_idx" ON "shops"("status");
CREATE INDEX IF NOT EXISTS "shops_plan_idx" ON "shops"("plan");
CREATE INDEX IF NOT EXISTS "shops_created_at_idx" ON "shops"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
