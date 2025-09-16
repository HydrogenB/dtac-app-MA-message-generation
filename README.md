# Maintenance Announcement Generator (Single Page)

A lightweight single-page tool for generating maintenance announcement messages (Pre-MA and MA Mode) in Thai and English. English output can be reused for EN/MY/KM.

## Features

- Date picker, start time, end time inputs
- Cross-day detection (append TH: "ของวันถัดไป", EN: "of the following day")
- Localized weekday (TH/EN) and Thai Buddhist Era year
- Pre-MA and MA Mode outputs (TH and EN)
- Copy-to-clipboard for each message block
- Modern, accessible UI

## How to Run

Just open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No build step needed.

## Usage

1. Select the base date (start date).
2. Enter start time (HH:mm) and end time (HH:mm).
3. Click `Generate`.
4. Copy any message with the `Copy` button.

## Data Model (internal)

```json
{
  "date": "YYYY-MM-DD",
  "weekdayTH": "พฤหัสบดี",
  "weekdayEN": "Thursday",
  "startTime": "23:00",
  "endTime": "05:00",
  "crossDay": true
}
```

## Formatting Rules

- Cross-day is detected when `endTime < startTime` (lexicographic compare of HH:mm).
- TH: `… เวลา {start} – {end}{ ของวันถัดไป} น.`
- EN/MY/KM: `… from {start} until {end}{ of the following day}.`
- Thai date uses BE year and Thai month abbreviations.

## Example

- Same-day (18 Sep 2025, 00:00–00:30)
- Cross-day (18 Sep 2025, 23:00–05:00)

## Files

- `index.html` – UI structure
- `assets/style.css` – styles
- `assets/app.js` – logic & generation
