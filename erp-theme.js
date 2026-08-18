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
  // Tema degisirken gecis animasyonlarini kisa sureligine kapat (yanip sonme onlenir).
  // Kural ortak CSS'te; kendi temasi olan modullerde de calissin diye burada da yazilir.
  // Gecisi MASKELE: cok buyuk sayfalarda yeniden boyama parca parca ilerliyor
  // ve tema "bolum bolum" iniyor gibi gorunuyor. Icerik 2 kare gizlenir.
  function gecisiKilitle(){
    try{
      var k = document.documentElement;
      k.style.visibility = 'hidden';
      clearTimeout(window.__erpMaskeZ);
      var ac = function(){ k.style.visibility = ''; };
      window.__erpMaskeZ = setTimeout(ac, 400);            // GUVENLIK: her kosulda geri ac
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        clearTimeout(window.__erpMaskeZ); ac();
      }); });
      if(!document.getElementById('erpTemaGecisStil')){
        var st = document.createElement('style'); st.id = 'erpTemaGecisStil';
        st.textContent = ':root.tema-gecis,:root.tema-gecis *,:root.tema-gecis *::before,:root.tema-gecis *::after{'
                       + 'transition:none!important;animation-duration:0s!important;animation-delay:0s!important}';
        (document.head || k).appendChild(st);
      }
      k.classList.add('tema-gecis');
      clearTimeout(window.__erpTemaGecisZ);
      window.__erpTemaGecisZ = setTimeout(function(){ k.classList.remove('tema-gecis'); }, 140);
    }catch(e){}
  }
  // Ortak CSS ENJEKTE EDILECEK moduller (kendi temasi olmayanlar)
  var KOYU_MODULLER = [
    'kpi-takip',
    'pscr',
    'teknik-resim',
    'supplier-system/coa-arsiv',
    'supplier-system/uygunsuzluk-analizi',
    'supplier-system/balik-kilcigi',
    'supplier-system/5-neden-analizi',
    'supplier-system/8d-rapor',
    'supplier-system/dof-yonetimi'
  ];
  // KENDI tema sistemi olan moduller: CSS basilmaz, modulun kendi anahtari surulur.
  // (Ustune yazmak iki paleti karistirir: govde koyu, baslik/hover acik kalir.)
  var KENDI_TEMASI = {
    'kalite-kontrol': function(t){
      if (typeof window.applyTheme === 'function'){ window.applyTheme(t); return true; }
      return false;                                  // modul JS'i henuz yuklenmedi
    }
  };
  var CSS_URL = 'https://mycosmosshop.github.io/erp-portal/erp-dark.css';
  try{
    // Kimlik: "klasor" ya da "klasor/dosya". Ayni depo altindaki farkli
    // sayfalar (supplier-system/coa-arsiv gibi) ayri ayri ele alinabilsin;
    // ana uygulamanin kendi temasiyla karismasin.
    var parcalar = location.pathname.split('/').filter(Boolean);
    var klasor = (parcalar[0] || '').toLowerCase();
    var dosya = (parcalar[parcalar.length - 1] || '').toLowerCase()
                  .replace(/\.html?$/, '').replace(/^index$/, '');
    var yol = (dosya && dosya !== klasor) ? (klasor + '/' + dosya) : klasor;

    // ── Kendi temasi olan modul: yalnizca anahtarini sur ──
    if(KENDI_TEMASI[yol]){
      var kanca = KENDI_TEMASI[yol];
      var surulen = null;
      var sur = function(th){
        if(!th) return;
        gecisiKilitle();
        surulen = th;
        if(kanca(th)) return;                        // uygulandi
        var dene = 0, zm = setInterval(function(){   // modul JS'i yuklenene kadar bekle
          if(kanca(surulen) || ++dene > 40) clearInterval(zm);
        }, 250);
      };
      var ilkT = document.documentElement.getAttribute('data-theme');
      if(!ilkT){ try{ ilkT = localStorage.getItem('erp_portal_theme'); }catch(e){} }
      sur(ilkT);
      window.addEventListener('message', function(e){
        if(e && e.data && e.data.tip === 'erp-tema') sur(e.data.tema);
      });
      window.addEventListener('storage', function(e){
        if(e && e.key === 'erp_portal_theme') sur(e.newValue);
      });
      return;                                        // ortak CSS BASILMAZ
    }

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
        gecisiKilitle();
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
