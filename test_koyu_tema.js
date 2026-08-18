// Ortak koyu tema (erp-dark.css) kapsam testi.
// Listeye alinmis her modulun CANLI sayfasi indirilir, ACIK zemin renkleri
// cikarilir ve ortak temada karsiligi olup olmadigi dogrulanir.
// Yeni modul listeye eklenip renkleri eslenmezse test patlar.
//   calistir:  node test_koyu_tema.js
const fs = require('fs'), assert = require('assert'), https = require('https');

const guard = fs.readFileSync(__dirname + '/erp-guard.js', 'utf8');
const css = fs.readFileSync(__dirname + '/erp-dark.css', 'utf8').toLowerCase();
// Ortak temadaki secicilerin TAM listesi (:root[...] on ekleri soyulur).
// Ortak temada TANIMLI Tailwind zemin siniflarinin tam kumesi (alt dize
// eslesmesi '.bg-white' ile '.bg-white\/80'u karistiriyordu).
const temaTwSiniflari = new Set(
  css.replace(/\{[^{}]*\}/g, ' ')            // govdeleri at, yalniz seciciler kalsin
     .split(/[\s,]+/)
     .filter(x => x.startsWith('.bg-'))
     .map(x => x.replace(/[{].*$/, '').slice(1))   // bastaki nokta ve artik '{' temizlenir
);
const temaSeciciler = new Set(
  css.replace(/\/\*[\s\S]*?\*\//g, '')
     .replace(/\{[^{}]*\}/g, '\n')
     .split(/[\n,]/)
     .map(x => x.replace(/:root\[[^\]]*\]/g, '').replace(/\[data-erp-mod=[^\]]*\]/g, '')
                 .replace(/::?[a-z-]+(\([^)]*\))?/g, '').trim())   // :hover vb. ayikla (modul tarafinda da ayikliniyor)
     .filter(Boolean)
);

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
    // <style> bloklarinda tanimli ACIK yuzeyler: nitelik secicileri bunlari
    // yakalamaz, gercek sinif/eleman adiyla eslenmeleri gerekir.
    // Sayfa ici <style> + HARICI stylesheet'ler. Teknik Resim gibi moduller tum
    // renklerini ayri bir .css dosyasinda tutuyor; yalniz HTML taranirsa modul
    // "renksiz" gorunup sessizce kapsam disi kaliyordu.
    let modCss = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x => x[1]).join('\n');
    for (const l of s.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*>/g)) {
      const h = (l[0].match(/href=["']([^"']+)["']/) || [])[1];
      if (!h || /^https?:\/\//i.test(h) && !h.includes('mycosmosshop.github.io')) continue;   // dis CDN atlanir
      const tam = /^https?:\/\//i.test(h) ? h : (url + h.replace(/^\.?\//, ''));
      try { modCss += '\n' + await indir(tam); } catch (e) { console.log('    (stylesheet okunamadi: ' + tam + ')'); }
    }
    modCss = modCss.replace(/\/\*[\s\S]*?\*\//g, '');   // yorumlar secici sanilmasin
    const eksikSecici = [];
    for (const r of modCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sec = r[1].trim(), gov = r[2];
      const bg = (gov.match(/background(?:-color)?\s*:\s*([^;}"]+)/i) || [])[1];
      if (!bg) continue;
      const bgc = bg.trim().toLowerCase();
      if (bgc.startsWith('linear-gradient') || bgc.startsWith('url(') || bgc.startsWith('var(')) continue;
      if ((parlaklik(bgc) || 0) < 0.80) continue;      // yalnizca ACIK yuzeyler eslenmeli
      const ana = sec.split(',')[0].trim().split(':')[0].trim();
      if (!ana || ana.startsWith('@') || ana === 'body' || ana === 'html') continue;   // taban kural zaten var
      // TAM secici eslesmesi: alt dize kontrolu ".tbox" yokken ".tbox h3" yuzunden
      // "var" diyip gercek eksigi gizliyordu.
      if (!temaSeciciler.has(ana.toLowerCase())) eksikSecici.push(ana);
    }
    if (eksikSecici.length) {
      console.log('    <style> secicileri eslenmemis: ' + [...new Set(eksikSecici)].join(', '));
    }
    assert.strictEqual(eksikSecici.length, 0,
      mod + ' modulunde ' + [...new Set(eksikSecici)].length + ' acik yuzey secicisi ortak temada ezilmiyor');

    // SPA modullerinde govde JS paketiyle uretilir; Tailwind zemin siniflari
    // yalniz orada gecer. HTML/CSS taramasi bunlari gormez.
    const twEksik = new Set();
    for (const sc of s.matchAll(/<script[^>]*src=["']([^"']+)["']/g)) {
      const h = sc[1];
      if (/^https?:\/\//i.test(h) && !h.includes('mycosmosshop.github.io')) continue;   // dis CDN atlanir
      if (h.includes('erp-guard')) continue;
      const tam = /^https?:\/\//i.test(h) ? h : (url + h.replace(/^\.?\//, ''));
      let js = '';
      try { js = await indir(tam); } catch (e) { continue; }
      for (const t of js.matchAll(/\b(bg-(?:white|gray-\d{2,3}|slate-\d{2,3}|neutral-\d{2,3}|zinc-\d{2,3}))\b/g)) {
        const sinif = t[1];
        const koyuMu = /-(?:[6-9]\d{2})$/.test(sinif);          // 600+ tonlar zaten koyu
        if (koyuMu) continue;
        if (!temaTwSiniflari.has(sinif)) twEksik.add(sinif);
      }
    }
    if (twEksik.size) console.log('    JS paketindeki eslenmemis Tailwind zemini: ' + [...twEksik].join(', '));
    assert.strictEqual(twEksik.size, 0,
      mod + ' modulunun JS paketinde ' + twEksik.size + ' Tailwind zemin sinifi ortak temada ezilmiyor');

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
