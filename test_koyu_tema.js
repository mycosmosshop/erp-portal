// Ortak koyu tema (erp-dark.css) kapsam testi.
// Listeye alinmis her modulun CANLI sayfasi indirilir, ACIK zemin renkleri
// cikarilir ve ortak temada karsiligi olup olmadigi dogrulanir.
// Yeni modul listeye eklenip renkleri eslenmezse test patlar.
//   calistir:  node test_koyu_tema.js
const fs = require('fs'), assert = require('assert'), https = require('https');

const guard = fs.readFileSync(__dirname + '/erp-guard.js', 'utf8');
const css = fs.readFileSync(__dirname + '/erp-dark.css', 'utf8').toLowerCase();

// 1) Listeyi guard'dan oku (kopya degil)
const m = guard.match(/KOYU_MODULLER\s*=\s*\[([^\]]*)\]/);
assert(m, 'KOYU_MODULLER listesi bulunamadi');
const moduller = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
console.log('koyu temaya alinmis modul:', moduller.join(', ') || '(yok)');
assert.ok(moduller.length, 'liste bos — en az bir modul olmali');

function indir(u, y = 0) {
  return new Promise((ok, hata) => {
    https.get(u, r => {
      if ([301, 302, 307, 308].includes(r.statusCode) && r.headers.location && y < 5) {
        r.resume(); return indir(r.headers.location, y + 1).then(ok, hata);
      }
      if (r.statusCode !== 200) { r.resume(); return hata(new Error('HTTP ' + r.statusCode + ' → ' + u)); }
      let s = ''; r.setEncoding('utf8'); r.on('data', d => s += d); r.on('end', () => ok(s));
    }).on('error', hata);
  });
}

function parlaklik(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return 1;
  let m2 = c.match(/^#([0-9a-f]{3})$/);
  if (m2) c = '#' + [...m2[1]].map(x => x + x).join('');
  m2 = c.match(/^#([0-9a-f]{6})$/);
  if (!m2) return null;
  const n = parseInt(m2[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

(async () => {
  let toplamKontrol = 0;
  for (const mod of moduller) {
    const url = 'https://mycosmosshop.github.io/' + mod + '/';
    const s = await indir(url);
    const kaynaklar = [...[...s.matchAll(/style="([^"]*)"/g)].map(x => x[1]),
                       ...[...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x => x[1])];
    const renkler = new Map();
    for (const k of kaynaklar) {
      for (const g of k.matchAll(/background(?:-color)?\s*:\s*([^;}"]+)/gi)) {
        const c = g[1].trim().toLowerCase();
        if (/^(transparent|none|inherit|initial|unset)$/.test(c)) continue;
        if (c.startsWith('linear-gradient') || c.startsWith('url(') || c.startsWith('radial') || c.startsWith('var(')) continue;
        renkler.set(c, (renkler.get(c) || 0) + 1);
      }
    }
    const eksik = [];
    let kontrol = 0;
    for (const [renk, adet] of renkler) {
      const p = parlaklik(renk);
      if (p === null || p < 0.80) continue;
      kontrol++;
      const kisa = renk.replace(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/, '#$1$2$3');
      const gecer = css.includes(renk) || css.includes(kisa) ||
                    (renk === 'white' && css.includes('background: white')) ||
                    (/^#f{3,6}$/.test(renk) && css.includes('#fff'));
      if (!gecer) eksik.push(renk + ' (' + adet + ' yerde)');
    }
    toplamKontrol += kontrol;
    console.log('  ' + mod.padEnd(16) + ' acik zemin: ' + String(kontrol).padStart(2) +
                (eksik.length ? '   ✘ eksik: ' + eksik.join(', ') : '   ✔'));
    assert.strictEqual(eksik.length, 0, mod + ' modulunde ' + eksik.length + ' acik zemin ortak temada ezilmiyor');
  }

  // Temel yuzey kurallari ve tema kaynaklari yerinde mi
  ['body', 'tbody tr', 'input', 'select', '.modal-dialog'].forEach(sec =>
    assert.ok(css.includes(sec), 'ortak temada "' + sec + '" kurali yok'));
  ["'message'", "'storage'", 'erp_portal_theme', 'data-erp-mod'].forEach(x =>
    assert.ok(guard.includes(x), 'erp-guard icinde "' + x + '" yok'));

  console.log('\nOK ortak koyu tema: ' + moduller.length + ' modul, ' + toplamKontrol +
              ' acik zeminin tamami esleniyor; tema kaynaklari ve modul kimligi yerinde');
})().catch(e => { console.error('HATA:', e.message); process.exit(1); });
