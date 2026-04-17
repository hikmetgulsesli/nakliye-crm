-- Ilk migrasyonda atlanan kullanici isimleri + olasi kacanlar
UPDATE users SET full_name = 'Admin Kullanıcı' WHERE full_name = 'Admin Kullanici';
UPDATE users SET full_name = REPLACE(full_name, 'Yilmaz', 'Yılmaz') WHERE full_name LIKE '%Yilmaz%';
UPDATE users SET full_name = REPLACE(full_name, 'Ayse', 'Ayşe') WHERE full_name LIKE 'Ayse%';
UPDATE users SET full_name = REPLACE(full_name, 'Ismail', 'İsmail') WHERE full_name LIKE '%Ismail%';
UPDATE users SET full_name = REPLACE(full_name, 'Sule', 'Şule') WHERE full_name LIKE 'Sule%';
UPDATE users SET full_name = REPLACE(full_name, 'Musa', 'Musa') WHERE full_name LIKE '%Musa%';

-- Olasi kacan audit_log aksiyon / text kayitlari icin: dokunma (log integrity)

-- Olasi kacan notification title/message icinde TR karakter eksikligi varsa:
UPDATE notifications SET title = REPLACE(title, 'musteri', 'müşteri') WHERE title LIKE '%musteri%';
UPDATE notifications SET title = REPLACE(title, 'Musteri', 'Müşteri') WHERE title LIKE '%Musteri%';
UPDATE notifications SET message = REPLACE(message, 'musteri', 'müşteri') WHERE message LIKE '%musteri%';
UPDATE notifications SET message = REPLACE(message, 'Musteri', 'Müşteri') WHERE message LIKE '%Musteri%';
UPDATE notifications SET message = REPLACE(message, 'gun once', 'gün önce') WHERE message LIKE '%gun once%';
UPDATE notifications SET message = REPLACE(message, 'gorusme', 'görüşme') WHERE message LIKE '%gorusme%';
