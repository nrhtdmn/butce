# DENGE — Akıllı Bütçe

Modern, Türkçe kişisel bütçe uygulaması. Gelir-gider takibi, kategori yönetimi, aylık bütçe limitleri, birikim hedefleri ve görsel raporlar.

**Canlı site:** [https://nrhtdmn.github.io/butce/](https://nrhtdmn.github.io/butce/)

PWA olarak ana ekrana eklenebilir; çevrimdışı çalışır.

## Özellikler

- **Özet paneli** — bakiye, net varlık, borç/alacak/taksit özeti, tavsiyeler
- **Hareketler** — gelir/gider ekleme, düzenleme, silme, filtreleme
- **Kategoriler** — ikon ve renklerle özelleştirilebilir
- **Bütçeler** — kategori bazlı aylık limitler ve kullanım çubukları
- **Hedefler** — birikim hedefleri ve katkı ekleme
- **Borçlar** — kredi/kişi borçları, ödeme takibi
- **Alacaklar** — tahsilat takibi
- **Taksitler** — aylık taksit planları
- **Tavsiyeler** — verilere göre kişiselleştirilmiş ekonomi önerileri
- **Raporlar** — pasta ve çubuk grafiklerle analiz
- **Ayarlar** — profil, para birimi, JSON yedek (dışa/içe aktar), veri sıfırlama
- Veriler **localStorage**'da saklanır (sunucu gerekmez)

## Kurulum

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Teknoloji

- React 19 + TypeScript + Vite
- Recharts (grafikler)
- Framer Motion (animasyonlar)
- Lucide React (ikonlar)

## Yapımcı

[Nurhat DUMAN](https://www.instagram.com/nurhatduman/) tarafından üretilmiştir.

## Lisans

MIT
