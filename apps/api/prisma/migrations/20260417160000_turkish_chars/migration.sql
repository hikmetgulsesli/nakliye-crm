-- Mevcut veriyi ASCII-safe Turkce'den tam Turkce karakterli hale migrate et.
-- Idempotent: zaten dogru haldeki kayitlari etkilemez.

-- === lookup_values ===
UPDATE lookup_values SET value = 'Soğuk' WHERE category = 'customer_status' AND value = 'Soguk';
UPDATE lookup_values SET value = 'Soğuk arama' WHERE category = 'customer_source' AND value = 'Soguk arama';
UPDATE lookup_values SET value = 'Düşük' WHERE category = 'potential_level' AND value = 'Dusuk';
UPDATE lookup_values SET value = 'Yüksek' WHERE category = 'potential_level' AND value = 'Yuksek';
UPDATE lookup_values SET value = 'Kazanıldı' WHERE category = 'quote_status' AND value = 'Kazanildi';
UPDATE lookup_values SET value = 'İptal' WHERE category = 'quote_status' AND value = 'Iptal';
UPDATE lookup_values SET value = 'Gecikmeli dönüş' WHERE category = 'loss_reason' AND value = 'Gecikmeli donus';
UPDATE lookup_values SET value = 'Diğer' WHERE category = 'loss_reason' AND value = 'Diger';
UPDATE lookup_values SET value = 'Yüz Yüze' WHERE category = 'activity_type' AND value = 'Yuz Yuze';
UPDATE lookup_values SET value = 'Video Görüşme' WHERE category = 'activity_type' AND value = 'Video Gorusme';
UPDATE lookup_values SET value = 'Nötr' WHERE category = 'activity_outcome' AND value = 'Notr';
UPDATE lookup_values SET value = 'Teklif İstendi' WHERE category = 'activity_outcome' AND value = 'Teklif Istendi';
UPDATE lookup_values SET value = 'Türkiye' WHERE category = 'country' AND value = 'Turkiye';
UPDATE lookup_values SET value = 'Çin' WHERE category = 'country' AND value = 'Cin';
UPDATE lookup_values SET value = 'İtalya' WHERE category = 'country' AND value = 'Italya';
UPDATE lookup_values SET value = 'İngiltere' WHERE category = 'country' AND value = 'Ingiltere';
UPDATE lookup_values SET value = 'İspanya' WHERE category = 'country' AND value = 'Ispanya';

-- === users (seed'den gelen kullanici isimleri) ===
UPDATE users SET full_name = 'Sistem Yöneticisi' WHERE full_name = 'Sistem Yoneticisi';
UPDATE users SET full_name = 'Ahmet Yılmaz' WHERE full_name = 'Ahmet Yilmaz';
UPDATE users SET full_name = 'Ayşe Demir' WHERE full_name = 'Ayse Demir';

-- === customers (status, potential, source kolonlari) ===
UPDATE customers SET status = 'Soğuk' WHERE status = 'Soguk';
UPDATE customers SET potential = 'Düşük' WHERE potential = 'Dusuk';
UPDATE customers SET potential = 'Yüksek' WHERE potential = 'Yuksek';
UPDATE customers SET source = 'Soğuk arama' WHERE source = 'Soguk arama';

-- === customers JSON array kolonlari (origin_countries, destination_countries) ===
-- JSONB icinde stringli country isimleri icin REPLACE zinciri
UPDATE customers SET origin_countries = REPLACE(origin_countries::text, '"Turkiye"', '"Türkiye"')::jsonb WHERE origin_countries::text LIKE '%"Turkiye"%';
UPDATE customers SET origin_countries = REPLACE(origin_countries::text, '"Cin"', '"Çin"')::jsonb WHERE origin_countries::text LIKE '%"Cin"%';
UPDATE customers SET origin_countries = REPLACE(origin_countries::text, '"Italya"', '"İtalya"')::jsonb WHERE origin_countries::text LIKE '%"Italya"%';
UPDATE customers SET origin_countries = REPLACE(origin_countries::text, '"Ingiltere"', '"İngiltere"')::jsonb WHERE origin_countries::text LIKE '%"Ingiltere"%';
UPDATE customers SET origin_countries = REPLACE(origin_countries::text, '"Ispanya"', '"İspanya"')::jsonb WHERE origin_countries::text LIKE '%"Ispanya"%';

UPDATE customers SET destination_countries = REPLACE(destination_countries::text, '"Turkiye"', '"Türkiye"')::jsonb WHERE destination_countries::text LIKE '%"Turkiye"%';
UPDATE customers SET destination_countries = REPLACE(destination_countries::text, '"Cin"', '"Çin"')::jsonb WHERE destination_countries::text LIKE '%"Cin"%';
UPDATE customers SET destination_countries = REPLACE(destination_countries::text, '"Italya"', '"İtalya"')::jsonb WHERE destination_countries::text LIKE '%"Italya"%';
UPDATE customers SET destination_countries = REPLACE(destination_countries::text, '"Ingiltere"', '"İngiltere"')::jsonb WHERE destination_countries::text LIKE '%"Ingiltere"%';
UPDATE customers SET destination_countries = REPLACE(destination_countries::text, '"Ispanya"', '"İspanya"')::jsonb WHERE destination_countries::text LIKE '%"Ispanya"%';

-- === quotations (status, loss_reason, origin_country, destination_country) ===
UPDATE quotations SET status = 'Kazanıldı' WHERE status = 'Kazanildi';
UPDATE quotations SET status = 'İptal' WHERE status = 'Iptal';
UPDATE quotations SET loss_reason = 'Gecikmeli dönüş' WHERE loss_reason = 'Gecikmeli donus';
UPDATE quotations SET loss_reason = 'Diğer' WHERE loss_reason = 'Diger';

UPDATE quotations SET origin_country = 'Türkiye' WHERE origin_country = 'Turkiye';
UPDATE quotations SET origin_country = 'Çin' WHERE origin_country = 'Cin';
UPDATE quotations SET origin_country = 'İtalya' WHERE origin_country = 'Italya';
UPDATE quotations SET origin_country = 'İngiltere' WHERE origin_country = 'Ingiltere';
UPDATE quotations SET origin_country = 'İspanya' WHERE origin_country = 'Ispanya';

UPDATE quotations SET destination_country = 'Türkiye' WHERE destination_country = 'Turkiye';
UPDATE quotations SET destination_country = 'Çin' WHERE destination_country = 'Cin';
UPDATE quotations SET destination_country = 'İtalya' WHERE destination_country = 'Italya';
UPDATE quotations SET destination_country = 'İngiltere' WHERE destination_country = 'Ingiltere';
UPDATE quotations SET destination_country = 'İspanya' WHERE destination_country = 'Ispanya';

-- === activities (activity_type, outcome) ===
UPDATE activities SET activity_type = 'Yüz Yüze' WHERE activity_type = 'Yuz Yuze';
UPDATE activities SET activity_type = 'Video Görüşme' WHERE activity_type = 'Video Gorusme';
UPDATE activities SET outcome = 'Nötr' WHERE outcome = 'Notr';
UPDATE activities SET outcome = 'Teklif İstendi' WHERE outcome = 'Teklif Istendi';
