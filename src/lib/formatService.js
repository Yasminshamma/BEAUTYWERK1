export function formatServiceMeta(service, language) {
  const note = service.priceNote?.[language];
  const parts = [];
  if (service.durationMinutes && !note) {
    const displayDuration = service.displayDurationMinutes || service.durationMinutes;
    if (displayDuration < service.durationMinutes) {
      parts.push(`${displayDuration}–${service.durationMinutes} MIN`);
    } else if (service.approximateDuration) {
      parts.push(`${language === "de" ? "CA." : "≈"} ${service.durationMinutes} MIN`);
    } else {
      parts.push(`${service.durationMinutes} MIN`);
    }
  }
  if (note) parts.push(note);

  if (service.priceMinor !== null) {
    const formattedPrice = formatPrice(service.priceMinor, service.currency, language);
    if (service.compareAtPriceMinor !== null) {
      const comparePrice = formatPrice(service.compareAtPriceMinor, service.currency, language);
      parts.push(language === "de" ? `${formattedPrice} (statt ${comparePrice})` : `${formattedPrice} (was ${comparePrice})`);
    } else {
      parts.push(formattedPrice);
    }
  }

  return parts.join(" · ");
}

function formatPrice(amountMinor, currency, language) {
  return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}
