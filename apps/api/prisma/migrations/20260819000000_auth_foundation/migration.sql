DO $$ BEGIN
  CREATE TYPE "ShopStatus" AS ENUM ('ACTIVE', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformUserRole" AS ENUM ('PLATFORM_SUPER_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformUserStatus" AS ENUM ('ACTIVE', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AuthSessionScope" AS ENUM ('PLATFORM', 'SHOP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "shops" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ShopStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "platform_users" (
  "id" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "PlatformUserRole" NOT NULL DEFAULT 'PLATFORM_SUPER_ADMIN',
  "status" "PlatformUserStatus" NOT NULL DEFAULT 'ACTIVE',
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STAFF',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" TEXT NOT NULL,
  "scope" "AuthSessionScope" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "platform_user_id" TEXT,
  "user_id" TEXT,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT,
  "user_id" TEXT,
  "platform_user_id" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_login_key" ON "platform_users"("login");
CREATE UNIQUE INDEX IF NOT EXISTS "users_login_key" ON "users"("login");
CREATE UNIQUE INDEX IF NOT EXISTS "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "users_shop_id_idx" ON "users"("shop_id");
CREATE INDEX IF NOT EXISTS "auth_sessions_scope_status_idx" ON "auth_sessions"("scope", "status");
CREATE INDEX IF NOT EXISTS "auth_sessions_platform_user_id_idx" ON "auth_sessions"("platform_user_id");
CREATE INDEX IF NOT EXISTS "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_shop_id_idx" ON "audit_logs"("shop_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_platform_user_id_idx" ON "audit_logs"("platform_user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
