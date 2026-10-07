import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { businessHours, categories, galleryItems } from "./seed-data.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = resolve(serverDirectory, "data", "beautywerk.sqlite");

function tableColumns(database, tableName) {
  return new Set(database.prepare(`PRAGMA table_info(${tableName})`).all().map(({ name }) => name));
}

function addColumnIfMissing(database, tableName, columns, name, definition) {
  if (!columns.has(name)) database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
}

function seedCatalog(database) {
  if (database.prepare("SELECT COUNT(*) AS count FROM service_categories").get().count === 0) {
    const insertCategory = database.prepare(`
      INSERT INTO service_categories (slug, title_en, title_de, sort_order)
      VALUES (@slug, @titleEn, @titleDe, @sortOrder)
    `);
    const insertService = database.prepare(`
      INSERT INTO services (
        category_id, slug, title_en, title_de, description_en, description_de,
        duration_minutes, display_duration_minutes, approximate_duration,
        price_minor, compare_at_price_minor, price_note_en, price_note_de,
        booking_mode, sort_order
      ) VALUES (
        @categoryId, @slug, @titleEn, @titleDe, @descriptionEn, @descriptionDe,
        @durationMinutes, @displayDurationMinutes, @approximateDuration,
        @priceMinor, @compareAtPriceMinor, @priceNoteEn, @priceNoteDe,
        @bookingMode, @sortOrder
      )
    `);

    const insertAll = database.transaction(() => {
      categories.forEach((category, categoryIndex) => {
        const { lastInsertRowid: categoryId } = insertCategory.run({
          slug: category.slug,
          titleEn: category.title.en,
          titleDe: category.title.de,
          sortOrder: categoryIndex,
        });
        category.services.forEach((service, serviceIndex) => {
          insertService.run({
            categoryId,
            slug: service.slug,
            titleEn: service.title.en,
            titleDe: service.title.de,
            descriptionEn: service.description?.en || "",
            descriptionDe: service.description?.de || "",
            durationMinutes: service.durationMinutes ?? null,
            displayDurationMinutes: service.displayDurationMinutes ?? null,
            approximateDuration: service.approximateDuration ? 1 : 0,
            priceMinor: service.priceMinor ?? null,
            compareAtPriceMinor: service.compareAtPriceMinor ?? null,
            priceNoteEn: service.priceNote?.en || "",
            priceNoteDe: service.priceNote?.de || "",
            bookingMode: service.bookingMode || "appointment",
            sortOrder: serviceIndex,
          });
        });
      });
    });
    insertAll();
  }

  if (database.prepare("SELECT COUNT(*) AS count FROM gallery_items").get().count === 0) {
    const insertGalleryItem = database.prepare(`
      INSERT INTO gallery_items (
        image_url, layout_key, object_position, caption_en, caption_de,
        alt_en, alt_de, sort_order
      ) VALUES (
        @imageUrl, @layoutKey, @objectPosition, @captionEn, @captionDe,
        @altEn, @altDe, @sortOrder
      )
    `);
    const insertAll = database.transaction(() => {
      galleryItems.forEach((item, index) => insertGalleryItem.run({
        imageUrl: item.imageUrl,
        layoutKey: item.layoutKey,
        objectPosition: item.objectPosition,
        captionEn: item.caption.en,
        captionDe: item.caption.de,
        altEn: item.alt.en,
        altDe: item.alt.de,
        sortOrder: index,
      }));
    });
    insertAll();
  }

  if (database.prepare("SELECT COUNT(*) AS count FROM business_hours").get().count === 0) {
    const insertHours = database.prepare(`
      INSERT INTO business_hours (weekday, start_time, end_time)
      VALUES (@weekday, @startTime, @endTime)
    `);
    const insertAll = database.transaction(() => {
      businessHours.forEach((hours) => insertHours.run(hours));
    });
    insertAll();
  }
}

export function createDatabase(databasePath = process.env.DATABASE_PATH || defaultDatabasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title_en TEXT NOT NULL,
      title_de TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
      slug TEXT NOT NULL UNIQUE,
      title_en TEXT NOT NULL,
      title_de TEXT NOT NULL,
      description_en TEXT NOT NULL DEFAULT '',
      description_de TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
      display_duration_minutes INTEGER CHECK (display_duration_minutes IS NULL OR display_duration_minutes > 0),
      approximate_duration INTEGER NOT NULL DEFAULT 0 CHECK (approximate_duration IN (0, 1)),
      price_minor INTEGER CHECK (price_minor IS NULL OR price_minor >= 0),
      compare_at_price_minor INTEGER CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= 0),
      currency TEXT NOT NULL DEFAULT 'EUR',
      price_note_en TEXT NOT NULL DEFAULT '',
      price_note_de TEXT NOT NULL DEFAULT '',
      booking_mode TEXT NOT NULL DEFAULT 'appointment'
        CHECK (booking_mode IN ('appointment', 'consultation', 'unavailable')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      CHECK (start_time < end_time)
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      layout_key TEXT NOT NULL DEFAULT 'small',
      object_position TEXT NOT NULL DEFAULT 'center',
      caption_en TEXT NOT NULL DEFAULT '',
      caption_de TEXT NOT NULL DEFAULT '',
      alt_en TEXT NOT NULL DEFAULT '',
      alt_de TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE RESTRICT,
      service_name TEXT NOT NULL DEFAULT '',
      appointment_date TEXT,
      start_minute INTEGER,
      end_minute INTEGER,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'confirmed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (
        (start_minute IS NULL AND end_minute IS NULL)
        OR (start_minute BETWEEN 0 AND 1439 AND end_minute BETWEEN 1 AND 1440 AND start_minute < end_minute)
      )
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      quote TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      treatment TEXT NOT NULL DEFAULT '',
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'published', 'hidden')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const bookingColumns = tableColumns(database, "bookings");
  addColumnIfMissing(database, "bookings", bookingColumns, "service_id", "INTEGER REFERENCES services(id) ON DELETE RESTRICT");
  addColumnIfMissing(database, "bookings", bookingColumns, "service_name", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, "bookings", bookingColumns, "appointment_date", "TEXT");
  addColumnIfMissing(database, "bookings", bookingColumns, "start_minute", "INTEGER");
  addColumnIfMissing(database, "bookings", bookingColumns, "end_minute", "INTEGER");
  addColumnIfMissing(database, "bookings", bookingColumns, "message", "TEXT NOT NULL DEFAULT ''");
  database.exec("UPDATE bookings SET appointment_date = preferred_date WHERE appointment_date IS NULL");

  const reviewColumns = tableColumns(database, "reviews");
  addColumnIfMissing(database, "reviews", reviewColumns, "service_id", "INTEGER REFERENCES services(id) ON DELETE SET NULL");
  addColumnIfMissing(database, "reviews", reviewColumns, "status", "TEXT NOT NULL DEFAULT 'pending'");

  database.exec(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  const pendingUnmoderatedReviews = database.transaction(() => {
    const migration = "reviews-require-admin-approval";
    const applied = database.prepare("SELECT 1 FROM app_migrations WHERE name = ?").get(migration);
    if (applied) return;

    database.prepare("UPDATE reviews SET status = 'pending' WHERE status = 'published'").run();
    database.prepare("INSERT INTO app_migrations (name) VALUES (?)").run(migration);
  });
  pendingUnmoderatedReviews.immediate();

  database.exec(`
    CREATE INDEX IF NOT EXISTS services_category_order_idx
      ON services(category_id, sort_order);
    CREATE INDEX IF NOT EXISTS gallery_order_idx
      ON gallery_items(sort_order, id);
    CREATE INDEX IF NOT EXISTS bookings_schedule_idx
      ON bookings(appointment_date, start_minute, end_minute)
      WHERE appointment_date IS NOT NULL;
    CREATE INDEX IF NOT EXISTS bookings_created_at_idx
      ON bookings(created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS reviews_created_at_idx
      ON reviews(created_at DESC, id DESC);
  `);

  seedCatalog(database);
  return database;
}
