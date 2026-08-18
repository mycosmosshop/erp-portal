// Veri Tazeligi paneli: yapilandirilan her kaynak GERCEKTEN okunabiliyor mu?
// Tablo adi/sutun adi degisir ya da RLS kapanirsa panel sessizce "okunamadi"
// gosterirdi; bu test onu yakalar.
//   calistir:  node test_tazelik.js
const fs = require('fs'), assert = require('assert'), https = require('https');
const html = fs.readFileSync(__dirname + '/erp_portal.html', 'utf8');

const URL = (html.match(/const TZ_URL = '([^']+)'/) || [])[1];
const KEY = (html.match(/const TZ_KEY = '([^']+)'/) || [])[1];
assert(URL && KEY, 'TZ_URL / TZ_KEY bulunamadi');

const blok = html.slice(html.indexOf('const TZ_KAYNAK'), html.indexOf('let _tzSonVeri'));
const kaynaklar = [...blok.matchAll(/\{\s*ad:'([^']+)',\s*t:'([^']+)',\s*z:'([^']+)'(?:,\s*f:'([^']+)')?/g)]
  .map(m => ({ ad: m[1], t: m[2], z: m[3], f: m[4] }));
assert.ok(kaynaklar.length >= 5, 'kaynak listesi cozulemedi (' + kaynaklar.length + ')');

function iste(u) {
  return new Promise((ok, hata) => {
    https.get(u, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }, r => {
      let s = ''; r.setEncoding('utf8'); r.on('data', d => s += d);
      r.on('end', () => ok({ kod: r.statusCode, govde: s }));
    }).on('error', hata);
  });
}

(async () => {
  let sorun = 0;
  for (const k of kaynaklar) {
    const u = URL + '/' + k.t + '?select=' + k.z + (k.f ? '&' + k.f : '') + '&order=' + k.z + '.desc.nullslast&limit=1';
    const r = await iste(u);
    if (r.kod !== 200) {
      console.log('  X ' + k.ad.padEnd(30) + ' HTTP ' + r.kod + ' — ' + r.govde.slice(0, 80));
      sorun++; continue;
    }
    let d; try { d = JSON.parse(r.govde); } catch (e) { d = null; }
    assert.ok(Array.isArray(d), k.ad + ': yanit dizi degil');
    if (!d.length) { console.log('  ! ' + k.ad.padEnd(30) + ' kayit yok (tablo bos ya da RLS suzuyor)'); continue; }
    const ham = d[0][k.z];
    assert.ok(ham, k.ad + ': "' + k.z + '" sutunu yanitta yok — sutun adi degismis olabilir');
    const t = new Date(String(ham).replace(' ', 'T'));
    assert.ok(!isNaN(t.getTime()), k.ad + ': "' + ham + '" tarihe cevrilemedi');
    const gun = Math.floor((Date.now() - t.getTime()) / 86400000);
    console.log('  ' + (gun > 30 ? '!' : 'OK') + ' ' + k.ad.padEnd(30) + t.toLocaleDateString('tr-TR') + '  (' + gun + ' gun once)');
  }
  assert.strictEqual(sorun, 0, sorun + ' kaynak okunamadi — panel bunlari "okunamadi" gosterir');

  // Esikler mantikli mi (uyari < kritik)
  for (const m of blok.matchAll(/ad:'([^']+)'[\s\S]{0,160}?esik:\[(\d+),\s*(\d+)\]/g)) {
    assert.ok(+m[2] < +m[3], m[1] + ': uyari esigi kritik esikten kucuk olmali');
  }
  console.log('\nOK veri tazeligi: ' + kaynaklar.length + ' kaynagin tamami okunabiliyor, esikler tutarli');
})().catch(e => { console.error('HATA:', e.message); process.exit(1); });
