/* =========================================================
   Ürün listesi ve site ayarları
   Fiyatı, ürünü ya da kargo sınırını değiştirmek için
   sadece bu dosyayı düzenlemeniz yeterli. Ana sayfadaki kartlar,
   sepet ve WhatsApp mesajı fiyatı her zaman buradan okur.

   Alanlar:
     id        Değişmeyen kısa ad (sepet bu adla eşleşir; değiştirmeyin)
     ad        Sitede görünen ürün adı
     kategori  "tarhana" ya da "cerez"
     fiyat     1 kg fiyatı (TL)
     adim      Satış adımı, gram: tarhana 1000, çerez 500
     resim     images/urunler/ içindeki dosya adı (uzantısız; .webp ve .jpg ikisi de olmalı)
     alt       Görselin açıklaması
     etiket    (isteğe bağlı) Kartın köşesindeki kısa not
     satista   false yapılırsa kart "Şu an satışta değil" görünür, sepete eklenemez
   ========================================================= */
var SITE = {
  whatsapp: "905367849458",
  telefonYazi: "0536 784 94 58",
  ucretsizKargo: 6000
};

var URUNLER = [
  { id: "yoresel-tarhana", ad: "Yöresel Tarhana", kategori: "tarhana", fiyat: 300, adim: 1000, resim: "yoresel-tarhana", alt: "Gümüş kâsede kırılmış yöresel Maraş tarhanası" },
  { id: "bademli-tarhana", ad: "Bademli Tarhana", kategori: "tarhana", fiyat: 750, adim: 1000, resim: "bademli-tarhana", alt: "Bademli tarhana tabakaları" },
  { id: "biberli-tarhana", ad: "Biberli Tarhana", kategori: "tarhana", fiyat: 400, adim: 1000, resim: "biberli-tarhana", alt: "Biberli tarhana" },
  { id: "bol-yogurtlu-tarhana", ad: "Bol Yoğurtlu Tarhana", kategori: "tarhana", fiyat: 350, adim: 1000, resim: "bol-yogurtlu-tarhana", alt: "Bol yoğurtlu tarhana" },
  { id: "ince-tarhana", ad: "İnce Tarhana", kategori: "tarhana", fiyat: 350, adim: 1000, resim: "ince-tarhana", alt: "İnce açılmış tarhana tabakaları" },
  { id: "kizartilmis-tarhana", ad: "Kızartılmış Tarhana", kategori: "tarhana", fiyat: 400, adim: 1000, resim: "kizartilmis-tarhana", alt: "Kızartılmış tarhana" },
  { id: "firik", ad: "Firik", kategori: "tarhana", fiyat: 250, adim: 1000, resim: "firik", alt: "Firik", etiket: "Sadece yaz aylarında" },
  { id: "corbalik-tarhana", ad: "Çorbalık Tarhana", kategori: "tarhana", fiyat: 120, adim: 1000, resim: "corbalik-tarhana", alt: "Çorbalık tarhana" },

  { id: "badem-tuzlu", ad: "Badem (Tuzlu)", kategori: "cerez", fiyat: 850, adim: 500, resim: "badem", alt: "Tuzlu badem" },
  { id: "badem-tuzsuz", ad: "Badem (Tuzsuz)", kategori: "cerez", fiyat: 850, adim: 500, resim: "badem", alt: "Tuzsuz badem" },
  { id: "kaju", ad: "Kaju", kategori: "cerez", fiyat: 800, adim: 500, resim: "kaju", alt: "Kâsede kaju" },
  { id: "findik-ici", ad: "Fındık İçi", kategori: "cerez", fiyat: 1000, adim: 500, resim: "findik", alt: "Fındık içi" },
  { id: "tuzlu-cekirdek", ad: "Tuzlu Çekirdek", kategori: "cerez", fiyat: 200, adim: 500, resim: "tuzlu-cekirdek", alt: "Tuzlu ay çekirdeği" },
  { id: "tuzsuz-cekirdek", ad: "Tuzsuz Çekirdek", kategori: "cerez", fiyat: 200, adim: 500, resim: "tuzsuz-cekirdek", alt: "Tuzsuz ay çekirdeği" },
  { id: "kabak-cekirdegi-tuzlu", ad: "Kabak Çekirdeği (Tuzlu)", kategori: "cerez", fiyat: 400, adim: 500, resim: "kabak-tuzlu", alt: "Tuzlu kabak çekirdeği" },
  { id: "kabak-cekirdegi-tuzsuz", ad: "Kabak Çekirdeği (Tuzsuz)", kategori: "cerez", fiyat: 400, adim: 500, resim: "kabak-tuzsuz", alt: "Tuzsuz kabak çekirdeği" },
  { id: "antep-fistigi", ad: "Antep Fıstığı", kategori: "cerez", fiyat: 1400, adim: 500, resim: "antep-fistigi", alt: "Antep fıstığı" },
  { id: "tuzlu-fistik", ad: "Tuzlu Fıstık", kategori: "cerez", fiyat: 300, adim: 500, resim: "tuzlu-fistik", alt: "Tuzlu yer fıstığı" },
  { id: "fistik-soslu-misir", ad: "Fıstık Soslu Mısır", kategori: "cerez", fiyat: 200, adim: 500, resim: "fistik-soslu-misir", alt: "Fıstık soslu mısır" },
  { id: "nohut-seker", ad: "Nohut Şeker", kategori: "cerez", fiyat: 200, adim: 500, resim: "nohut-seker", alt: "Nohut şeker" },
  { id: "leblebi", ad: "Leblebi", kategori: "cerez", fiyat: 200, adim: 500, resim: "leblebi", alt: "Leblebi" },
  { id: "luks-karisik", ad: "Lüks Karışık", kategori: "cerez", fiyat: 1100, adim: 500, resim: "luks-karisik", alt: "Lüks karışık çerez" },
  { id: "karisik-cerez", ad: "Karışık Çerez", kategori: "cerez", fiyat: 300, adim: 500, resim: "karisik", alt: "Karışık çerez" }
];
