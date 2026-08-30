const ct = require("countries-and-timezones");
const Holidays = require("date-holidays");

function getHolidaysForTimezone(timezone, years) {
  const tzInfo = ct.getTimezone(timezone);
  const countryCode = tzInfo?.countries?.[0];
  if (!countryCode) return [];

  const hd = new Holidays(countryCode);

  const results = [];
  for (const year of years) {
    const holidays = hd.getHolidays(year) || [];
    for (const h of holidays) {
      if (h.type === "public" || h.type === "bank") {
        results.push({ date: h.date.slice(0, 10), name: h.name });
      }
    }
  }
  return results;
}

module.exports = { getHolidaysForTimezone };
