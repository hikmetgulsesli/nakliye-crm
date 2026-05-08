-- CreateIndex
CREATE INDEX "activities_customer_id_activity_date_idx" ON "activities"("customer_id", "activity_date");

-- CreateIndex
CREATE INDEX "activities_next_action_date_idx" ON "activities"("next_action_date");

-- CreateIndex
CREATE INDEX "activities_created_by_activity_date_idx" ON "activities"("created_by", "activity_date");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_assigned_user_id_idx" ON "customers"("assigned_user_id");

-- CreateIndex
CREATE INDEX "customers_is_deleted_status_idx" ON "customers"("is_deleted", "status");

-- CreateIndex
CREATE INDEX "customers_is_deleted_assigned_user_id_last_contact_date_idx" ON "customers"("is_deleted", "assigned_user_id", "last_contact_date");

-- CreateIndex
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_status_is_deleted_idx" ON "quotations"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "quotations_assigned_user_id_idx" ON "quotations"("assigned_user_id");

-- CreateIndex
CREATE INDEX "quotations_quote_date_idx" ON "quotations"("quote_date");

-- CreateIndex
CREATE INDEX "quotations_is_deleted_created_at_idx" ON "quotations"("is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "shipments_quotation_id_idx" ON "shipments"("quotation_id");

-- CreateIndex
CREATE INDEX "shipments_is_deleted_created_at_idx" ON "shipments"("is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "shipments_etd_idx" ON "shipments"("etd");

-- CreateIndex
CREATE INDEX "shipments_eta_idx" ON "shipments"("eta");
