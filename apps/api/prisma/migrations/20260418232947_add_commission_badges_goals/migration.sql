-- CreateTable
CREATE TABLE "commission_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" INTEGER,
    "percent" DOUBLE PRECISION NOT NULL,
    "min_amount" DOUBLE PRECISION,
    "max_amount" DOUBLE PRECISION,
    "currency" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "criteria" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "metric" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_rules_user_id_is_active_idx" ON "commission_rules"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "sales_goals_user_id_period_end_idx" ON "sales_goals"("user_id", "period_end");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
