// Єдине джерело правди для базового URL застосунку.
// Раніше Riot читав NEXT_PUBLIC_SITE_URL, а Steam — NEXT_PUBLIC_APP_URL без
// спільного фолбеку, тож неправильне налаштування однієї змінної ламало
// половину автентифікації. Тепер усі читають це з падінням на localhost.
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  );
}
