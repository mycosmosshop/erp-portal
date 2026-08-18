// Sekme kimligi mantigi: "tedarikci" temel, "tedarikci#3" ucuncu kopya.
// Fonksiyonlar HTML'den ALINIR (kopya degil).
//   calistir:  node test_sekme.js
const fs = require('fs'), assert = require('assert');
const html = fs.readFileSync(__dirname + '/erp_portal.html', 'utf8');

function al(ad) {
  const i = html.indexOf('function ' + ad + '(');
  assert(i > 0, ad + ' bulunamadi');
  const j = html.indexOf('\n', html.indexOf('}', i));
  return html.slice(i, j);
}
const { _base, _kopyaNo } = new Function(al('_base') + '\n' + al('_kopyaNo') + '\nreturn {_base,_kopyaNo};')();

// temel kimlik
assert.strictEqual(_base('tedarikci'), 'tedarikci');
assert.strictEqual(_base('tedarikci#2'), 'tedarikci', 'kopya, temel modul kimligine cozulmeli');
assert.strictEqual(_base('tedarikci#10'), 'tedarikci');
assert.strictEqual(_base(null), '', 'null cokmemeli');
assert.strictEqual(_base(''), '');

// kopya numarasi
assert.strictEqual(_kopyaNo('tedarikci'), 1, 'kopyasiz sekme 1. kopyadir');
assert.strictEqual(_kopyaNo('tedarikci#2'), 2);
assert.strictEqual(_kopyaNo('tedarikci#12'), 12);
assert.strictEqual(_kopyaNo('tedarikci#'), 1, 'bozuk sonek 1 sayilmali');
assert.strictEqual(_kopyaNo(null), 1);

// kimlikte tire/alt tire olan modul adlari bozulmamali
assert.strictEqual(_base('kalite-kontrol#3'), 'kalite-kontrol');
assert.strictEqual(_kopyaNo('kalite-kontrol#3'), 3);

// Bir sonraki bos kopya numarasi (yeniKopya'nin kullandigi kural)
function sonrakiKopya(base, mevcut) {
  let n = 2;
  while (mevcut.indexOf(base + '#' + n) >= 0) n++;
  return base + '#' + n;
}
assert.strictEqual(sonrakiKopya('tedarikci', ['tedarikci']), 'tedarikci#2');
assert.strictEqual(sonrakiKopya('tedarikci', ['tedarikci', 'tedarikci#2']), 'tedarikci#3');
assert.strictEqual(sonrakiKopya('tedarikci', ['tedarikci', 'tedarikci#3']), 'tedarikci#2', 'bosluk varsa doldurulur');

console.log('OK sekme kimligi: temel/kopya cozumu ve numaralama dogru');
