/* =========================================================
   Sepet sistemi
   - Fiyatlar kilogram başınadır.
   - Miktar gram olarak saklanır.
   - Tarhanalar 1 kg'lık adımlarla, çerezler 500 gr'lık adımlarla satılır
     (adım, ürün kutusundaki data-adim değerinden gelir).
   ========================================================= */
const SEPET_ANAHTAR = "imamoglu_sepet";
const WHATSAPP_NO = "905367849458";
const UCRETSIZ_KARGO = 6000;

/* ---------- Sepeti okuma ve kaydetme (tarayıcı hafızası) ---------- */
function sepetiOku() {
  try {
    const veri = JSON.parse(localStorage.getItem(SEPET_ANAHTAR));
    if (!Array.isArray(veri)) return [];
    return veri.map(function (u) {
      /* Eski sürümde miktar "kg" olarak saklanıyordu */
      if (typeof u.gr !== "number" && typeof u.kg === "number") u.gr = u.kg * 1000;
      u.adim = u.adim || 1000;
      /* Eski 100 gr'lık adımı 500 gr'a çevir */
      if (u.adim === 100) {
        u.adim = 500;
        u.gr = Math.ceil(u.gr / 500) * 500;
      }
      return u;
    }).filter(function (u) { return u.ad && u.gr > 0 && u.fiyat >= 0; });
  } catch (hata) {
    return [];
  }
}

function sepetiKaydet(sepet) {
  try {
    localStorage.setItem(SEPET_ANAHTAR, JSON.stringify(sepet));
  } catch (hata) {
    /* Tarayıcı kaydetmeye izin vermiyorsa sessizce devam et */
  }
}

/* ---------- Biçimleme ve hesap ---------- */
/* 1234567 -> "1.234.567 TL" (sadece düz nokta ve rakam; toLocaleString kullanılmaz) */
function paraYaz(sayi) {
  return String(Math.round(sayi)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " TL";
}

function tutarHesapla(urun) {
  return Math.round(urun.fiyat * urun.gr / 1000);
}

function maksGr(adim) {
  return adim >= 1000 ? 999000 : 50000;
}

/* Gram -> kg yazısı, Türkçe ondalık virgülle: 500 -> "0,5", 1500 -> "1,5", 3000 -> "3" */
function kgSayisi(gr) {
  return String(gr / 1000).replace(".", ",");
}

/* Mesaj ve listelerde: 1500 -> "1,5 kg" */
function miktarYazisi(gr) {
  return kgSayisi(gr) + " kg";
}

/* Miktar kutusunda gösterilen sayı (her zaman kg) */
function kutuDegeri(gr) {
  return kgSayisi(gr);
}

/* ---------- Küçük yardımcılar ---------- */
function elemanYap(etiket, sinif, yazi) {
  const el = document.createElement(etiket);
  if (sinif) el.className = sinif;
  if (yazi !== undefined) el.textContent = yazi;
  return el;
}

function miktarGirdisiMi(el) {
  return !!(el && el.classList && el.classList.contains("miktar-girdi"));
}

/* Yazılabilir miktar kutusu: [ 1,5 ] kg */
function miktarAlaniYap(ad, gr, adim) {
  const alan = elemanYap("label", "miktar-alan");
  const girdi = elemanYap("input", "miktar-girdi");
  girdi.type = "text";
  girdi.inputMode = "decimal";
  girdi.maxLength = 5;
  girdi.value = kutuDegeri(gr);
  girdi.dataset.adim = adim;
  girdi.setAttribute("aria-label", ad + " miktarı (kg)");
  alan.append(girdi, elemanYap("span", "", "kg"));
  return alan;
}

/* Kutuya yazılan kg değerini gram olarak okur (1,5 ve 1.5 ikisi de olur);
   adımın katına yukarı yuvarlar. Boş ya da 0 ise eski miktara döner. */
function girileniOku(girdi, eskiGr, adim) {
  const kg = parseFloat(String(girdi.value).replace(",", "."));
  if (!kg || kg <= 0) return eskiGr;
  const gr = Math.round(kg * 1000);
  const yuvarlanmis = Math.ceil(gr / adim) * adim;
  return Math.min(Math.max(yuvarlanmis, adim), maksGr(adim));
}

/* ---------- Üstteki sepet simgesindeki sayı ---------- */
function sayaciGuncelle() {
  const sepet = sepetiOku();
  const adet = sepet.length;
  const sayac = document.getElementById("sepet-sayac");
  if (sayac) { sayac.textContent = adet; sayac.hidden = adet === 0; }
  const bar = document.getElementById("sepet-bar");
  if (bar) {
    let toplam = 0;
    sepet.forEach(function (u) { toplam += tutarHesapla(u); });
    document.getElementById("sepet-bar-adet").textContent = adet + " ürün";
    document.getElementById("sepet-bar-tutar").textContent = paraYaz(toplam);
    bar.hidden = adet === 0;
  }
}

/* ---------- Ürün kutuları ---------- */
function urunBilgisi(kutu) {
  const ad = kutu.querySelector("h4").textContent.trim();
  const fiyatKutusu = kutu.querySelector(".fiyat");
  const fiyatYazisi = fiyatKutusu ? fiyatKutusu.textContent : "0";
  const fiyat = parseInt(fiyatYazisi.replace(/\D/g, ""), 10) || 0;
  const resim = kutu.querySelector("img").getAttribute("src");
  const adim = parseInt(kutu.dataset.adim, 10) || 1000;
  return { ad: ad, fiyat: fiyat, resim: resim, adim: adim };
}

/* Her kutuya "Sepete ekle" düğmesi ve gizli bir miktar kontrolü koyar */
function dugmeleriEkle() {
  document.querySelectorAll(".urun").forEach(function (kutu) {
    const bilgi = urunBilgisi(kutu);
    const ad = bilgi.ad;

    if (!kutu.querySelector(".sepete-ekle")) {
      const dugme = elemanYap("button", "sepete-ekle", "Sepete ekle");
      dugme.type = "button";
      kutu.appendChild(dugme);
    }

    if (!kutu.querySelector(".urun-adet")) {
      const kontrol = elemanYap("div", "urun-adet");
      kontrol.hidden = true;

      const eksi = elemanYap("button", "adet-eksi", "−");
      eksi.type = "button";
      eksi.setAttribute("aria-label", ad + " miktarını azalt");

      const arti = elemanYap("button", "adet-arti", "+");
      arti.type = "button";
      arti.setAttribute("aria-label", ad + " miktarını artır");

      kontrol.append(eksi, miktarAlaniYap(ad, bilgi.adim, bilgi.adim), arti);
      kutu.appendChild(kontrol);
    }
  });
}

/* Sepetteki duruma göre her kutuda doğru kontrolü gösterir */
function kutulariGuncelle() {
  const sepet = sepetiOku();

  document.querySelectorAll(".urun").forEach(function (kutu) {
    const bilgi = urunBilgisi(kutu);
    const urun = sepet.find(function (u) { return u.ad === bilgi.ad; });
    const dugme = kutu.querySelector(".sepete-ekle");
    const kontrol = kutu.querySelector(".urun-adet");
    if (!dugme || !kontrol) return;

    if (urun) {
      const girdi = kontrol.querySelector(".miktar-girdi");
      dugme.hidden = true;
      kontrol.hidden = false;
      if (document.activeElement !== girdi) girdi.value = kutuDegeri(urun.gr);
      kutu.classList.add("sepette");
    } else {
      dugme.hidden = false;
      kontrol.hidden = true;
      kutu.classList.remove("sepette");
    }
  });
}

/* yon: +1 bir adım ekler, -1 bir adım azaltır. Miktar bir adımın altına inerse ürün sepetten çıkar */
function miktariAyarla(kutu, yon) {
  const bilgi = urunBilgisi(kutu);
  const sepet = sepetiOku();
  const sira = sepet.findIndex(function (u) { return u.ad === bilgi.ad; });

  if (sira === -1) {
    if (yon > 0) {
      sepet.push({ ad: bilgi.ad, fiyat: bilgi.fiyat, resim: bilgi.resim, gr: bilgi.adim, adim: bilgi.adim });
    }
  } else {
    sepet[sira].gr += yon * bilgi.adim;
    if (sepet[sira].gr < bilgi.adim) {
      sepet.splice(sira, 1);
    } else {
      sepet[sira].gr = Math.min(sepet[sira].gr, maksGr(bilgi.adim));
    }
  }

  sepetiKaydet(sepet);
  kutulariGuncelle();
  sayaciGuncelle();
}

/* ---------- Tıklama, yazma ve klavye olayları ---------- */
document.addEventListener("click", function (olay) {
  const dugme = olay.target.closest("button");
  if (!dugme) return;
  const kutu = dugme.closest(".urun");
  if (!kutu) return;

  if (dugme.classList.contains("sepete-ekle")) {
    miktariAyarla(kutu, 1);
    const arti = kutu.querySelector(".adet-arti");
    if (arti) arti.focus();
  } else if (dugme.classList.contains("adet-arti")) {
    miktariAyarla(kutu, 1);
  } else if (dugme.classList.contains("adet-eksi")) {
    miktariAyarla(kutu, -1);
    const ekle = kutu.querySelector(".sepete-ekle");
    if (ekle && !ekle.hidden) ekle.focus();
  }
});

/* Miktar kutusuna sadece rakam ve tek bir virgül/nokta girilsin */
document.addEventListener("input", function (olay) {
  const girdi = olay.target;
  if (miktarGirdisiMi(girdi)) {
    let v = girdi.value.replace(/[^\d.,]/g, "");
    const ilk = v.search(/[.,]/);
    if (ilk !== -1) v = v.slice(0, ilk + 1) + v.slice(ilk + 1).replace(/[.,]/g, "");
    girdi.value = v;
  }
});

/* Enter'a basınca yazılan sayı kaydedilsin */
document.addEventListener("keydown", function (olay) {
  if (olay.key === "Enter" && miktarGirdisiMi(olay.target)) {
    olay.target.blur();
  }
});

/* Ürün kutusundaki miktar kutusu değişince (kutudan çıkınca ya da Enter ile) */
document.addEventListener("change", function (olay) {
  const girdi = olay.target;
  if (!miktarGirdisiMi(girdi)) return;

  const kutu = girdi.closest(".urun");
  if (!kutu) return; /* Sepet sayfasındaki kutuyu kendi dinleyicisi yönetir */

  const bilgi = urunBilgisi(kutu);
  const sepet = sepetiOku();
  const urun = sepet.find(function (u) { return u.ad === bilgi.ad; });
  if (!urun) return;

  urun.gr = girileniOku(girdi, urun.gr, bilgi.adim);
  sepetiKaydet(sepet);
  kutulariGuncelle();
  girdi.value = kutuDegeri(urun.gr);
  sayaciGuncelle();
});

/* ---------- Sepet sayfası ---------- */
function toplamiGuncelle(sepet) {
  const kutu = document.getElementById("toplam-tutar");
  if (!kutu) return;
  let toplam = 0;
  sepet.forEach(function (u) { toplam += tutarHesapla(u); });
  kutu.textContent = paraYaz(toplam);
  kargoDurumunuGuncelle(toplam);
}

function kargoDurumunuGuncelle(toplam) {
  const yazi = document.getElementById("kargo-yazi");
  const cubuk = document.getElementById("kargo-cubuk");
  if (!yazi || !cubuk) return;
  if (toplam >= UCRETSIZ_KARGO) {
    yazi.textContent = "Tebrikler, siparişiniz ücretsiz kargo kapsamında.";
  } else {
    yazi.textContent = "Ücretsiz kargo için " + paraYaz(UCRETSIZ_KARGO - toplam) + " daha ürün ekleyebilirsiniz.";
  }
  cubuk.style.width = Math.min(100, (toplam / UCRETSIZ_KARGO) * 100) + "%";
}

function miktarDegistir(sira, yon) {
  const sepet = sepetiOku();
  if (!sepet[sira]) return;
  const u = sepet[sira];
  u.gr = Math.min(Math.max(u.gr + yon * u.adim, u.adim), maksGr(u.adim));
  sepetiKaydet(sepet);
  sepetiCiz();
  sayaciGuncelle();
}

function urunuSil(sira) {
  const sepet = sepetiOku();
  sepet.splice(sira, 1);
  sepetiKaydet(sepet);
  sepetiCiz();
  sayaciGuncelle();
}

function sepetiCiz() {
  const liste = document.getElementById("sepet-liste");
  if (!liste) return; /* Bu sayfa sepet sayfası değil */

  const sepet = sepetiOku();
  document.getElementById("sepet-bos").hidden = sepet.length > 0;
  document.getElementById("sepet-dolu").hidden = sepet.length === 0;

  liste.innerHTML = "";

  sepet.forEach(function (urun, sira) {
    const satir = elemanYap("li", "sepet-satir");

    const resim = elemanYap("img");
    resim.src = urun.resim;
    resim.alt = urun.ad;

    const bilgi = elemanYap("div", "sepet-bilgi");
    bilgi.appendChild(elemanYap("strong", "", urun.ad));
    bilgi.appendChild(elemanYap("span", "", paraYaz(urun.fiyat) + " / kg"));

    const adet = elemanYap("div", "sepet-adet");

    const eksi = elemanYap("button", "", "−");
    eksi.type = "button";
    eksi.setAttribute("aria-label", urun.ad + " miktarını azalt");
    eksi.disabled = urun.gr <= urun.adim;
    eksi.addEventListener("click", function () { miktarDegistir(sira, -1); });

    const arti = elemanYap("button", "", "+");
    arti.type = "button";
    arti.setAttribute("aria-label", urun.ad + " miktarını artır");
    arti.addEventListener("click", function () { miktarDegistir(sira, 1); });

    const alan = miktarAlaniYap(urun.ad, urun.gr, urun.adim);
    const girdi = alan.querySelector("input");

    adet.append(eksi, alan, arti);

    const tutar = elemanYap("strong", "satir-tutar", paraYaz(tutarHesapla(urun)));

    /* Yazılan miktar kaydedilir; listeyi baştan çizmeyiz ki tıklama kaybolmasın */
    girdi.addEventListener("change", function () {
      const guncel = sepetiOku();
      if (!guncel[sira]) return;
      guncel[sira].gr = girileniOku(girdi, guncel[sira].gr, guncel[sira].adim);
      sepetiKaydet(guncel);
      girdi.value = kutuDegeri(guncel[sira].gr);
      eksi.disabled = guncel[sira].gr <= guncel[sira].adim;
      tutar.textContent = paraYaz(tutarHesapla(guncel[sira]));
      toplamiGuncelle(guncel);
      sayaciGuncelle();
    });

    const sil = elemanYap("button", "satir-sil", "Kaldır");
    sil.type = "button";
    sil.addEventListener("click", function () { urunuSil(sira); });

    satir.append(resim, bilgi, adet, tutar, sil);
    liste.appendChild(satir);
  });

  toplamiGuncelle(sepet);
}

/* ---------- WhatsApp mesajı ---------- */
function mesajOlustur() {
  const sepet = sepetiOku();
  let toplam = 0;

  const satirlar = sepet.map(function (u) {
    const tutar = tutarHesapla(u);
    toplam += tutar;
    return "- " + u.ad + ": " + miktarYazisi(u.gr) + " x " + paraYaz(u.fiyat) + "/kg = " + paraYaz(tutar);
  });

  let mesaj =
    "Merhaba, web sitenizden sipariş vermek istiyorum.\n\n" +
    "Siparişim:\n" + satirlar.join("\n") +
    "\n\nÜrün toplamı (kargo hariç): " + paraYaz(toplam) +
    "\n(Fiyatları ve kargo ücretini teyit edebilir misiniz?)";

  const al = function (id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };
  const ad = al("musteri-ad");
  const adres = al("musteri-adres");
  const not = al("musteri-not");

  if (ad) mesaj += "\n\nAd Soyad: " + ad;
  if (adres) mesaj += "\nAdres: " + adres;
  if (not) mesaj += "\nNot: " + not;

  return mesaj;
}

function whatsappaGonder() {
  if (sepetiOku().length === 0) return;
  const onay = document.getElementById("kvkk-checkbox");
  if (onay && !onay.checked) return;
  const adres = "https://wa.me/" + WHATSAPP_NO + "?text=" + encodeURIComponent(mesajOlustur());
  window.open(adres, "_blank", "noopener");
}

/* ---------- Her şeyi senkron tutan yardımcı ---------- */
function hepsiniYenile() {
  kutulariGuncelle();
  sayaciGuncelle();
  sepetiCiz();
}

/* ---------- Sayfa açılınca çalışanlar ---------- */
document.addEventListener("DOMContentLoaded", function () {
  dugmeleriEkle();
  hepsiniYenile();

  const gonder = document.getElementById("whatsapp-gonder");
  if (gonder) gonder.addEventListener("click", whatsappaGonder);

  const bosalt = document.getElementById("sepeti-bosalt");
  if (bosalt) {
    bosalt.addEventListener("click", function () {
      if (confirm("Sepetteki tüm ürünler silinsin mi?")) {
        sepetiKaydet([]);
        hepsiniYenile();
      }
    });
  }
});

/* Geri tuşuyla dönüldüğünde ya da başka sekmede sepet değiştiğinde güncel kalsın */
window.addEventListener("pageshow", hepsiniYenile);
window.addEventListener("storage", hepsiniYenile);

/* ---------- Onay kutusu: işaretlenmeden WhatsApp düğmesi çalışmaz ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const onay = document.getElementById("kvkk-checkbox");
  const dugme = document.getElementById("whatsapp-gonder");
  if (!onay || !dugme) return;
  dugme.disabled = !onay.checked;
  onay.addEventListener("change", function () { dugme.disabled = !onay.checked; });
});

/* ---------- Mobil menü ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const dugme = document.querySelector(".menu-dugme");
  const menu = document.getElementById("ana-menu");
  if (!dugme || !menu) return;

  function ayarla(acik) {
    menu.classList.toggle("acik", acik);
    dugme.setAttribute("aria-expanded", acik ? "true" : "false");
    dugme.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
  }
  dugme.addEventListener("click", function () { ayarla(!menu.classList.contains("acik")); });
  menu.addEventListener("click", function (o) { if (o.target.closest("a")) ayarla(false); });
  document.addEventListener("keydown", function (o) { if (o.key === "Escape") ayarla(false); });
  document.addEventListener("click", function (o) {
    if (!o.target.closest(".ana-serit")) ayarla(false);
  });
});

/* ---------- Menüde bulunulan bölümü vurgula ---------- */
document.addEventListener("DOMContentLoaded", function () {
  if (!("IntersectionObserver" in window)) return;
  const baglantilar = {};
  document.querySelectorAll('nav a[href*="#"]').forEach(function (a) {
    baglantilar[a.getAttribute("href").split("#")[1]] = a;
  });
  const bolumler = Object.keys(baglantilar)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!bolumler.length) return;

  const gozlemci = new IntersectionObserver(function (kayitlar) {
    kayitlar.forEach(function (k) {
      if (!k.isIntersecting) return;
      Object.keys(baglantilar).forEach(function (id) { baglantilar[id].classList.remove("aktif"); });
      baglantilar[k.target.id].classList.add("aktif");
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  bolumler.forEach(function (b) { gozlemci.observe(b); });
});

/* ---------- Tanıtım görsel slaytı ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const slaytlar = document.querySelectorAll(".tanitim-slayt-kapsayici .slayt-resim");
  if (slaytlar.length <= 1) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let sira = 0;
  setInterval(function () {
    slaytlar[sira].classList.remove("aktif");
    sira = (sira + 1) % slaytlar.length;
    slaytlar[sira].classList.add("aktif");
  }, 3500);
});

// Kategori filtresi
(function () {
  const chipler = document.querySelectorAll(".chip[data-filtre]");
  if (!chipler.length) return;
  chipler.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const f = chip.dataset.filtre;
      chipler.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      document.querySelectorAll(".urun-grup[data-kategori]").forEach(function (g) {
        g.hidden = !(f === "tumu" || g.dataset.kategori === f);
      });
    });
  });
})();
