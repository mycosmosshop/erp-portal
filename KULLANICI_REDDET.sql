-- ERP kullanıcı onayları: bekleyen bir başvuruyu "Kaldır" diyebilmek için
-- tek kolon. Kaldırılan kişi bir daha "onay bekleniyor" ekranında asılı
-- kalmaz; giriş yaptığında başvurusunun onaylanmadığını görür.
-- Geri alınabilir (panelde "Geri al").
alter table erp_users add column if not exists reddedildi boolean default false;
