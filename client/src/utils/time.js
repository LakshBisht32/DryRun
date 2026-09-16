import { DateTime } from 'luxon';

// The server always stores/returns UTC ISO strings. Every place we show a
// time to a user, we convert to their local zone here — never compare or
// display raw UTC.
export function toLocal(isoString) {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toLocal();
}

export function formatDateTime(isoString) {
  return toLocal(isoString).toFormat('EEE, MMM d · h:mm a');
}

export function formatRange(startIso, endIso) {
  const start = toLocal(startIso);
  const end = toLocal(endIso);
  const sameDay = start.hasSame(end, 'day');
  const startStr = start.toFormat('EEE, MMM d · h:mm a');
  const endStr = end.toFormat(sameDay ? 'h:mm a' : 'EEE, MMM d · h:mm a');
  return `${startStr} – ${endStr}`;
}

export function localZoneLabel() {
  return DateTime.local().toFormat('ZZZZ');
}

// <input type="datetime-local"> works in the browser's local time and has
// no timezone info of its own — this turns that local string into a UTC
// ISO string for the API, and back again for pre-filling a form.
export function localInputToUtcIso(localValue) {
  return DateTime.fromISO(localValue).toUTC().toISO();
}

export function isoToLocalInput(isoString) {
  return toLocal(isoString).toFormat("yyyy-LL-dd'T'HH:mm");
}
