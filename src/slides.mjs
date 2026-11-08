// 20-slide deck for Komdat P10 (Bab X Algoritma Routing).
// Apple-style layout: content sits on the canvas (no boxes); hierarchy comes from type,
// icons and space. Text follows Komdat P10.pdf; strengths/limits are kept short.
import { appIcon, glyph, orb, diagram, coverArt, exampleGraph, floydMatrix, routeHero, fanHero, goalArt, stageArt, thanksArt } from "./vectors.mjs";

const split = t => t.split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
const lead = t => `<p class="lead r">${t}</p>`;
const para = t => `<p class="copy r">${t}</p>`;
const ico = name => `<span class="ico">${glyph(name)}</span>`;
// strengths / limits / usage: a short headed list with a tone glyph
const pc = (tone, title, items) => `<div class="pc r" data-tone="${tone}"><h3><span class="pc-ic">${glyph({ plus: 'check', minus: 'dash', info: 'flask' }[tone])}</span>${title}</h3><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
const bigword = (w, sub) => `<div class="bigword r"><b>${w}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
const visual = id => `<div class="visual r">${diagram(id)}</div>`;
const trail = rows => `<ol class="trail r">${rows.map(([a, b]) => `<li><span>${a}</span><em>${b}</em></li>`).join('')}</ol>`;
const answer = (path, n, unit) => `<div class="answer r"><span class="path">${path}</span><span class="big" data-count="${n}">${n}</span><span class="unit">${unit}</span></div>`;
const cols = (cls, ...c) => `<div class="cols ${cls}">${c.map(x => `<div class="col-i">${x}</div>`).join('')}</div>`;

export const chapters = { A: 'Pengertian', B: 'Tujuan', C: 'Klasifikasi', D: 'Algoritma populer', S: 'Ringkasan' };
function slide(id, ch, title, pages, icon, body, kind = '') {
  return {
    id, ch, title,
    html: `<div class="lesson ${kind}"><header class="head">${icon ? appIcon(icon) : ''}<div class="head-text"><p class="chip r"><b>${ch === 'S' ? '∑' : ch}</b>${chapters[ch]}</p><h1 class="title">${split(title)}</h1></div></header><div class="body">${body}</div><footer class="src r">Sumber: Komdat P10.pdf, hlm. ${pages}</footer></div>`
  };
}

const presenters = [['Ilham Oktorian', 'NIM 1102411030'], ['Hamit Sarif Zaki', 'NIM 1102411030']];
function cover() {
  const scene = `<div class="cover-scene">${coverArt()}<div class="cover-copy"><p class="chip chip-cover r"><b>10</b>Komunikasi Data, pertemuan 10</p><h1 class="cover-title"><span class="line"><span class="r-line">Algoritma</span></span><span class="line"><span class="r-line grad">Routing</span></span></h1><p class="cover-sub r">Bab X</p><ul class="presenters r">${presenters.map(([n, id]) => `<li><span>${n}</span><span>${id}</span></li>`).join('')}</ul></div></div>`;
  return `<div class="cover">${scene}<div class="lens" aria-hidden="true"><div class="lens-back"></div><div class="lens-optics"><div class="lens-mag"><div class="lens-clone"></div></div></div><div class="lens-rim"></div><div class="lens-glint"></div></div><p class="cover-hint r">Seret lensa kaca. Tekan panah kanan untuk mulai.</p></div>`;
}

function thanks() {
  return `<div class="thanks">${thanksArt()}<div class="thanks-copy"><p class="chip chip-cover r"><b>X</b>Algoritma Routing</p><h1 class="thanks-title"><span class="line"><span class="r-line grad">Terima kasih</span></span></h1><p class="thanks-sub r">Komunikasi Data, pertemuan 10</p><ul class="thanks-names r">${presenters.map(([n, id]) => `<li><b>${n}</b><span>${id}</span></li>`).join('')}</ul></div></div>`;
}

// classification slides share one composition: text left, live scene right, protocol under it
function classSlide(id, title, pages, icon, how, plus, minus, proto, protoSub, minusTitle = 'Kelemahan', plusTitle = 'Kelebihan') {
  return slide(id, 'C', title, pages, icon,
    `<div class="split split-class"><div class="split-l">${how.map(para).join('')}${id === 'dv' ? `<div class="pair r"><div><b>“Berapa jauh”</b><span>distance</span></div><div><b>“Ke mana”</b><span>vector</span></div></div>` : ''}${minus ? cols('cols-2 cols-pc', pc('plus', plusTitle, plus), pc('minus', minusTitle, minus)) : pc('plus', plusTitle, plus)}</div><div class="split-r">${visual(id)}${bigword(proto, protoSub)}</div></div>`);
}

export function buildSlides() {
  const S = [
    { id: 'cover', ch: 'cover', title: 'Algoritma Routing', html: cover() },

    // ---------- A. Pengertian ----------
    slide('pengertian', 'A', 'Pengertian algoritma routing', '1', 'route',
      `<div class="split split-hero"><div class="split-l"><p class="hero-def r">Algoritma routing adalah <strong>seperangkat aturan dan prosedur</strong> yang digunakan dalam jaringan komputer untuk <strong>menentukan jalur terbaik</strong> bagi paket data dari sumber ke tujuan.</p></div><div class="split-r">${routeHero()}</div></div>` +
      cols('cols-2 cols-groups',
        `<div class="grp r"><h3>Komponen vital</h3><p>Routing merupakan komponen vital dalam protokol jaringan karena memengaruhi:</p><div class="icon-row">${[['gauge', 'Efisiensi'], ['bolt', 'Kecepatan'], ['shield', 'Keandalan']].map(([i, l]) => `<span>${ico(i)}<b>${l}</b></span>`).join('')}</div></div>`,
        `<div class="grp r"><h3>Meminimalkan biaya transmisi</h3><p>Serta menghindari kemacetan atau kegagalan jaringan. Biaya transmisi seperti:</p><div class="icon-row">${[['clock', 'Waktu'], ['ruler', 'Jarak'], ['hops', 'Jumlah hop']].map(([i, l]) => `<span>${ico(i)}<b>${l}</b></span>`).join('')}</div></div>`)),

    slide('statis', 'A', 'Routing statis dan dinamis', '1', 'branch',
      lead('Routing dapat bersifat <strong>statis</strong> atau <strong>dinamis</strong>.') +
      cols('cols-2 cols-sd',
        visual('statis') + `<div class="feat r">${ico('lock')}<div><h3>Routing statis</h3><p>Rute ditentukan secara manual dan tidak berubah.</p></div></div>`,
        visual('dinamis') + `<div class="feat r">${ico('refresh')}<div><h3>Routing dinamis</h3><p>Rute diperbarui otomatis mengikuti perubahan kondisi jaringan.</p></div></div>`)),

    slide('tahapan', 'A', 'Tahapan proses routing', '1–2', 'steps',
      lead('Proses routing meliputi beberapa tahap utama:') +
      `<ol class="timeline"><span class="tl-line grow"></span>${[
        ['radiate', 'Pengumpulan informasi', 'Informasi jaringan seperti topologi, biaya jalur, dan status node.'],
        ['shortest', 'Perhitungan rute terbaik', 'Menggunakan algoritma tertentu, misalnya Dijkstra atau Bellman-Ford.'],
        ['table', 'Pemutakhiran tabel routing', 'Struktur data yang menyimpan rute ke berbagai tujuan.'],
        ['send', 'Penerusan paket', 'Paket data diteruskan sesuai informasi dalam tabel routing.']
      ].map(([i, t, d], k) => `<li class="r"><span class="tl-dot"><b>${k + 1}</b></span>${stageArt(k)}<h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`),

    // ---------- B. Tujuan ----------
    slide('tujuan', 'B', 'Tujuan penggunaan algoritma routing', '2', 'target',
      `<p class="hero-def hero-md r">Tujuan utamanya adalah <strong>meningkatkan efisiensi, kecepatan, dan keandalan</strong> dalam pengiriman data.</p>` +
      cols('cols-3 cols-goal', ...[
        ['Menghindari jalur bermasalah', 'Data dapat menghindari jalur yang macet, putus, atau terlalu lambat.'],
        ['Memanfaatkan jalur alternatif', 'Data dapat memanfaatkan jalur alternatif yang lebih optimal.'],
        ['Mengatur lalu lintas data', 'Lalu lintas diatur agar tidak terjadi benturan atau penundaan yang merugikan.']
      ].map(([t, d], i) => `<div class="goal r">${goalArt(i)}<h3>${t}</h3><p>${d}</p></div>`))),

    // ---------- C. Klasifikasi ----------
    slide('klasifikasi', 'C', 'Klasifikasi algoritma routing', '2–3', 'layers',
      lead('Klasifikasi algoritma routing <strong>berdasarkan sumber informasi</strong> terdiri dari:') +
      cols('cols-3 cols-class', ...[
        ['Distance Vector', 'Menyebarkan informasi jarak dan arah ke router tetangga.', 'RIP', 'dv', 'radiate'],
        ['Link State', 'Membangun peta lengkap jaringan; setiap router tahu seluruh jalur.', 'OSPF', 'ls', 'map'],
        ['Path Vector', 'Mencatat seluruh jalur (path) antar autonomous system.', 'BGP', 'pv', 'chain']
      ].map(([t, d, pr, at, ic]) => `<button class="class-item r" data-go="@${at}">${appIcon(ic).replace(' r"', '"')}<span class="cc-t">${t}</span><span class="cc-d">${d}</span><span class="cc-p">${pr}</span><span class="cc-go">Lihat detail</span></button>`))),

    classSlide('dv', 'Distance Vector Routing', '2', 'radiate',
      ['Bekerja dengan menyebarkan informasi tentang jarak dan arah ke semua tujuan ke <strong>router tetangga</strong>. Informasi ini terus diperbarui secara berkala. Setiap router hanya tahu:'],
      ['Mudah dikonfigurasi'], ['Konvergensi lambat', 'Risiko routing loop'], 'RIP', 'Routing Information Protocol'),

    classSlide('ls', 'Link State Routing', '3', 'map',
      ['Bekerja dengan membangun <strong>peta lengkap jaringan</strong>. Setiap router mengetahui seluruh jalur yang tersedia, bukan hanya informasi dari tetangganya.', 'Jalur terpendek dihitung menggunakan algoritma seperti <strong>Dijkstra</strong>.'],
      ['Lebih cepat beradaptasi', 'Lebih efisien dibanding Distance Vector'], ['Butuh lebih banyak sumber daya', 'Implementasi lebih kompleks'], 'OSPF', 'Open Shortest Path First'),

    classSlide('pv', 'Path Vector Routing', '3', 'chain',
      ['Digunakan pada routing <strong>antar domain atau antar autonomous system (AS)</strong>, seperti di internet.', 'Setiap entri dalam tabel routing mencatat <strong>seluruh jalur (path)</strong> yang dilewati untuk mencapai tujuan.'],
      ['Mencegah loop', 'Menjaga stabilitas jaringan besar'], null, 'BGP', 'Border Gateway Protocol, protokol paling terkenal', 'Kelemahan', 'Manfaat'),

    // ---------- D. Algoritma populer ----------
    slide('dijkstra', 'D', 'Dijkstra (Shortest Path First)', '4', 'shortest',
      `<div class="split split-hero"><div class="split-l"><p class="hero-def hero-md r">Metode pencarian <strong>jalur terpendek dari satu simpul sumber ke semua simpul lain</strong> dalam sebuah jaringan.</p>` +
      `<div class="feat r">${ico('check')}<div><h3>Prinsip greedy</h3><p>Selalu memilih jalur dengan bobot terkecil di setiap langkahnya.</p></div></div>` +
      bigword('OSPF', 'Sangat efektif dalam protokol routing OSPF (Open Shortest Path First), terutama pada jaringan menengah hingga besar, selama bobot antar simpul bersifat positif.') +
      `</div><div class="split-r">${fanHero()}</div></div>`),

    slide('dijkstra-langkah', 'D', 'Langkah kerja Dijkstra', '4', 'list',
      `<ol class="numlist r">${[
        'Inisialisasi jarak semua node ke tak hingga (∞), kecuali node asal yang diatur ke 0.',
        'Tandai semua node sebagai belum dikunjungi.',
        'Pilih node dengan jarak terkecil dari yang belum dikunjungi, lalu kunjungi semua tetangganya.',
        'Jika ditemukan jalur lebih pendek ke tetangga tersebut, perbarui jaraknya.',
        'Tandai node tersebut sebagai sudah dikunjungi.',
        'Ulangi proses ini hingga semua node telah dikunjungi.'
      ].map((t, i) => `<li><span class="num">${i + 1}</span><p>${t}</p></li>`).join('')}</ol>` +
      `<p class="result-bar r">${ico('check')}<span><strong>Hasil akhir:</strong> jalur terpendek dari node sumber ke setiap node lain dalam jaringan.</span></p>`),

    slide('dijkstra-contoh', 'D', 'Contoh Dijkstra', '5', 'graph',
      `<div class="split split-ex"><div class="split-l"><div class="visual r">${exampleGraph('dijkstra')}</div></div><div class="split-r">` +
      para('Tujuannya adalah mencari jalur terpendek dari <strong>A ke D</strong>.') +
      trail([['Dari A, pilih ke B', 'jarak 2'], ['Dari B, pilih ke C', 'tambahan 1, total 3'], ['Dari C, pilih ke D', 'tambahan 2, total 5']]) +
      answer('A → B → C → D', 5, 'jalur terpendek, total bobot 5') + `</div></div>`, 'example'),

    slide('dijkstra-nilai', 'D', 'Kelebihan dan keterbatasan Dijkstra', '6', 'shortest',
      lead('Dijkstra menjadi pilihan utama dalam berbagai sistem jaringan, dengan satu syarat: bobot antar simpul harus positif.') +
      `<div class="versus"><div class="vs-col">${[
        ['check', 'Jalur paling efisien, secara pasti', 'Selama bobot antar simpul bernilai positif.'],
        ['server', 'Ideal untuk link stabil', 'Jaringan internal perusahaan dan backbone ISP.']
      ].map(([i, t, d]) => `<div class="feat feat-plus r">${ico(i)}<div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div>${orb('shortest')}<div class="vs-col">${[
        ['warn', 'Tidak untuk bobot negatif', 'Hasil perhitungan menjadi tidak akurat.'],
        ['stack', 'Berat di jaringan sangat besar', 'Banyak perhitungan dan penyimpanan data.']
      ].map(([i, t, d]) => `<div class="feat feat-minus r">${ico(i)}<div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div></div>`),

    slide('bellman', 'D', 'Bellman-Ford', '6–8', 'minus',
      lead('Berbeda dari Dijkstra, Bellman-Ford dapat <strong>menangani bobot negatif</strong>. Jarak ke semua node diperbarui secara iteratif berdasarkan info dari node tetangga.') +
      `<div class="split split-tri"><div class="split-l"><h3 class="sub r">Langkah kerja</h3><ol class="numlist numlist-1 r">${[
        'Update jarak semua edge sebanyak (jumlah node − 1) kali.',
        'Jika jarak baru lebih pendek, lakukan pembaruan.',
        'Cek loop negatif dengan satu iterasi tambahan.'
      ].map((t, i) => `<li><span class="num">${i + 1}</span><p>${t}</p></li>`).join('')}</ol>${bigword('RIP', 'Routing Information Protocol')}</div>${orb('minus')}<div class="split-r">` +
      pc('plus', 'Kelebihan', ['Mampu menangani bobot negatif', 'Lebih sederhana dan mudah diimplementasikan']) +
      pc('minus', 'Kelemahan', ['Konvergensi lebih lambat (iterasi n − 1 kali)', 'Rentan routing loop; perlu split horizon atau hold-down timer']) +
      `</div></div>`),

    slide('bellman-contoh', 'D', 'Contoh Bellman-Ford', '7', 'graph',
      `<div class="split split-ex"><div class="split-l"><div class="visual r">${exampleGraph('bellman')}</div><div class="edges r"><span>A —(4)→ B</span><span>A —(5)→ C</span><span>B —(−2)→ C</span></div></div><div class="split-r">` +
      para('Dari A:') + trail([['Langkah 1', 'A → B = 4, A → C = 5'], ['Langkah 2', 'B → C = 4 + (−2) = 2']]) +
      para('2 lebih pendek dari 5, maka jarak ke C <strong>di-update</strong>.') +
      answer('A → B → C', 2, 'hasil terbaik, jarak = 2') + `</div></div>`, 'example'),

    slide('floyd', 'D', 'Floyd-Warshall', '8–10', 'matrix',
      lead('Menemukan <strong>jalur terpendek antar semua pasangan node</strong>. Cocok untuk simulasi topologi tertutup, tabel full-matrix antar router, atau jaringan lokal skala kecil.') +
      `<div class="split split-tri"><div class="split-l"><h3 class="sub r">Prinsip kerja</h3><ol class="numlist numlist-1 numlist-alpha r">${[
        'Bangun matriks jarak awal.',
        'Iterasi menggunakan node sebagai perantara.',
        'Jika jarak(i,j) &gt; jarak(i,k) + jarak(k,j), update jaraknya.'
      ].map((t, i) => `<li><span class="num">${'abc'[i]}</span><p>${t}</p></li>`).join('')}</ol>${bigword('O(n³)', 'Kompleksitas waktu')}</div>${orb('matrix')}<div class="split-r">` +
      pc('plus', 'Kelebihan', ['Info jalur lengkap antar semua node, secara serentak', 'Akurat; cocok untuk sistem dengan topologi tetap']) +
      pc('minus', 'Kekurangan', ['Perhitungan naik drastis seiring jumlah node', 'Tidak disarankan untuk jaringan besar atau sering berubah']) +
      `</div></div>`),

    slide('floyd-contoh', 'D', 'Contoh Floyd-Warshall', '9', 'graph',
      `<div class="split split-ex3"><div class="split-l"><div class="visual r">${exampleGraph('floyd')}</div><div class="edges r"><span>A-B = 3</span><span>B-C = 2</span><span>A-C = 10</span></div></div><div class="split-m"><div class="r">${floydMatrix()}</div>${trail([['Langsung A → C', '10'], ['Lewat B: A → B → C', '3 + 2 = 5']])}</div><div class="split-r">` +
      answer('Update A → C', 5, 'menjadi 5, dari semula 10') + `</div></div>`, 'example'),

    slide('flooding', 'D', 'Flooding', '10–11', 'waves',
      `<div class="split split-class"><div class="split-l">` +
      para('Semua paket disebarkan ke <strong>seluruh jalur yang tersedia</strong>. Router mengirim salinan paket ke semua antarmuka, kecuali ke arah asal.') +
      para('<strong>Contoh:</strong> jika A terhubung ke B dan C, A mengirim ke B dan C sekaligus. B dan C mengirim lagi ke node lainnya, terus menyebar.') +
      `</div><div class="split-r">${visual('flooding')}</div></div>` +
      cols('cols-3 cols-pc3', pc('plus', 'Kelebihan', ['Data pasti sampai ke tujuan', 'Tanpa perhitungan rute atau tabel routing']), pc('minus', 'Kekurangan', ['Duplikasi paket, ledakan lalu lintas', 'Membebani bandwidth']), pc('info', 'Penggunaan', ['Pemancaran awal info routing', 'Kondisi darurat, tabel rute belum ada']))),

    slide('random', 'D', 'Random Routing', '11–12', 'dice',
      `<div class="split split-class"><div class="split-l">` +
      para('Memilih jalur pengiriman <strong>secara acak</strong> dari semua rute yang tersedia, tanpa mempertimbangkan delay, jumlah hop, atau bandwidth.') +
      para('<strong>Contoh:</strong> jika A terhubung ke B, C, dan D, A bisa memilih secara acak salah satunya untuk meneruskan paket.') +
      `</div><div class="split-r">${visual('random')}</div></div>` +
      cols('cols-3 cols-pc3', pc('plus', 'Keunggulan', ['Sangat mudah diimplementasikan', 'Tanpa tabel routing, hemat sumber daya']), pc('minus', 'Keterbatasan', ['Tidak menjamin rute efisien', 'Delay tinggi, looping, paket hilang']), pc('info', 'Penggunaan', ['Simulasi dan jaringan eksperimental', 'Pengujian perilaku jaringan']))),

    { id: 'terima-kasih', ch: 'cover', title: 'Terima kasih', html: thanks() }
  ];
  S.forEach(s => { s.html = s.html.replace(/data-go="@([\w-]+)"/g, (_, id) => `data-go="${S.findIndex(x => x.id === id)}"`); });
  if (S.length !== 20) throw Error(`Expected 20 slides, got ${S.length}`);
  return S;
}
