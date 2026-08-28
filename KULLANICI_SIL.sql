-- ─────────────────────────────────────────────────────────────────────
-- "Kaldırılanlar → 🗑 Sil" çalışsın: erp_users tablosunda DELETE izni.
--
-- Sorun: RLS açık ve DELETE politikası yoksa, silme isteği hata da
-- vermez — sıfır satır siler ve kayıt yerinde kalır. (Uygulama bunu
-- ölçüp "silme yetkiniz yok" diyor, sessiz başarı göstermiyor.)
--
-- Bu politika YALNIZ admin'e siler; kimse kendini silemez.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "erp_users_admin_delete" on erp_users;

create policy "erp_users_admin_delete" on erp_users
for delete
using (
  auth.uid() <> id                                  -- kendini silemez
  and exists (select 1 from erp_users a
              where a.id = auth.uid() and a.is_admin is true)
);

-- Kontrol: politikalar listelensin
select policyname, cmd
from pg_policies
where tablename = 'erp_users'
order by cmd, policyname;
