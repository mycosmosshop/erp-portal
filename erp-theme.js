/* ERP ORTAK TEMA — tek basina yuklenebilir.
   erp-guard.js yukleyen moduller bunu guard uzerinden alir; guard
   YUKLEMEYEN moduller (yetki kontrolu istemeyenler) dogrudan ekler:
     <script src="https://mycosmosshop.github.io/erp-portal/erp-theme.js"></script>
*/
/* ── ORTAK KOYU TEMA (kontrollü yayılım) ───────────────────────────────────
   Yalnızca aşağıdaki listedeki modüllere uygulanır. Yeni modül hazır olunca
   adı listeye eklenir; böylece tüm modüller aynı anda değişmez ve her biri
   tek tek doğrulanabilir. Tema DEĞERİ portalden gelir (data-theme / ortak
   localStorage anahtarı / postMessage). Modülün işlevine dokunulmaz.
   NOT: supplier-system kendi koyu temasını içinde taşır, listede DEĞİLDİR. */
(function(){
  var KOYU_MODULLER = ['kpi-takip', 'pscr', 'teknik-resim', 'kalite-kontrol'];
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
