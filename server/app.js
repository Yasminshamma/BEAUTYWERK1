import express from "express";
import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./database.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const allowedStatuses = new Set(["requested", "confirmed", "cancelled"]);

function requiredText(value, field, maxLength) {
  if (typeof value !== "string") return `${field} is required.`;
  const normalized = value.trim();
  if (!normalized) return `${field} is required.`;
  if (normalized.length > maxLength) return `${field} must be at most ${maxLength} characters.`;
  return null;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return `${field} must be text.`;
  if (value.trim().length > maxLength) return `${field} must be at most ${maxLength} characters.`;
  return null;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localDateToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(value) {
  if (!timePattern.test(value || "")) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function serviceRecord(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    title: { en: row.title_en, de: row.title_de },
    description: { en: row.description_en, de: row.description_de },
    durationMinutes: row.duration_minutes,
    displayDurationMinutes: row.display_duration_minutes,
    approximateDuration: Boolean(row.approximate_duration),
    priceMinor: row.price_minor,
    compareAtPriceMinor: row.compare_at_price_minor,
    currency: row.currency,
    priceNote: { en: row.price_note_en, de: row.price_note_de },
    bookingMode: row.booking_mode,
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    bookable: Boolean(row.is_active) && row.booking_mode === "appointment" && row.duration_minutes > 0,
  };
}

function categoryRecord(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: { en: row.title_en, de: row.title_de },
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
    services: row.services || [],
  };
}

function getAvailability(database, date, serviceId) {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const service = database.prepare(`
    SELECT id, duration_minutes, booking_mode, is_active
    FROM services WHERE id = ?
  `).get(serviceId);
  if (!service || !service.is_active || service.booking_mode !== "appointment" || !service.duration_minutes) {
    return { error: "Choose an available treatment." };
  }

  const hours = database.prepare(`
    SELECT start_time AS startTime, end_time AS endTime
    FROM business_hours WHERE weekday = ?
    ORDER BY start_time
  `).all(weekday);
  if (!hours.length) return { slots: [] };

  const occupied = database.prepare(`
    SELECT start_minute AS startMinute, end_minute AS endMinute
    FROM bookings
    WHERE appointment_date = ? AND status != 'cancelled'
      AND start_minute IS NOT NULL AND end_minute IS NOT NULL
  `).all(date);
  const now = new Date();
  const earliestStart = date === localDateToday()
    ? now.getHours() * 60 + now.getMinutes() + 1
    : 0;

  const slots = new Set();
  for (const interval of hours) {
    const opens = timeToMinutes(interval.startTime);
    const closes = timeToMinutes(interval.endTime);
    for (let start = opens; start + service.duration_minutes <= closes; start += 15) {
      if (start < earliestStart) continue;
      const end = start + service.duration_minutes;
      if (!occupied.some((booking) => booking.startMinute < end && booking.endMinute > start)) {
        slots.add(minutesToTime(start));
      }
    }
  }
  return { slots: [...slots].sort() };
}

function adminGuard(adminToken) {
  return (request, response, next) => {
    if (!adminToken) {
      response.status(503).json({ error: "Admin API is not configured." });
      return;
    }
    const authorization = request.get("authorization") || "";
    const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const expected = Buffer.from(adminToken);
    const supplied = Buffer.from(suppliedToken);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      response.status(401).json({ error: "A valid admin token is required." });
      return;
    }
    next();
  };
}

function validateService(payload) {
  const value = payload ?? {};
  const errors = [
    requiredText(value.slug, "Slug", 100),
    requiredText(value.titleEn, "English title", 160),
    requiredText(value.titleDe, "German title", 160),
    optionalText(value.descriptionEn, "English description", 2000),
    optionalText(value.descriptionDe, "German description", 2000),
    optionalText(value.priceNoteEn, "English price note", 100),
    optionalText(value.priceNoteDe, "German price note", 100),
  ].filter(Boolean);
  if (!Number.isInteger(value.categoryId) || value.categoryId < 1) errors.push("Choose a valid category.");
  if (value.durationMinutes !== null && (!Number.isInteger(value.durationMinutes) || value.durationMinutes < 1 || value.durationMinutes > 600)) {
    errors.push("Duration must be between 1 and 600 minutes, or null.");
  }
  if (value.displayDurationMinutes !== null && (!Number.isInteger(value.displayDurationMinutes) || value.displayDurationMinutes < 1 || value.displayDurationMinutes > (value.durationMinutes || 600))) {
    errors.push("Display duration must be a positive value no greater than the reserved duration.");
  }
  for (const field of ["priceMinor", "compareAtPriceMinor"]) {
    if (value[field] !== null && (!Number.isInteger(value[field]) || value[field] < 0)) {
      errors.push(`${field} must be a non-negative integer or null.`);
    }
  }
  if (!["appointment", "consultation", "unavailable"].includes(value.bookingMode)) errors.push("Choose a valid booking mode.");
  if (value.bookingMode === "appointment" && (!Number.isInteger(value.durationMinutes) || value.durationMinutes < 1)) {
    errors.push("Appointment treatments need a defined duration.");
  }
  if (value.currency !== undefined && !/^[A-Z]{3}$/.test(value.currency)) errors.push("Currency must be a three-letter code.");
  if (!Number.isInteger(value.sortOrder)) errors.push("Sort order must be an integer.");
  if (typeof value.approximateDuration !== "boolean" || typeof value.isActive !== "boolean") errors.push("Activity and approximate-duration flags must be boolean.");
  return errors[0] || null;
}

function validateGalleryItem(payload) {
  const value = payload ?? {};
  const imageUrl = value.imageUrl;
  const errors = [
    requiredText(imageUrl, "Image URL", 1000),
    requiredText(value.captionEn, "English caption", 200),
    requiredText(value.captionDe, "German caption", 200),
    requiredText(value.altEn, "English alternative text", 300),
    requiredText(value.altDe, "German alternative text", 300),
    requiredText(value.objectPosition, "Object position", 40),
  ].filter(Boolean);
  let safeImageUrl = false;
  try {
    safeImageUrl = new URL(imageUrl).protocol === "https:";
  } catch {
    safeImageUrl = typeof imageUrl === "string" && /^\/(?!\/)[\w./-]+$/.test(imageUrl);
  }
  if (!safeImageUrl) errors.push("Image URL must be HTTPS or a local site path.");
  if (!["large", "tall", "small", "wide"].includes(value.layoutKey)) errors.push("Choose a valid gallery layout.");
  if (!/^(center|top|bottom|left|right|\d{1,3}%\s+\d{1,3}%)$/.test(value.objectPosition || "")) errors.push("Choose a valid image position.");
  if (!Number.isInteger(value.sortOrder)) errors.push("Sort order must be an integer.");
  if (typeof value.isActive !== "boolean") errors.push("Activity must be boolean.");
  return errors[0] || null;
}

export function createApp({
  database = createDatabase(),
  serveClient = false,
  adminToken = process.env.ADMIN_TOKEN,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

  app.get("/api/services", (_request, response) => {
    const categories = database.prepare(`
      SELECT id, slug, title_en, title_de, sort_order, is_active
      FROM service_categories WHERE is_active = 1
      ORDER BY sort_order, id
    `).all();
    const getServices = database.prepare(`
      SELECT * FROM services WHERE category_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `);
    response.json({
      categories: categories.map((category) => categoryRecord({
        ...category,
        services: getServices.all(category.id).map(serviceRecord),
      })),
    });
  });

  app.get("/api/gallery", (_request, response) => {
    const items = database.prepare(`
      SELECT id, image_url AS imageUrl, layout_key AS layoutKey,
             object_position AS objectPosition, caption_en AS captionEn,
             caption_de AS captionDe, alt_en AS altEn, alt_de AS altDe,
             sort_order AS sortOrder
      FROM gallery_items WHERE is_active = 1
      ORDER BY sort_order, id
    `).all();
    response.json({ items });
  });

  app.get("/api/business-hours", (_request, response) => {
    response.json({
      intervals: database.prepare(`
        SELECT weekday, start_time AS startTime, end_time AS endTime
        FROM business_hours ORDER BY weekday, start_time
      `).all(),
    });
  });

  app.get("/api/availability", (request, response) => {
    const date = request.query.date;
    const serviceId = Number(request.query.serviceId);
    if (!validDate(date) || date < localDateToday()) {
      response.status(400).json({ error: "Choose a valid future date." });
      return;
    }
    if (!Number.isInteger(serviceId) || serviceId < 1) {
      response.status(400).json({ error: "Choose a valid treatment." });
      return;
    }
    const result = getAvailability(database, date, serviceId);
    if (result.error) {
      response.status(400).json({ error: result.error });
      return;
    }
    response.json({ slots: result.slots });
  });

  app.get("/api/reviews", (request, response) => {
    const requestedLimit = Number.parseInt(request.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 100;
    const reviews = database.prepare(`
      SELECT id, author, quote, rating, treatment, service_id AS serviceId,
             created_at AS createdAt
      FROM reviews
      WHERE status = 'published'
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `).all(limit);
    response.json({ reviews });
  });

  app.post("/api/reviews", (request, response) => {
    const { author, quote, rating, treatment = "", serviceId = null } = request.body ?? {};
    const errors = [
      requiredText(author, "Name", 60),
      requiredText(quote, "Review", 500),
      optionalText(treatment, "Treatment", 120),
    ].filter(Boolean);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push("Rating must be an integer from 1 to 5.");
    if (serviceId !== null && (!Number.isInteger(serviceId) || serviceId < 1)) errors.push("Choose a valid treatment.");
    if (errors.length) {
      response.status(400).json({ error: errors[0] });
      return;
    }

    const result = database.prepare(`
      INSERT INTO reviews (author, quote, rating, treatment, service_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(author.trim(), quote.trim(), rating, treatment.trim(), serviceId);
    const review = database.prepare(`
      SELECT id, author, quote, rating, treatment, service_id AS serviceId,
             created_at AS createdAt
      FROM reviews WHERE id = ?
    `).get(result.lastInsertRowid);
    response.status(201).json({ review });
  });

  app.post("/api/bookings", (request, response) => {
    const {
      name, email, phone = "", serviceId, date, time, message = "",
    } = request.body ?? {};
    const errors = [
      requiredText(name, "Name", 100),
      requiredText(email, "Email", 254),
      optionalText(phone, "Phone", 40),
      optionalText(message, "Message", 2000),
    ].filter(Boolean);
    if (typeof email === "string" && !emailPattern.test(email.trim())) errors.push("Enter a valid email address.");
    if (!Number.isInteger(serviceId) || serviceId < 1) errors.push("Choose a valid treatment.");
    if (errors.length) {
      response.status(400).json({ error: errors[0] });
      return;
    }

    const requestedService = database.prepare(`
      SELECT booking_mode, duration_minutes, is_active
      FROM services WHERE id = ?
    `).get(serviceId);
    if (!requestedService || !requestedService.is_active || requestedService.booking_mode === "unavailable") {
      response.status(400).json({ error: "Choose an available treatment." });
      return;
    }
    const requiresScheduledTime = requestedService.booking_mode === "appointment"
      && requestedService.duration_minutes > 0;
    const startMinute = requiresScheduledTime ? timeToMinutes(time) : null;
    if (requiresScheduledTime && (!validDate(date) || date < localDateToday())) {
      response.status(400).json({ error: "Choose a valid future date." });
      return;
    }
    if (requiresScheduledTime && (startMinute === null || startMinute % 15 !== 0)) {
      response.status(400).json({ error: "Choose an available appointment time." });
      return;
    }
    if (!requiresScheduledTime && date && (!validDate(date) || date < localDateToday())) {
      response.status(400).json({ error: "Choose a valid future date." });
      return;
    }

    const insertBooking = database.transaction(() => {
      const service = database.prepare(`
        SELECT id, title_en, duration_minutes, booking_mode, is_active
        FROM services WHERE id = ?
      `).get(serviceId);
      if (!service || !service.is_active || service.booking_mode === "unavailable") {
        return { status: 400, error: "Choose an available treatment." };
      }

      const serviceName = service.title_en;
      if (service.booking_mode === "consultation" || !service.duration_minutes) {
        const result = database.prepare(`
          INSERT INTO bookings (
            name, email, phone, service, preferred_date, service_id, service_name,
            appointment_date, start_minute, end_minute, message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
        `).run(
          name.trim(),
          email.trim().toLowerCase(),
          phone.trim(),
          serviceName,
          date || "",
          serviceId,
          serviceName,
          message.trim(),
        );
        return { status: 201, booking: { id: result.lastInsertRowid, status: "requested" } };
      }

      const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
      const intervals = database.prepare(`
        SELECT start_time AS startTime, end_time AS endTime
        FROM business_hours WHERE weekday = ?
      `).all(weekday);
      const endMinute = startMinute + service.duration_minutes;
      const fitsBusinessHours = intervals.some((interval) => (
        startMinute >= timeToMinutes(interval.startTime)
        && endMinute <= timeToMinutes(interval.endTime)
      ));
      if (!fitsBusinessHours) return { status: 409, error: "That appointment time is outside business hours." };

      const now = new Date();
      const nowDate = localDateToday();
      const nowMinute = now.getHours() * 60 + now.getMinutes();
      if (date === nowDate && startMinute <= nowMinute) {
        return { status: 409, error: "That appointment time has already passed." };
      }

      const conflict = database.prepare(`
        SELECT 1 FROM bookings
        WHERE appointment_date = ? AND status != 'cancelled'
          AND start_minute < ? AND end_minute > ?
        LIMIT 1
      `).get(date, endMinute, startMinute);
      if (conflict) return { status: 409, error: "That appointment time is no longer available." };

      const result = database.prepare(`
        INSERT INTO bookings (
          name, email, phone, service, preferred_date, service_id, service_name,
          appointment_date, start_minute, end_minute, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        serviceName,
        date,
        serviceId,
        serviceName,
        date,
        startMinute,
        endMinute,
        message.trim(),
      );
      return { status: 201, booking: { id: result.lastInsertRowid, status: "requested" } };
    });

    const result = insertBooking.immediate();
    if (result.error) {
      response.status(result.status).json({ error: result.error });
      return;
    }
    response.status(result.status).json({ booking: result.booking });
  });

  const requireAdmin = adminGuard(adminToken);
  app.use("/api/admin", requireAdmin);

  app.get("/api/admin/categories", (_request, response) => {
    const categories = database.prepare(`
      SELECT id, slug, title_en AS titleEn, title_de AS titleDe,
             sort_order AS sortOrder, is_active AS isActive
      FROM service_categories ORDER BY sort_order, id
    `).all();
    response.json({ categories });
  });

  app.get("/api/admin/services", (_request, response) => {
    const services = database.prepare(`
      SELECT * FROM services ORDER BY category_id, sort_order, id
    `).all().map(serviceRecord);
    response.json({ services });
  });

  app.get("/api/admin/gallery", (_request, response) => {
    const items = database.prepare(`
      SELECT id, image_url AS imageUrl, layout_key AS layoutKey,
             object_position AS objectPosition, caption_en AS captionEn,
             caption_de AS captionDe, alt_en AS altEn, alt_de AS altDe,
             sort_order AS sortOrder, is_active AS isActive
      FROM gallery_items ORDER BY sort_order, id
    `).all().map((item) => ({ ...item, isActive: Boolean(item.isActive) }));
    response.json({ items });
  });

  app.get("/api/admin/bookings", (_request, response) => {
    const bookings = database.prepare(`
      SELECT id, name, email, phone, service_id AS serviceId, service_name AS service,
             COALESCE(appointment_date, preferred_date) AS date,
             start_minute AS startMinute, end_minute AS endMinute,
             message, status, created_at AS createdAt
      FROM bookings ORDER BY created_at DESC, id DESC LIMIT 500
    `).all().map((booking) => ({
      ...booking,
      time: booking.startMinute === null ? null : minutesToTime(booking.startMinute),
      endTime: booking.endMinute === null ? null : minutesToTime(booking.endMinute),
    }));
    response.json({ bookings });
  });

  app.patch("/api/admin/bookings/:id", (request, response) => {
    const id = Number(request.params.id);
    const { status } = request.body ?? {};
    if (!Number.isInteger(id) || id < 1 || !allowedStatuses.has(status)) {
      response.status(400).json({ error: "Choose a valid booking status." });
      return;
    }
    const update = database.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
    if (!update.changes) {
      response.status(404).json({ error: "Booking not found." });
      return;
    }
    response.json({ id, status });
  });

  app.get("/api/admin/reviews", (_request, response) => {
    const reviews = database.prepare(`
      SELECT id, author, quote, rating, treatment, service_id AS serviceId,
             status, created_at AS createdAt
      FROM reviews ORDER BY created_at DESC, id DESC LIMIT 500
    `).all();
    response.json({ reviews });
  });

  app.patch("/api/admin/reviews/:id", (request, response) => {
    const id = Number(request.params.id);
    const { status } = request.body ?? {};
    if (!Number.isInteger(id) || id < 1 || !["pending", "published", "hidden"].includes(status)) {
      response.status(400).json({ error: "Choose a valid review status." });
      return;
    }
    const update = database.prepare("UPDATE reviews SET status = ? WHERE id = ?").run(status, id);
    if (!update.changes) {
      response.status(404).json({ error: "Review not found." });
      return;
    }
    response.json({ id, status });
  });

  app.post("/api/admin/categories", (request, response) => {
    const { slug, titleEn, titleDe, sortOrder = 0, isActive = true } = request.body ?? {};
    const errors = [
      requiredText(slug, "Slug", 100),
      requiredText(titleEn, "English title", 160),
      requiredText(titleDe, "German title", 160),
    ].filter(Boolean);
    if (!Number.isInteger(sortOrder) || typeof isActive !== "boolean") errors.push("Category order or activity is invalid.");
    if (errors.length) {
      response.status(400).json({ error: errors[0] });
      return;
    }
    const result = database.prepare(`
      INSERT INTO service_categories (slug, title_en, title_de, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(slug.trim(), titleEn.trim(), titleDe.trim(), sortOrder, Number(isActive));
    response.status(201).json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/categories/:id", (request, response) => {
    const id = Number(request.params.id);
    const { slug, titleEn, titleDe, sortOrder, isActive } = request.body ?? {};
    const errors = [
      requiredText(slug, "Slug", 100),
      requiredText(titleEn, "English title", 160),
      requiredText(titleDe, "German title", 160),
    ].filter(Boolean);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(sortOrder) || typeof isActive !== "boolean") errors.push("Category values are invalid.");
    if (errors.length) {
      response.status(400).json({ error: errors[0] });
      return;
    }
    const update = database.prepare(`
      UPDATE service_categories
      SET slug = ?, title_en = ?, title_de = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(slug.trim(), titleEn.trim(), titleDe.trim(), sortOrder, Number(isActive), id);
    if (!update.changes) {
      response.status(404).json({ error: "Category not found." });
      return;
    }
    response.json({ id });
  });

  app.post("/api/admin/services", (request, response) => {
    const error = validateService(request.body);
    if (error) {
      response.status(400).json({ error });
      return;
    }
    const value = request.body;
    const result = database.prepare(`
      INSERT INTO services (
        category_id, slug, title_en, title_de, description_en, description_de,
        duration_minutes, display_duration_minutes, approximate_duration,
        price_minor, compare_at_price_minor, currency, price_note_en, price_note_de,
        booking_mode, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      value.categoryId, value.slug.trim(), value.titleEn.trim(), value.titleDe.trim(),
      (value.descriptionEn || "").trim(), (value.descriptionDe || "").trim(), value.durationMinutes,
      value.displayDurationMinutes, Number(value.approximateDuration), value.priceMinor,
      value.compareAtPriceMinor, value.currency || "EUR", (value.priceNoteEn || "").trim(),
      (value.priceNoteDe || "").trim(), value.bookingMode, Number(value.isActive), value.sortOrder,
    );
    response.status(201).json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/services/:id", (request, response) => {
    const id = Number(request.params.id);
    const error = validateService(request.body);
    if (!Number.isInteger(id) || id < 1 || error) {
      response.status(400).json({ error: error || "Service ID is invalid." });
      return;
    }
    const value = request.body;
    const update = database.prepare(`
      UPDATE services SET category_id = ?, slug = ?, title_en = ?, title_de = ?,
        description_en = ?, description_de = ?, duration_minutes = ?,
        display_duration_minutes = ?, approximate_duration = ?, price_minor = ?,
        compare_at_price_minor = ?, currency = ?, price_note_en = ?, price_note_de = ?,
        booking_mode = ?, is_active = ?, sort_order = ?
      WHERE id = ?
    `).run(
      value.categoryId, value.slug.trim(), value.titleEn.trim(), value.titleDe.trim(),
      (value.descriptionEn || "").trim(), (value.descriptionDe || "").trim(), value.durationMinutes,
      value.displayDurationMinutes, Number(value.approximateDuration), value.priceMinor,
      value.compareAtPriceMinor, value.currency || "EUR", (value.priceNoteEn || "").trim(),
      (value.priceNoteDe || "").trim(), value.bookingMode, Number(value.isActive), value.sortOrder, id,
    );
    if (!update.changes) {
      response.status(404).json({ error: "Service not found." });
      return;
    }
    response.json({ id });
  });

  app.delete("/api/admin/services/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      response.status(400).json({ error: "Service ID is invalid." });
      return;
    }
    const update = database.prepare("UPDATE services SET is_active = 0 WHERE id = ?").run(id);
    if (!update.changes) {
      response.status(404).json({ error: "Service not found." });
      return;
    }
    response.status(204).end();
  });

  app.post("/api/admin/gallery", (request, response) => {
    const error = validateGalleryItem(request.body);
    if (error) {
      response.status(400).json({ error });
      return;
    }
    const value = request.body;
    const result = database.prepare(`
      INSERT INTO gallery_items (
        image_url, layout_key, object_position, caption_en, caption_de,
        alt_en, alt_de, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      value.imageUrl.trim(), value.layoutKey, value.objectPosition, (value.captionEn || "").trim(),
      (value.captionDe || "").trim(), (value.altEn || "").trim(), (value.altDe || "").trim(), value.sortOrder,
      Number(value.isActive),
    );
    response.status(201).json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/gallery/:id", (request, response) => {
    const id = Number(request.params.id);
    const error = validateGalleryItem(request.body);
    if (!Number.isInteger(id) || id < 1 || error) {
      response.status(400).json({ error: error || "Gallery item ID is invalid." });
      return;
    }
    const value = request.body;
    const update = database.prepare(`
      UPDATE gallery_items SET image_url = ?, layout_key = ?, object_position = ?,
        caption_en = ?, caption_de = ?, alt_en = ?, alt_de = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      value.imageUrl.trim(), value.layoutKey, value.objectPosition, (value.captionEn || "").trim(),
      (value.captionDe || "").trim(), (value.altEn || "").trim(), (value.altDe || "").trim(), value.sortOrder,
      Number(value.isActive), id,
    );
    if (!update.changes) {
      response.status(404).json({ error: "Gallery item not found." });
      return;
    }
    response.json({ id });
  });

  app.delete("/api/admin/gallery/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      response.status(400).json({ error: "Gallery item ID is invalid." });
      return;
    }
    const update = database.prepare("UPDATE gallery_items SET is_active = 0 WHERE id = ?").run(id);
    if (!update.changes) {
      response.status(404).json({ error: "Gallery item not found." });
      return;
    }
    response.status(204).end();
  });

  app.put("/api/admin/business-hours", (request, response) => {
    const { intervals } = request.body ?? {};
    if (!Array.isArray(intervals)) {
      response.status(400).json({ error: "Intervals must be an array." });
      return;
    }
    const normalized = [];
    for (const interval of intervals) {
      const start = timeToMinutes(interval?.startTime);
      const end = timeToMinutes(interval?.endTime);
      if (!Number.isInteger(interval?.weekday) || interval.weekday < 0 || interval.weekday > 6
        || start === null || end === null || start >= end) {
        response.status(400).json({ error: "Each interval needs a weekday and a valid start/end time." });
        return;
      }
      normalized.push({ weekday: interval.weekday, startTime: interval.startTime, endTime: interval.endTime, start, end });
    }
    for (const weekday of new Set(normalized.map(({ weekday: day }) => day))) {
      const dayIntervals = normalized.filter(({ weekday: day }) => day === weekday).sort((a, b) => a.start - b.start);
      if (dayIntervals.some((interval, index) => index > 0 && interval.start < dayIntervals[index - 1].end)) {
        response.status(400).json({ error: "Business-hour intervals cannot overlap." });
        return;
      }
    }

    const futureBookings = database.prepare(`
      SELECT appointment_date, start_minute AS startMinute, end_minute AS endMinute
      FROM bookings
      WHERE status != 'cancelled' AND appointment_date >= ?
        AND start_minute IS NOT NULL AND end_minute IS NOT NULL
    `).all(localDateToday());
    const invalidatesBooking = futureBookings.some((booking) => {
      const weekday = new Date(`${booking.appointment_date}T00:00:00.000Z`).getUTCDay();
      return !normalized.some((interval) => (
        interval.weekday === weekday
        && booking.startMinute >= interval.start
        && booking.endMinute <= interval.end
      ));
    });
    if (invalidatesBooking) {
      response.status(409).json({ error: "Hours cannot be changed because an active booking would fall outside them." });
      return;
    }

    const saveHours = database.transaction(() => {
      database.prepare("DELETE FROM business_hours").run();
      const insert = database.prepare(`
        INSERT INTO business_hours (weekday, start_time, end_time) VALUES (?, ?, ?)
      `);
      normalized.forEach((interval) => insert.run(interval.weekday, interval.startTime, interval.endTime));
    });
    saveHours.immediate();
    response.json({ intervals: normalized.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })) });
  });

  app.get("/api/bookings", requireAdmin, (request, response) => {
    const bookings = database.prepare(`
      SELECT id, name, email, phone, service_id AS serviceId, service_name AS service,
             COALESCE(appointment_date, preferred_date) AS date,
             start_minute AS startMinute, end_minute AS endMinute,
             message, status, created_at AS createdAt
      FROM bookings ORDER BY created_at DESC, id DESC LIMIT 500
    `).all();
    response.json({ bookings });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: "Request body must be valid JSON." });
      return;
    }
    if (error.type === "entity.too.large") {
      response.status(413).json({ error: "Request body is too large." });
      return;
    }
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      response.status(409).json({ error: "The requested record conflicts with existing data." });
      return;
    }
    console.error("API request failed:", error);
    response.status(500).json({ error: "The request could not be completed." });
  });

  if (serveClient) {
    const clientDirectory = resolve(projectRoot, "dist");
    app.use(express.static(clientDirectory));
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api/")) {
        next();
        return;
      }
      response.sendFile(resolve(clientDirectory, "index.html"));
    });
  }

  app.locals.database = database;
  return app;
}
