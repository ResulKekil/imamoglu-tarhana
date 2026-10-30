/* =========================================================
   İmamoğlu Tarhana - site betiği
   Ürünler ve fiyatlar urunler.js dosyasından gelir.
   Sepet tarayıcıda sadece { id, gr, fiyat } olarak saklanır;
   fiyat, ad ve görsel her açılışta urunler.js'den yeniden okunur.
   Böylece fiyat değişince eski sepetler de güncel fiyatı gösterir.

   1 Yardımcılar  2 Sepet hafızası  3 Ürün kartları  4 Sepet sayfası
   5 WhatsApp mesajı  6 Menü, filtre ve diğerleri
   ========================================================= */
var SEPET_ANAHTAR = "imamoglu_sepet";

/* ---------- 1. Yardımcılar ---------- */
/* 1234567 -> "1.234.567 TL" */
function paraYaz(sayi) {
  return String(Math.round(sayi)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " TL";
}

/* 500 -> "0,5", 1500 -> "1,5", 3000 -> "3" */
function kgSayisi(gr) {
  return String(gr / 1000).replace(".", ",");
}

function miktarYazisi(gr) {
  return kgSayisi(gr) + " kg";
}

function tutarHesapla(fiyat, gr) {
  return Math.round(fiyat * gr / 1000);
}

function maksGr(adim) {
  return adim >= 1000 ? 999000 : 50000;
}

function adimYazisi(adim) {
  return adim >= 1000 ? "1 kg'lık adımlarla satılır" : "500 gr ve katları olarak satılır";
}

function urunBul(id) {
  for (var i = 0; i < URUNLER.length; i++) if (URUNLER[i].id === id) return URUNLER[i];
  return null;
}

function satistaMi(urun) {
  return urun && urun.satista !== false;
}

function elemanYap(etiket, sinif, yazi) {
  var el = document.createElement(etiket);
  if (sinif) el.className = sinif;
  if (yazi !== undefined) el.textContent = yazi;
  return el;
}

/* WebP destekleyen tarayıcıya .webp, diğerlerine .jpg verir */
function resimYap(urun, boyut, tembel) {
  var resim = document.createElement("picture");
  var kaynak = document.createElement("source");
  kaynak.type = "image/webp";
  kaynak.srcset = "images/urunler/" + urun.resim + ".webp";
  var img = document.createElement("img");
  img.src = "images/urunler/" + urun.resim + ".jpg";
  img.alt = urun.alt || urun.ad;
  img.width = boyut;
  img.height = boyut;
  img.decoding = "async";
  if (tembel) img.loading = "lazy";
  resim.append(kaynak, img);
  return resim;
}

/* Ekran okuyuculara kısa duyuru (örn. "Kaju sepete eklendi") */
function duyur(yazi) {
  var alan = document.getElementById("duyuru-alani");
  if (!alan) return;
  alan.textContent = "";
  window.setTimeout(function () { alan.textContent = yazi; }, 30);
}

/* ---------- 2. Sepet hafızası ---------- */
/* Eski sürümler sepeti ürün adıyla ve eklendiği andaki fiyatla saklıyordu.
   Bu kayıtları ada göre bulup yeni biçime çeviririz. */
function eskiKaydiCevir(k) {
  if (k.id) return k;
  var urun = null;
  for (var i = 0; i < URUNLER.length; i++) if (URUNLER[i].ad === k.ad) urun = URUNLER[i];
  if (!urun) return null;
  var gr = typeof k.gr === "number" ? k.gr : (typeof k.kg === "number" ? k.kg * 1000 : urun.adim);
  return { id: urun.id, gr: gr, fiyat: k.fiyat };
}

function hamSepet() {
  try {
    var veri = JSON.parse(localStorage.getItem(SEPET_ANAHTAR));
    return Array.isArray(veri) ? veri : [];
  } catch (hata) {
    return [];
  }
}

function sepetiKaydet(sepet) {
  try {
    localStorage.setItem(SEPET_ANAHTAR, JSON.stringify(sepet.map(function (s) {
      return { id: s.id, gr: s.gr, fiyat: s.urun ? s.urun.fiyat : s.fiyat };
    })));
  } catch (hata) {
    /* Tarayıcı kaydetmeye izin vermiyorsa sessizce devam et */
  }
}

/* Sepeti güncel ürün listesiyle birleştirir.
   Dönen her satırda: id, gr, urun (güncel bilgi), eskiFiyat (fiyat değiştiyse).
   Artık satılmayan ürünler çıkarılır ve adları "kaldirilanlar" içinde döner. */
function sepetiOku() {
  var satirlar = [];
  var kaldirilanlar = [];
  var gorulen = {};
  hamSepet().forEach(function (ham) {
    var k = eskiKaydiCevir(ham);
    if (!k) { if (ham && ham.ad) kaldirilanlar.push(ham.ad); return; }
    var urun = urunBul(k.id);
    if (!satistaMi(urun)) { kaldirilanlar.push(urun ? urun.ad : (ham.ad || k.id)); return; }
    if (gorulen[urun.id]) return;
    gorulen[urun.id] = true;
    var gr = Math.ceil((Number(k.gr) || urun.adim) / urun.adim) * urun.adim;
    gr = Math.min(Math.max(gr, urun.adim), maksGr(urun.adim));
    var satir = { id: urun.id, gr: gr, urun: urun };
    if (typeof k.fiyat === "number" && k.fiyat !== urun.fiyat) satir.eskiFiyat = k.fiyat;
    satirlar.push(satir);
  });
  return { satirlar: satirlar, kaldirilanlar: kaldirilanlar };
}

function sepetSatirlari() {
  return sepetiOku().satirlar;
}

function sepetToplami(satirlar) {
  var toplam = 0;
  satirlar.forEach(function (s) { toplam += tutarHesapla(s.urun.fiyat, s.gr); });
  return toplam;
}

/* Bir ürünün miktarını ayarlar; gr 0 ise ürünü sepetten çıkarır */
function miktariYaz(id, gr) {
  var satirlar = sepetSatirlari();
  var urun = urunBul(id);
  if (!satistaMi(urun)) return;
  var sira = -1;
  satirlar.forEach(function (s, i) { if (s.id === id) sira = i; });

  if (gr <= 0) {
    if (sira !== -1) satirlar.splice(sira, 1);
  } else {
    gr = Math.min(gr, maksGr(urun.adim));
    if (sira === -1) satirlar.push({ id: id, gr: gr, urun: urun });
    else satirlar[sira].gr = gr;
  }
  sepetiKaydet(satirlar);
  hepsiniYenile();
}

function sepettekiGr(id) {
  var bulunan = 0;
  sepetSatirlari().forEach(function (s) { if (s.id === id) bulunan = s.gr; });
  return bulunan;
}

/* Kutuya yazılan kg değerini grama çevirir (1,5 ve 1.5 ikisi de olur),
   adımın katına yukarı yuvarlar. Boş ya da 0 ise eski miktar kalır. */
function girileniOku(deger, eskiGr, adim) {
  var kg = parseFloat(String(deger).replace(",", "."));
  if (!kg || kg <= 0) return eskiGr;
  var gr = Math.round(kg * 1000);
  var yuvarlanmis = Math.ceil(gr / adim) * adim;
  return Math.min(Math.max(yuvarlanmis, adim), maksGr(adim));
}

/* Yazılabilir miktar kutusu: [−] [ 1,5 kg ] [+] */
function miktarKontroluYap(urun, gr) {
  var kutu = elemanYap("div", "adet");
  var eksi = elemanYap("button", "adet-dugme adet-eksi", "−");
  eksi.type = "button";
  eksi.setAttribute("aria-label", urun.ad + " miktarını azalt");
  var alan = elemanYap("label", "adet-alan");
  var girdi = elemanYap("input", "miktar-girdi");
  girdi.type = "text";
  girdi.inputMode = "decimal";
  girdi.autocomplete = "off";
  girdi.maxLength = 5;
  girdi.value = kgSayisi(gr);
  girdi.id = "miktar-" + urun.id + (document.getElementById("sepet-liste") ? "-sepet" : "");
  girdi.setAttribute("aria-label", urun.ad + " miktarı, kilogram");
  alan.append(girdi, elemanYap("span", "", "kg"));
  var arti = elemanYap("button", "adet-dugme adet-arti", "+");
  arti.type = "button";
  arti.setAttribute("aria-label", urun.ad + " miktarını artır");
  kutu.append(eksi, alan, arti);
  kutu.dataset.id = urun.id;
  return kutu;
}

/* ---------- 3. Ürün kartları (ana sayfa) ---------- */
function kartYap(urun) {
  var kart = elemanYap("article", "urun");
  kart.dataset.id = urun.id;
  kart.dataset.kategori = urun.kategori;

  var gorsel = elemanYap("div", "urun-gorsel");
  gorsel.appendChild(resimYap(urun, 640, true));
  if (urun.etiket) gorsel.appendChild(elemanYap("span", "urun-etiket", urun.etiket));
  if (!satistaMi(urun)) gorsel.appendChild(elemanYap("span", "urun-etiket urun-etiket-yok", "Şu an satışta değil"));

  var govde = elemanYap("div", "urun-govde");
  govde.appendChild(elemanYap("h4", "urun-ad", urun.ad));

  var fiyat = elemanYap("p", "fiyat");
  fiyat.append(elemanYap("span", "fiyat-tutar", paraYaz(urun.fiyat)), elemanYap("span", "fiyat-birim", "/ kg"));
  govde.appendChild(fiyat);
  govde.appendChild(elemanYap("p", "fiyat-alt",
    urun.adim < 1000 ? "500 gr: " + paraYaz(urun.fiyat / 2) : "Kilo ile satılır"));

  var islem = elemanYap("div", "urun-islem");
  if (satistaMi(urun)) {
    var ekle = elemanYap("button", "sepete-ekle", "Sepete ekle");
    ekle.type = "button";
    ekle.setAttribute("aria-label", urun.ad + ", sepete ekle");
    var kontrol = miktarKontroluYap(urun, urun.adim);
    kontrol.hidden = true;
    var ipucu = elemanYap("p", "adet-ipucu", adimYazisi(urun.adim));
    ipucu.hidden = true;
    islem.append(ekle, kontrol, ipucu);
  } else {
    var yok = elemanYap("button", "sepete-ekle", "Satışta değil");
    yok.type = "button";
    yok.disabled = true;
    islem.appendChild(yok);
  }
  govde.appendChild(islem);

  kart.append(gorsel, govde);
  return kart;
}

function urunleriCiz() {
  var izgaralar = document.querySelectorAll("[data-urun-izgara]");
  if (!izgaralar.length) return;
  izgaralar.forEach(function (izgara) {
    var kategori = izgara.getAttribute("data-urun-izgara");
    izgara.innerHTML = "";
    URUNLER.forEach(function (u) { if (u.kategori === kategori) izgara.appendChild(kartYap(u)); });
  });
  document.querySelectorAll("[data-urun-sayisi]").forEach(function (el) {
    var k = el.getAttribute("data-urun-sayisi");
    el.textContent = URUNLER.filter(function (u) { return u.kategori === k; }).length;
  });
  urunVerisiEkle();
}

/* Google için ürün ve fiyat bilgisi (schema.org Product) */
function urunVerisiEkle() {
  if (document.getElementById("urun-verisi")) return;
  var adres = "https://imamoglutarhana.com/";
  var veri = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "İmamoğlu Tarhana ürünleri",
    "itemListElement": URUNLER.map(function (u, i) {
      return {
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Product",
          "name": u.ad,
          "image": adres + "images/urunler/" + u.resim + ".jpg",
          "category": u.kategori === "tarhana" ? "Tarhana" : "Çerez",
          "brand": { "@type": "Brand", "name": "İmamoğlu Tarhana" },
          "offers": {
            "@type": "Offer",
            "price": u.fiyat,
            "priceCurrency": "TRY",
            "availability": satistaMi(u) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": adres + "#urunler",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": u.fiyat,
              "priceCurrency": "TRY",
              "referenceQuantity": { "@type": "QuantitativeValue", "value": 1, "unitCode": "KGM" }
            }
          }
        }
      };
    })
  };
  var betik = document.createElement("script");
  betik.type = "application/ld+json";
  betik.id = "urun-verisi";
  betik.textContent = JSON.stringify(veri);
  document.head.appendChild(betik);
}

/* Kartlarda "Sepete ekle" mi yoksa miktar kontrolü mü görüneceğini ayarlar */
function kartlariGuncelle() {
  var miktarlar = {};
  sepetSatirlari().forEach(function (s) { miktarlar[s.id] = s.gr; });
  document.querySelectorAll(".urun").forEach(function (kart) {
    var gr = miktarlar[kart.dataset.id] || 0;
    var ekle = kart.querySelector(".sepete-ekle");
    var kontrol = kart.querySelector(".adet");
    var ipucu = kart.querySelector(".adet-ipucu");
    if (!kontrol) return;
    var girdi = kontrol.querySelector(".miktar-girdi");
    ekle.hidden = gr > 0;
    kontrol.hidden = gr === 0;
    ipucu.hidden = gr === 0;
    kart.classList.toggle("sepette", gr > 0);
    if (gr > 0 && document.activeElement !== girdi) girdi.value = kgSayisi(gr);
  });
}

/* Üstteki sepet simgesi ve alttaki sepet çubuğu */
function sayaciGuncelle() {
  var satirlar = sepetSatirlari();
  var adet = satirlar.length;
  document.querySelectorAll(".sepet-sayac").forEach(function (s) {
    s.textContent = adet;
    s.hidden = adet === 0;
  });
  document.querySelectorAll(".sepet-link").forEach(function (a) {
    a.setAttribute("aria-label", adet ? "Sepetim, " + adet + " ürün" : "Sepetim, boş");
  });
  var bar = document.getElementById("sepet-bar");
  if (bar) {
    document.getElementById("sepet-bar-adet").textContent = adet + " ürün";
    document.getElementById("sepet-bar-tutar").textContent = paraYaz(sepetToplami(satirlar));
    bar.hidden = adet === 0;
    document.body.classList.toggle("bar-acik", adet > 0);
  }
}

/* ---------- 4. Sepet sayfası ---------- */
function kargoDurumunuGuncelle(toplam) {
  var yazi = document.getElementById("kargo-yazi");
  var cubuk = document.getElementById("kargo-cubuk");
  if (!yazi || !cubuk) return;
  if (toplam >= SITE.ucretsizKargo) {
    yazi.textContent = "Siparişiniz ücretsiz kargo kapsamında.";
  } else {
    yazi.textContent = "Ücretsiz kargo için " + paraYaz(SITE.ucretsizKargo - toplam) + " daha ürün ekleyebilirsiniz.";
  }
  cubuk.style.width = Math.min(100, (toplam / SITE.ucretsizKargo) * 100) + "%";
  cubuk.parentNode.classList.toggle("tamam", toplam >= SITE.ucretsizKargo);
}

function sepetiCiz() {
  var liste = document.getElementById("sepet-liste");
  if (!liste) return;

  var okunan = sepetiOku();
  var satirlar = okunan.satirlar;
  document.getElementById("sepet-bos").hidden = satirlar.length > 0;
  document.getElementById("sepet-dolu").hidden = satirlar.length === 0;

  var uyari = document.getElementById("sepet-uyari");
  var notlar = [];
  if (okunan.kaldirilanlar.length) {
    notlar.push(okunan.kaldirilanlar.join(", ") + " artık satışta olmadığı için sepetinizden çıkarıldı.");
  }
  if (satirlar.some(function (s) { return s.eskiFiyat !== undefined; })) {
    notlar.push("Sepetinizdeki bazı ürünlerin fiyatı güncellendi. Tutarlar güncel fiyatla hesaplandı.");
  }
  /* Uyarı bir kez gösterilir ve sayfa açık kaldıkça durur */
  if (notlar.length) {
    uyari.textContent = notlar.join(" ");
    uyari.hidden = false;
    sepetiKaydet(satirlar);
  }

  /* Ürünler aynıysa listeyi baştan çizmeden sadece sayıları güncelleriz;
     böylece tıklanan düğme ya da yazılan kutu odağını kaybetmez */
  var kimlikler = satirlar.map(function (s) { return s.id; }).join(",");
  if (liste.dataset.kimlikler === kimlikler && liste.children.length) {
    satirlar.forEach(function (s) {
      var girdi = liste.querySelector('.sepet-satir[data-id="' + s.id + '"] .miktar-girdi');
      if (girdi && document.activeElement !== girdi) girdi.value = kgSayisi(s.gr);
    });
    toplamiGuncelle(satirlar);
    return;
  }
  liste.dataset.kimlikler = kimlikler;

  liste.innerHTML = "";
  satirlar.forEach(function (s) {
    var u = s.urun;
    var li = elemanYap("li", "sepet-satir");
    li.dataset.id = u.id;

    var bilgi = elemanYap("div", "sepet-bilgi");
    bilgi.appendChild(elemanYap("strong", "", u.ad));
    var birim = elemanYap("span", "sepet-birim", paraYaz(u.fiyat) + " / kg");
    bilgi.appendChild(birim);
    if (s.eskiFiyat !== undefined) {
      bilgi.appendChild(elemanYap("span", "fiyat-degisti", "Eklediğinizde " + paraYaz(s.eskiFiyat) + " idi"));
    }
    bilgi.appendChild(elemanYap("span", "adet-ipucu", adimYazisi(u.adim)));

    var kontrol = miktarKontroluYap(u, s.gr);
    kontrol.querySelector(".adet-eksi").disabled = s.gr <= u.adim;

    var tutar = elemanYap("strong", "satir-tutar", paraYaz(tutarHesapla(u.fiyat, s.gr)));

    var sil = elemanYap("button", "satir-sil", "Kaldır");
    sil.type = "button";
    sil.setAttribute("aria-label", u.ad + " ürününü sepetten kaldır");
    sil.dataset.sil = u.id;

    li.append(resimYap(u, 160, false), bilgi, kontrol, tutar, sil);
    liste.appendChild(li);
  });

  toplamiGuncelle(satirlar);
}

function toplamiGuncelle(satirlar) {
  var toplam = sepetToplami(satirlar);
  var kutu = document.getElementById("toplam-tutar");
  if (kutu) kutu.textContent = paraYaz(toplam);
  var adet = document.getElementById("ozet-adet");
  if (adet) adet.textContent = satirlar.length + " ürün";
  satirlar.forEach(function (s) {
    var li = document.querySelector('.sepet-satir[data-id="' + s.id + '"]');
    if (!li) return;
    li.querySelector(".satir-tutar").textContent = paraYaz(tutarHesapla(s.urun.fiyat, s.gr));
    li.querySelector(".adet-eksi").disabled = s.gr <= s.urun.adim;
  });
  kargoDurumunuGuncelle(toplam);
}

/* ---------- 5. WhatsApp mesajı ---------- */
function mesajOlustur() {
  var satirlar = sepetSatirlari();
  var toplam = 0;
  var liste = satirlar.map(function (s) {
    var tutar = tutarHesapla(s.urun.fiyat, s.gr);
    toplam += tutar;
    return "- " + s.urun.ad + ": " + miktarYazisi(s.gr) + " x " + paraYaz(s.urun.fiyat) + "/kg = " + paraYaz(tutar);
  });

  var mesaj =
    "Merhaba, web sitenizden sipariş vermek istiyorum.\n\n" +
    "Siparişim:\n" + liste.join("\n") +
    "\n\nÜrün toplamı (kargo hariç): " + paraYaz(toplam) +
    "\n(Fiyatları ve kargo ücretini teyit edebilir misiniz?)";

  function al(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  var ad = al("musteri-ad");
  var adres = al("musteri-adres");
  var not = al("musteri-not");
  if (ad) mesaj += "\n\nAd Soyad: " + ad;
  if (adres) mesaj += "\nAdres: " + adres;
  if (not) mesaj += "\nNot: " + not;
  return mesaj;
}

function whatsappaGonder() {
  if (sepetSatirlari().length === 0) return;
  var onay = document.getElementById("kvkk-onay");
  if (onay && !onay.checked) return;
  var adres = "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(mesajOlustur());
  var pencere = window.open(adres, "_blank", "noopener");
  if (!pencere) window.location.href = adres;
}

/* ---------- Her şeyi senkron tutan yardımcı ---------- */
function hepsiniYenile() {
  kartlariGuncelle();
  sayaciGuncelle();
  sepetiCiz();
}

/* ---------- Tıklama, yazma ve klavye olayları ---------- */
document.addEventListener("click", function (olay) {
  var dugme = olay.target.closest("button");
  if (!dugme) return;

  if (dugme.dataset.sil) {
    var silinen = urunBul(dugme.dataset.sil);
    miktariYaz(dugme.dataset.sil, 0);
    if (silinen) duyur(silinen.ad + " sepetten kaldırıldı");
    var ilk = document.querySelector("#sepet-liste .miktar-girdi") || document.querySelector("#sepet-bos a");
    if (ilk) ilk.focus();
    return;
  }

  var kart = dugme.closest(".urun");
  var kontrol = dugme.closest(".adet");
  var id = kart ? kart.dataset.id : (kontrol ? kontrol.dataset.id : null);
  if (!id) return;
  var urun = urunBul(id);
  if (!urun) return;
  var gr = sepettekiGr(id);

  if (dugme.classList.contains("sepete-ekle")) {
    miktariYaz(id, urun.adim);
    duyur(urun.ad + " sepete eklendi, " + miktarYazisi(urun.adim));
    var arti = kart.querySelector(".adet-arti");
    if (arti) arti.focus();
  } else if (dugme.classList.contains("adet-arti")) {
    miktariYaz(id, gr + urun.adim);
    duyur(urun.ad + ", " + miktarYazisi(Math.min(gr + urun.adim, maksGr(urun.adim))));
  } else if (dugme.classList.contains("adet-eksi")) {
    var yeni = gr - urun.adim;
    if (!kart && yeni < urun.adim) return; /* Sepet sayfasında eksi ile silinmez, "Kaldır" kullanılır */
    miktariYaz(id, yeni < urun.adim ? 0 : yeni);
    if (yeni < urun.adim) {
      duyur(urun.ad + " sepetten çıkarıldı");
      var ekle = kart.querySelector(".sepete-ekle");
      if (ekle) ekle.focus();
    } else {
      duyur(urun.ad + ", " + miktarYazisi(yeni));
    }
  }
});

/* Miktar kutusuna sadece rakam ve tek bir virgül/nokta girilsin */
document.addEventListener("input", function (olay) {
  var girdi = olay.target;
  if (!girdi.classList || !girdi.classList.contains("miktar-girdi")) return;
  var v = girdi.value.replace(/[^\d.,]/g, "");
  var ilk = v.search(/[.,]/);
  if (ilk !== -1) v = v.slice(0, ilk + 1) + v.slice(ilk + 1).replace(/[.,]/g, "");
  girdi.value = v;
});

document.addEventListener("keydown", function (olay) {
  if (olay.key === "Enter" && olay.target.classList && olay.target.classList.contains("miktar-girdi")) {
    olay.target.blur();
  }
});

/* Kutudan çıkınca ya da Enter ile yazılan miktar kaydedilir.
   Adıma uymayan değer yukarı yuvarlanır ve kullanıcıya söylenir. */
document.addEventListener("change", function (olay) {
  var girdi = olay.target;
  if (!girdi.classList || !girdi.classList.contains("miktar-girdi")) return;
  var kontrol = girdi.closest(".adet");
  var urun = urunBul(kontrol.dataset.id);
  if (!urun) return;
  var eski = sepettekiGr(urun.id);
  var yazilan = girdi.value;
  var yeni = girileniOku(yazilan, eski, urun.adim);
  var yazilanGr = Math.round(parseFloat(String(yazilan).replace(",", ".")) * 1000);

  girdi.value = kgSayisi(yeni);
  miktariYaz(urun.id, yeni);

  var ipucu = kontrol.parentNode.querySelector(".adet-ipucu");
  if (yazilanGr > 0 && yazilanGr !== yeni) {
    var not = kgSayisi(yazilanGr) + " kg yazdınız, " + miktarYazisi(yeni) + " olarak ayarlandı (" + adimYazisi(urun.adim) + ").";
    if (ipucu) { ipucu.textContent = not; ipucu.classList.add("vurgu"); }
    duyur(not);
  } else if (ipucu) {
    ipucu.textContent = adimYazisi(urun.adim);
    ipucu.classList.remove("vurgu");
  }
});

/* ---------- 6. Menü, filtre ve diğerleri ---------- */
function menuyuKur() {
  var dugme = document.querySelector(".menu-dugme");
  var menu = document.getElementById("ana-menu");
  if (!dugme || !menu) return;
  function ayarla(acik) {
    menu.classList.toggle("acik", acik);
    dugme.setAttribute("aria-expanded", acik ? "true" : "false");
    dugme.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
  }
  dugme.addEventListener("click", function () { ayarla(!menu.classList.contains("acik")); });
  menu.addEventListener("click", function (o) { if (o.target.closest("a")) ayarla(false); });
  document.addEventListener("keydown", function (o) {
    if (o.key === "Escape" && menu.classList.contains("acik")) { ayarla(false); dugme.focus(); }
  });
  document.addEventListener("click", function (o) { if (!o.target.closest(".site-ust")) ayarla(false); });
}

/* Menüde bulunulan bölümü vurgula */
function aktifBolumuIzle() {
  if (!("IntersectionObserver" in window)) return;
  var baglantilar = {};
  document.querySelectorAll('#ana-menu a[href^="#"]').forEach(function (a) {
    baglantilar[a.getAttribute("href").slice(1)] = a;
  });
  var bolumler = Object.keys(baglantilar).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!bolumler.length) return;
  var gozlemci = new IntersectionObserver(function (kayitlar) {
    kayitlar.forEach(function (k) {
      if (!k.isIntersecting) return;
      Object.keys(baglantilar).forEach(function (id) {
        baglantilar[id].classList.remove("aktif");
        baglantilar[id].removeAttribute("aria-current");
      });
      baglantilar[k.target.id].classList.add("aktif");
      baglantilar[k.target.id].setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  bolumler.forEach(function (b) { gozlemci.observe(b); });
}

/* Ürün kategorisi filtresi */
function filtreyiKur() {
  var chipler = document.querySelectorAll(".chip[data-filtre]");
  chipler.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.filtre;
      chipler.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      document.querySelectorAll(".urun-grup[data-kategori]").forEach(function (g) {
        g.hidden = !(f === "tumu" || g.dataset.kategori === f);
      });
    });
  });
}

/* Sepet sayfası: onay kutusu, gönder ve boşalt düğmeleri */
function sepetSayfasiniKur() {
  var gonder = document.getElementById("whatsapp-gonder");
  var onay = document.getElementById("kvkk-onay");
  if (gonder) {
    gonder.addEventListener("click", whatsappaGonder);
    if (onay) {
      gonder.disabled = !onay.checked;
      onay.addEventListener("change", function () { gonder.disabled = !onay.checked; });
    }
  }

  var bosalt = document.getElementById("sepeti-bosalt");
  var soru = document.getElementById("bosalt-soru");
  if (bosalt && soru) {
    bosalt.addEventListener("click", function () {
      bosalt.hidden = true;
      soru.hidden = false;
      document.getElementById("bosalt-evet").focus();
    });
    document.getElementById("bosalt-vazgec").addEventListener("click", function () {
      soru.hidden = true;
      bosalt.hidden = false;
      bosalt.focus();
    });
    document.getElementById("bosalt-evet").addEventListener("click", function () {
      sepetiKaydet([]);
      soru.hidden = true;
      bosalt.hidden = false;
      hepsiniYenile();
      duyur("Sepet boşaltıldı");
      var bos = document.querySelector("#sepet-bos a");
      if (bos) bos.focus();
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  urunleriCiz();
  hepsiniYenile();
  menuyuKur();
  aktifBolumuIzle();
  filtreyiKur();
  sepetSayfasiniKur();
  document.querySelectorAll("[data-yil]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
});

/* Geri tuşuyla dönüldüğünde ya da başka sekmede sepet değiştiğinde güncel kalsın */
window.addEventListener("pageshow", function (o) { if (o.persisted) hepsiniYenile(); });
window.addEventListener("storage", function (o) { if (o.key === SEPET_ANAHTAR) hepsiniYenile(); });
