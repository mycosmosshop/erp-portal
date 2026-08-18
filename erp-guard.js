/* ERP Guard — modülleri ERP onayına bağlar.
   Aynı origin (mycosmosshop.github.io) modüllerine eklenir.
   Onaylı ERP oturumu yoksa portala yönlendirir; varsa içeriği gösterir.
   Kullanım (modülün <head>'inde, bu sırayla):
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="https://mycosmosshop.github.io/erp-portal/erp-guard.js"></script>
*/
/* Ortak tema ayri dosyada (erp-theme.js) — guard yuklemeyen moduller de
   ayni temayi tek basina kullanabilsin diye ayrildi. */
(function(){ try{
  var t = document.createElement('script');
  t.src = 'https://mycosmosshop.github.io/erp-portal/erp-theme.js';
  (document.head || document.documentElement).appendChild(t);
}catch(e){} })();


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
