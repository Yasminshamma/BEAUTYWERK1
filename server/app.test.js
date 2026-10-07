import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApp } from "./app.js";
import { createDatabase } from "./database.js";

async function startTestServer(t) {
  const database = createDatabase(":memory:");
  const app = createApp({ database, adminToken: "test-admin-token" });
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => {
    server.close();
    database.close();
  });
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    database,
    adminHeaders: { Authorization: "Bearer test-admin-token" },
  };
}

function nextOpenDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("services, gallery, and opening hours are served from the seeded database", async (t) => {
  const { baseUrl, database } = await startTestServer(t);
  const servicesResponse = await fetch(`${baseUrl}/api/services`);
  const servicesPayload = await servicesResponse.json();
  assert.equal(servicesResponse.status, 200);
  assert.equal(servicesPayload.categories.length, 7);
  assert.equal(servicesPayload.categories[1].services[0].title.en, "Fresh Glow");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM services").get().count, 24);

  const galleryResponse = await fetch(`${baseUrl}/api/gallery`);
  const galleryPayload = await galleryResponse.json();
  assert.equal(galleryResponse.status, 200);
  assert.equal(galleryPayload.items.length, 4);

  const hoursResponse = await fetch(`${baseUrl}/api/business-hours`);
  const hoursPayload = await hoursResponse.json();
  assert.equal(hoursResponse.status, 200);
  assert.equal(hoursPayload.intervals.length, 5);
  assert.deepEqual(hoursPayload.intervals.map(({ weekday }) => weekday), [1, 2, 3, 4, 5]);
  assert.equal(hoursPayload.intervals[0].startTime, "09:00");
  assert.equal(hoursPayload.intervals[0].endTime, "17:00");
});

test("reviews stay private until an admin publishes them", async (t) => {
  const { baseUrl, adminHeaders } = await startTestServer(t);
  const invalid = await postJson(`${baseUrl}/api/reviews`, {
    author: "Guest",
    quote: "Lovely visit",
    rating: 6,
  });
  assert.equal(invalid.status, 400);

  const created = await postJson(`${baseUrl}/api/reviews`, {
    author: " Guest ",
    quote: " A lovely visit. ",
    rating: 4,
    treatment: "Skin ritual",
  });
  assert.equal(created.status, 201);
  const { review } = await created.json();
  assert.equal(review.author, "Guest");
  assert.equal(review.quote, "A lovely visit.");
  assert.equal(review.rating, 4);

  const publicResponse = await fetch(`${baseUrl}/api/reviews`);
  assert.equal((await publicResponse.json()).reviews.length, 0);
  const unauthorized = await fetch(`${baseUrl}/api/admin/reviews`);
  assert.equal(unauthorized.status, 401);

  const adminReviewsResponse = await fetch(`${baseUrl}/api/admin/reviews`, { headers: adminHeaders });
  const adminReviews = await adminReviewsResponse.json();
  assert.equal(adminReviews.reviews.length, 1);
  assert.equal(adminReviews.reviews[0].status, "pending");

  const published = await fetch(`${baseUrl}/api/admin/reviews/${review.id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "published" }),
  });
  assert.equal(published.status, 200);
  const publishedResponse = await fetch(`${baseUrl}/api/reviews`);
  assert.equal((await publishedResponse.json()).reviews.length, 1);

  const hidden = await fetch(`${baseUrl}/api/admin/reviews/${review.id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "hidden" }),
  });
  assert.equal(hidden.status, 200);
  const hiddenResponse = await fetch(`${baseUrl}/api/reviews`);
  assert.equal((await hiddenResponse.json()).reviews.length, 0);
});

test("legacy reviews are queued for approval only once", async () => {
  const directory = mkdtempSync(join(tmpdir(), "beautywerk-reviews-"));
  const databasePath = join(directory, "legacy.sqlite");
  let database = createDatabase(databasePath);
  try {
    const result = database.prepare(`
      INSERT INTO reviews (author, quote, rating) VALUES ('Legacy', 'Existing review', 5)
    `).run();
    database.prepare("UPDATE reviews SET status = 'published' WHERE id = ?").run(result.lastInsertRowid);
    database.exec("DELETE FROM app_migrations WHERE name = 'reviews-require-admin-approval'");
    database.close();

    database = createDatabase(databasePath);
    assert.equal(database.prepare("SELECT status FROM reviews WHERE id = ?").get(result.lastInsertRowid).status, "pending");
    database.prepare("UPDATE reviews SET status = 'published' WHERE id = ?").run(result.lastInsertRowid);
    database.close();

    database = createDatabase(databasePath);
    assert.equal(database.prepare("SELECT status FROM reviews WHERE id = ?").get(result.lastInsertRowid).status, "published");
  } finally {
    if (database.open) database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("availability respects business hours and rejects overlapping bookings", async (t) => {
  const { baseUrl, database, adminHeaders } = await startTestServer(t);
  const serviceId = database.prepare("SELECT id FROM services WHERE slug = 'fresh-glow'").get().id;
  const date = nextOpenDate();

  const availabilityResponse = await fetch(
    `${baseUrl}/api/availability?date=${date}&serviceId=${serviceId}`,
  );
  const availability = await availabilityResponse.json();
  assert.equal(availabilityResponse.status, 200);
  assert.ok(availability.slots.includes("09:00"));
  assert.ok(!availability.slots.includes("17:00"));

  const request = {
    name: "Guest",
    email: "GUEST@example.com",
    phone: "",
    serviceId,
    date,
    time: "09:00",
    message: "Please contact me by email.",
  };
  const created = await postJson(`${baseUrl}/api/bookings`, request);
  assert.equal(created.status, 201);
  assert.equal((await created.json()).booking.status, "requested");

  const duplicate = await postJson(`${baseUrl}/api/bookings`, request);
  assert.equal(duplicate.status, 409);

  const overlappingResponse = await fetch(
    `${baseUrl}/api/availability?date=${date}&serviceId=${serviceId}`,
  );
  const remaining = await overlappingResponse.json();
  assert.ok(!remaining.slots.includes("09:00"));
  assert.ok(!remaining.slots.includes("09:30"));
  assert.ok(remaining.slots.includes("09:45"));

  const adminResponse = await fetch(`${baseUrl}/api/admin/bookings`, { headers: adminHeaders });
  const adminPayload = await adminResponse.json();
  assert.equal(adminResponse.status, 200);
  assert.equal(adminPayload.bookings.length, 1);
  assert.equal(adminPayload.bookings[0].email, "guest@example.com");
  assert.equal(adminPayload.bookings[0].time, "09:00");

  const cancelResponse = await fetch(`${baseUrl}/api/admin/bookings/${adminPayload.bookings[0].id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  assert.equal(cancelResponse.status, 200);
  const availableAgain = await fetch(`${baseUrl}/api/availability?date=${date}&serviceId=${serviceId}`);
  assert.ok((await availableAgain.json()).slots.includes("09:00"));
});

test("consultation requests need no time slot and closed days return no availability", async (t) => {
  const { baseUrl, database } = await startTestServer(t);
  const consultationId = database.prepare("SELECT id FROM services WHERE slug = 'scars-stretch-marks'").get().id;
  const requested = await postJson(`${baseUrl}/api/bookings`, {
    name: "Guest",
    email: "guest@example.com",
    serviceId: consultationId,
    date: "",
    time: "",
  });
  assert.equal(requested.status, 201);

  const monday = nextOpenDate();
  const saturday = new Date(`${monday}T00:00:00`);
  do {
    saturday.setDate(saturday.getDate() + 1);
  } while (saturday.getDay() !== 6);
  const saturdayValue = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;
  const serviceId = database.prepare("SELECT id FROM services WHERE slug = 'fresh-glow'").get().id;
  const closedAvailability = await fetch(
    `${baseUrl}/api/availability?date=${saturdayValue}&serviceId=${serviceId}`,
  );
  assert.deepEqual((await closedAvailability.json()).slots, []);
});
