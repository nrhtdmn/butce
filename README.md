# DENGE — Akıllı Bütçe

Modern, Türkçe kişisel bütçe uygulaması. Gelir-gider takibi, kategori yönetimi, aylık bütçe limitleri, birikim hedefleri ve görsel raporlar.

**Canlı site:** [https://nrhtdmn.github.io/butce/](https://nrhtdmn.github.io/butce/)

PWA olarak ana ekrana eklenebilir; çevrimdışı çalışır.

## Özellikler

- **Özet paneli** — bakiye, gelir, gider, tasarruf oranı ve nakit akışı grafiği
- **Hareketler** — gelir/gider ekleme, düzenleme, silme, filtreleme
- **Kategoriler** — ikon ve renklerle özelleştirilebilir
- **Bütçeler** — kategori bazlı aylık limitler ve kullanım çubukları
- **Hedefler** — birikim hedefleri ve katkı ekleme
- **Raporlar** — pasta ve çubuk grafiklerle analiz
- **Ayarlar** — profil, para birimi, veri sıfırlama
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
