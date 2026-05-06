-- Yukleme adresi (EXW Incoterm'inde alici malini bu adresten teslim alir;
-- diger Incoterm'lerde de operasyonel referans olarak kullanilabilir).
ALTER TABLE "shipments"
  ADD COLUMN "pickup_address" TEXT;
