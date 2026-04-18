-- CreateTable
CREATE TABLE "churn_risk" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churn_risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "churn_risk_customer_id_key" ON "churn_risk"("customer_id");

-- CreateIndex
CREATE INDEX "churn_risk_score_idx" ON "churn_risk"("score");

-- CreateIndex
CREATE INDEX "churn_risk_level_idx" ON "churn_risk"("level");
