export const categories = [
  {
    slug: "skin-analysis",
    title: { en: "Skin analysis & consultation", de: "Hautanalyse & Beratung" },
    services: [
      {
        slug: "skin-id-soft-fx",
        title: { en: "Skin ID Soft FX", de: "Skin ID Soft FX" },
        description: {
          en: "AI-supported skin analysis with insights into skin condition, pores and hydration, plus a personal treatment plan and product recommendations.",
          de: "KI-gestützte Hautanalyse mit Einblicken in Hautzustand, Poren und Feuchtigkeit, inklusive individuellem Behandlungsplan und Produktempfehlungen.",
        },
        durationMinutes: 30, approximateDuration: true, priceMinor: 4900,
      },
    ],
  },
  {
    slug: "hydra-facials",
    title: { en: "Hydra facials", de: "Hydra Facials" },
    services: [
      { slug: "fresh-glow", title: { en: "Fresh Glow", de: "Fresh Glow" }, description: { en: "Gentle Hydra-Dermabrasion, hydration and finishing care.", de: "Sanfte Hydra-Dermabrasion, Feuchtigkeit und Abschlusspflege." }, durationMinutes: 45, priceMinor: 8900 },
      { slug: "deep-clean", title: { en: "Deep Clean", de: "Deep Clean" }, description: { en: "Intensive cleansing, extractions as needed and LED.", de: "Intensive Reinigung, Ausreinigung nach Bedarf und LED." }, durationMinutes: 60, priceMinor: 11900 },
      { slug: "glass-skin", title: { en: "Glass Skin", de: "Glass Skin" }, description: { en: "Active ingredients, oxygen, LED and a glow mask.", de: "Wirkstoffversorgung, Oxygen, LED und Glow-Maske." }, durationMinutes: 60, priceMinor: 12900 },
      { slug: "age-reverse", title: { en: "Age Reverse", de: "Age Reverse" }, description: { en: "Hydra treatment, anti-aging actives, red LED light and a mask.", de: "Hydra-Treatment, Anti-Aging-Wirkstoffe, rotes LED-Licht und Maske." }, durationMinutes: 75, priceMinor: 14900 },
      { slug: "beautywerk-signature", title: { en: "BeautyWerk Signature", de: "BeautyWerk Signature" }, description: { en: "Face, neck and décolleté with intensive care and a premium finish.", de: "Gesicht, Hals und Dekolleté mit intensiver Pflege und Premium-Finish." }, durationMinutes: 90, priceMinor: 17900 },
    ],
  },
  {
    slug: "microneedling",
    title: { en: "Microneedling", de: "Microneedling" },
    services: [
      { slug: "microneedling-classic", title: { en: "Microneedling Classic", de: "Microneedling Classic" }, description: { en: "Face, a base active ingredient and soothing finishing care. Performed with the Dr. Pen M9 and suitable sterile active solutions.", de: "Gesicht, Basis-Wirkstoff und beruhigende Abschlusspflege. Mit dem Dr. Pen M9 und geeigneten sterilen Wirkstofflösungen." }, durationMinutes: 60, priceMinor: 12900 },
      { slug: "microneedling-deluxe", title: { en: "Microneedling Deluxe", de: "Microneedling Deluxe" }, description: { en: "Face, neck and décolleté with a premium active ingredient, mask and LED aftercare. Performed with the Dr. Pen M9 and suitable sterile active solutions.", de: "Gesicht, Hals und Dekolleté mit Premium-Wirkstoff, Maske und LED-Nachbehandlung. Mit dem Dr. Pen M9 und geeigneten sterilen Wirkstofflösungen." }, durationMinutes: 80, displayDurationMinutes: 75, priceMinor: 16900 },
      { slug: "scars-stretch-marks", title: { en: "Scars & stretch marks", de: "Narben & Dehnungsstreifen" }, description: { en: "Individual treatment tailored to the area and size.", de: "Individuelle Behandlung je nach Areal und Größe." }, priceNote: { en: "PRICE BY AREA", de: "PREIS NACH AREAL" }, bookingMode: "consultation" },
    ],
  },
  {
    slug: "fruit-acid-renewal",
    title: { en: "Fruit acid skin renewal", de: "Fruchtsäure Skin Renewal" },
    services: [
      { slug: "skin-renewal-peel", title: { en: "Skin Renewal Peel", de: "Skin Renewal Peel" }, description: { en: "A cosmetic AHA/BHA/PHA fruit-acid peel selected for your skin condition and peel system, for a more refined-looking skin texture. Includes cleansing, skin assessment, peel, neutralization, soothing mask, finishing care and sun protection.", de: "Individuell abgestimmtes kosmetisches AHA/BHA/PHA-Peeling je nach Hautzustand und Peeling-System zur optischen Verfeinerung der Hautstruktur. Inklusive Reinigung, Hautbeurteilung, Peeling, Neutralisation, beruhigender Maske, Abschlusspflege und Lichtschutz." }, durationMinutes: 60, approximateDuration: true, priceMinor: 9900 },
      { slug: "skin-renewal-course-3", title: { en: "3-session Skin Renewal course", de: "3er Skin Renewal Kur" }, description: { en: "Three Skin Renewal Peel treatments.", de: "Drei Skin Renewal Peel Behandlungen." }, durationMinutes: 60, priceMinor: 27900, priceNote: { en: "3 SESSIONS", de: "3 BEHANDLUNGEN" }, bookingMode: "appointment" },
      { slug: "skin-renewal-course-5", title: { en: "5-session Skin Renewal course", de: "5er Skin Renewal Kur" }, description: { en: "Five Skin Renewal Peel treatments.", de: "Fünf Skin Renewal Peel Behandlungen." }, durationMinutes: 60, priceMinor: 44900, priceNote: { en: "5 SESSIONS", de: "5 BEHANDLUNGEN" }, bookingMode: "appointment" },
    ],
  },
  {
    slug: "courses-bundles",
    title: { en: "Courses & treatment bundles", de: "Kuren & Behandlungspakete" },
    services: [
      { slug: "microneedling-classic-course-3", title: { en: "Microneedling Classic · 3-session course", de: "Microneedling Classic · 3er Kur" }, description: { en: "Three Microneedling Classic treatments. Course price: 349 € instead of 387 €.", de: "Drei Microneedling Classic Behandlungen. Kurpreis: 349 € statt 387 €." }, durationMinutes: 60, priceMinor: 34900, compareAtPriceMinor: 38700, priceNote: { en: "SAVE 38 €", de: "38 € ERSPARNIS" } },
      { slug: "microneedling-classic-course-5", title: { en: "Microneedling Classic · 5-session course", de: "Microneedling Classic · 5er Kur" }, description: { en: "Five Microneedling Classic treatments. Course price: 579 € instead of 645 €.", de: "Fünf Microneedling Classic Behandlungen. Kurpreis: 579 € statt 645 €." }, durationMinutes: 60, priceMinor: 57900, compareAtPriceMinor: 64500, priceNote: { en: "SAVE 66 €", de: "66 € ERSPARNIS" } },
      { slug: "beautywerk-skin-reset", title: { en: "Beautywerk Skin Reset", de: "Beautywerk Skin Reset" }, description: { en: "One Hydra Deep Clean, three Microneedling Classic treatments and a Skin ID Soft FX analysis for before-and-after comparison.", de: "1 × Hydra Deep Clean, 3 × Microneedling Classic und eine Skin ID Soft FX Hautanalyse für den Vorher-Nachher-Vergleich." }, priceMinor: 49900, compareAtPriceMinor: 55500, priceNote: { en: "BUNDLE", de: "PAKET" }, bookingMode: "consultation" },
    ],
  },
  {
    slug: "active-ingredient-concepts",
    title: { en: "Active ingredient concepts", de: "Wirkstoffkonzepte" },
    services: [
      { slug: "hydra-boost", title: { en: "Hydra Boost", de: "Hydra Boost" }, description: { en: "Hydration, a plumper-looking complexion and more glow.", de: "Feuchtigkeit, ein pralleres Hautbild und mehr Glow." }, priceNote: { en: "PERSONALIZED", de: "INDIVIDUELL" }, bookingMode: "consultation" },
      { slug: "age-repair", title: { en: "Age Repair", de: "Age Repair" }, description: { en: "Skin texture, elasticity and the look of fine lines.", de: "Hautstruktur, Elastizität und feine Linien." }, priceNote: { en: "PERSONALIZED", de: "INDIVIDUELL" }, bookingMode: "consultation" },
      { slug: "skin-refine", title: { en: "Skin Refine", de: "Skin Refine" }, description: { en: "Refined-looking texture, a more even-looking complexion and clarity.", de: "Verfeinerte Hautstruktur, ebenmäßiger Teint und ein klareres Erscheinungsbild." }, priceNote: { en: "PERSONALIZED", de: "INDIVIDUELL" }, bookingMode: "consultation" },
    ],
  },
  {
    slug: "add-ons",
    title: { en: "Add-ons", de: "Add-ons" },
    services: [
      { slug: "led-light-therapy", title: { en: "LED light therapy", de: "LED-Lichttherapie" }, description: { en: "20 minutes.", de: "20 Minuten." }, durationMinutes: 20, priceMinor: 2500 },
      { slug: "facial-lymphatic-drainage", title: { en: "Facial lymphatic drainage", de: "Lymphdrainage Gesicht" }, description: { en: "15 minutes.", de: "15 Minuten." }, durationMinutes: 15, priceMinor: 2000 },
      { slug: "active-ingredient-ampoule", title: { en: "Active ingredient ampoule", de: "Wirkstoff-Ampulle" }, priceMinor: 1500, bookingMode: "consultation" },
      { slug: "soothing-mask", title: { en: "Soothing mask", de: "Beruhigende Maske" }, priceMinor: 1500, bookingMode: "consultation" },
      { slug: "eye-treatment", title: { en: "Eye treatment", de: "Augenbehandlung" }, priceMinor: 1500, bookingMode: "consultation" },
      { slug: "neck-decollete", title: { en: "Neck & décolleté", de: "Hals & Dekolleté" }, priceMinor: 2000, bookingMode: "consultation" },
    ],
  },
];

export const galleryItems = [
  {
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85",
    layoutKey: "large", objectPosition: "center",
    caption: { en: "Skin ritual", de: "Hautritual" },
    alt: { en: "Skincare cream and glass jar", de: "Hautpflegecreme und Glasgefäß" },
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85",
    layoutKey: "tall", objectPosition: "center",
    caption: { en: "Pure texture", de: "Reine Textur" },
    alt: { en: "Skincare bottles and botanical leaves", de: "Hautpflegeflaschen und botanische Blätter" },
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=85",
    layoutKey: "small", objectPosition: "center",
    caption: { en: "Soft light", de: "Sanftes Licht" },
    alt: { en: "Minimal skincare bottle", de: "Minimalistische Hautpflegeflasche" },
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=85",
    layoutKey: "wide", objectPosition: "center",
    caption: { en: "Daily care", de: "Tägliche Pflege" },
    alt: { en: "Skincare product in warm light", de: "Hautpflegeprodukt im warmen Licht" },
  },
];

export const businessHours = [
  { weekday: 1, startTime: "09:00", endTime: "17:00" },
  { weekday: 2, startTime: "09:00", endTime: "17:00" },
  { weekday: 3, startTime: "09:00", endTime: "17:00" },
  { weekday: 4, startTime: "09:00", endTime: "17:00" },
  { weekday: 5, startTime: "09:00", endTime: "17:00" },
];
