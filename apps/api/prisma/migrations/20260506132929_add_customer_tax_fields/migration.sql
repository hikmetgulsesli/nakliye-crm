-- Add tax_number and tax_office to customers table
ALTER TABLE "customers"
  ADD COLUMN "tax_number" TEXT,
  ADD COLUMN "tax_office" TEXT;

-- Vergi numarasi cogu durumda firmayi tek anahtar olarak tanimlar.
-- Mukerrer kayit kontrolunde kullanmak icin index ekliyoruz (UNIQUE degil cunku
-- bireysel musterilerde TC kimlik no veya bos olabilir; benzersizligi conflict
-- service'in fuzzy matching katmaninda zorluyoruz).
CREATE INDEX "customers_tax_number_idx" ON "customers"("tax_number");
