/* ERP Guard — modülleri ERP onayına bağlar.
   Aynı origin (mycosmosshop.github.io) modüllerine eklenir.
   Onaylı ERP oturumu yoksa portala yönlendirir; varsa içeriği gösterir.
   Kullanım (modülün <head>'inde, bu sırayla):
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="https://mycosmosshop.github.io/erp-portal/erp-guard.js"></script>
*/
/* ── ORTAK KOYU TEMA (kontrollü yayılım) ───────────────────────────────────
   Yalnızca aşağıdaki listedeki modüllere uygulanır. Yeni modül hazır olunca
   adı listeye eklenir; böylece tüm modüller aynı anda değişmez ve her biri
   tek tek doğrulanabilir. Tema DEĞERİ portalden gelir (data-theme / ortak
   localStorage anahtarı / postMessage). Modülün işlevine dokunulmaz.
   NOT: supplier-system kendi koyu temasını içinde taşır, listede DEĞİLDİR. */
(function(){
  var KOYU_MODULLER = ['kpi-takip', 'pscr', 'teknik-resim'];
  var CSS_URL = 'https://mycosmosshop.github.io/erp-portal/erp-dark.css';
  try{
    var yol = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    if(KOYU_MODULLER.indexOf(yol) >= 0){
      var kok = document.documentElement;
      kok.setAttribute('data-erp-mod', yol);                 // modüle özgü kurallar için
      var l = document.createElement('link');
      // Saatlik surum damgasi: tema guncellenince tarayicinin eski dosyayi
      // onbellekten okuyup 'duzelmedi' gostermesini onler.
      l.rel = 'stylesheet'; l.href = CSS_URL + '?v=' + Math.floor(Date.now() / 3600000);
      (document.head || kok).appendChild(l);

      var uygula = function(t){
        if(!t) return;
        kok.setAttribute('data-theme', t);
        kok.setAttribute('data-bs-theme', t);
        try{
          if(window.Chart && Chart.defaults){                 // grafik yazıları okunur kalsın
            Chart.defaults.color = (t === 'dark') ? '#c9ced6' : '#666';
            if(Chart.defaults.scale && Chart.defaults.scale.grid)
              Chart.defaults.scale.grid.color = (t === 'dark') ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.1)';
          }
        }catch(e){}
      };
      var ilk = kok.getAttribute('data-theme');               // portal iframe'e yazmış olabilir
      if(!ilk){ try{ ilk = localStorage.getItem('erp_portal_theme'); }catch(e){} }
      uygula(ilk);
      window.addEventListener('message', function(e){
        if(e && e.data && e.data.tip === 'erp-tema') uygula(e.data.tema);
      });
      window.addEventListener('storage', function(e){
        if(e && e.key === 'erp_portal_theme') uygula(e.newValue);
      });
    }
  }catch(e){ /* tema hatası modülü engellemesin */ }
})();

(function(){
  var SUPA_URL = 'https://chchaielttnimuuezazb.supabase.co';
  var SUPA_KEY = 'sb_publishable_S2ywbq7TkgcZKiVif3td-A_oAuQL3QT';
  var PORTAL   = 'https://mycosmosshop.github.io/erp-portal/erp_portal.html';
  var de = document.documentElement;
  // İçeriği doğrulanana kadar gizle (içerik sızıntısı/flaş olmasın)
  try{ de.style.visibility = 'hidden'; }catch(e){}
  function deny(){ try{ location.replace(PORTAL); }catch(e){ location.href = PORTAL; } }
  function allow(){ try{ de.style.visibility = ''; }catch(e){} }
  function check(){
    // Modül kendi istisnasını tanımladıysa (ör. supplier paylaşım linkleri) girişsiz geç
    try{ if(typeof window.ERP_GUARD_ALLOW === 'function' && window.ERP_GUARD_ALLOW()){ return allow(); } }catch(e){}
    if(!(window.supabase && window.supabase.createClient)){ return deny(); }
    var sb;
    try{ sb = window.supabase.createClient(SUPA_URL, SUPA_KEY); }catch(e){ return deny(); }
    sb.auth.getSession().then(function(res){
      var s = res && res.data && res.data.session;
      if(!s){ return deny(); }
      sb.from('erp_users').select('approved').eq('id', s.user.id).maybeSingle().then(function(r){
        if(r && r.data && r.data.approved){ allow(); } else { deny(); }
      }).catch(deny);
    }).catch(deny);
  }
  if(document.readyState !== 'loading'){ check(); }
  else { document.addEventListener('DOMContentLoaded', check); }
})();
