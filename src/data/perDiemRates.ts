import { PerDiemRate } from '@/types/expense';

// BMF 2026 Verpflegungsmehraufwand rates
// Source: German Federal Ministry of Finance (Bundesministerium der Finanzen)
export const perDiemRates: PerDiemRate[] = [
  // Germany (domestic)
  { country: 'Deutschland', countryCode: 'DE', fullDay: 28, partialDay: 14 },

  // European Countries
  // European Countries
  { country: 'Belgien', countryCode: 'BE', fullDay: 53, partialDay: 36 },
  { country: 'Dänemark', countryCode: 'DK', fullDay: 63, partialDay: 42 },
  { country: 'Finnland', countryCode: 'FI', fullDay: 50, partialDay: 33 },
  { country: 'Frankreich', countryCode: 'FR', fullDay: 53, partialDay: 36 },
  { country: 'Griechenland', countryCode: 'GR', fullDay: 43, partialDay: 29 },
  { country: 'Irland', countryCode: 'IE', fullDay: 52, partialDay: 35 },
  { country: 'Italien', countryCode: 'IT', fullDay: 45, partialDay: 30 },
  { country: 'Kroatien', countryCode: 'HR', fullDay: 38, partialDay: 25 },
  { country: 'Luxemburg', countryCode: 'LU', fullDay: 53, partialDay: 36 },
  { country: 'Niederlande', countryCode: 'NL', fullDay: 58, partialDay: 39 },
  { country: 'Norwegen', countryCode: 'NO', fullDay: 75, partialDay: 50 },
  { country: 'Österreich', countryCode: 'AT', fullDay: 50, partialDay: 33 },
  { country: 'Polen', countryCode: 'PL', fullDay: 34, partialDay: 23 },
  { country: 'Portugal', countryCode: 'PT', fullDay: 38, partialDay: 25 },
  { country: 'Schweden', countryCode: 'SE', fullDay: 56, partialDay: 37 },
  { country: 'Schweiz', countryCode: 'CH', fullDay: 70, partialDay: 47 },
  { country: 'Slowakei', countryCode: 'SK', fullDay: 34, partialDay: 23 },
  { country: 'Slowenien', countryCode: 'SI', fullDay: 38, partialDay: 25 },
  { country: 'Spanien', countryCode: 'ES', fullDay: 40, partialDay: 27 },
  { country: 'Tschechien', countryCode: 'CZ', fullDay: 38, partialDay: 25 },
  { country: 'Ungarn', countryCode: 'HU', fullDay: 32, partialDay: 21 },
  { country: 'Vereinigtes Königreich', countryCode: 'GB', fullDay: 55, partialDay: 37 },

  // Americas
  { country: 'USA', countryCode: 'US', fullDay: 59, partialDay: 40 },
  { country: 'USA (New York City)', countryCode: 'US-NYC', fullDay: 66, partialDay: 44 },
  { country: 'Kanada', countryCode: 'CA', fullDay: 55, partialDay: 37 },
  { country: 'Brasilien', countryCode: 'BR', fullDay: 48, partialDay: 32 },
  { country: 'Mexiko', countryCode: 'MX', fullDay: 45, partialDay: 30 },
  { country: 'Argentinien', countryCode: 'AR', fullDay: 40, partialDay: 27 },

  // Asia
  { country: 'China', countryCode: 'CN', fullDay: 48, partialDay: 32 },
  { country: 'Japan', countryCode: 'JP', fullDay: 62, partialDay: 41 },
  { country: 'Südkorea', countryCode: 'KR', fullDay: 39, partialDay: 26 },
  // ... existing entries ...
  { country: 'Indien', countryCode: 'IN', fullDay: 38, partialDay: 25 },
  { country: 'Singapur', countryCode: 'SG', fullDay: 58, partialDay: 39 },
  { country: 'Hongkong', countryCode: 'HK', fullDay: 60, partialDay: 40 },
  { country: 'Taiwan', countryCode: 'TW', fullDay: 50, partialDay: 33 },
  { country: 'Thailand', countryCode: 'TH', fullDay: 40, partialDay: 27 },
  { country: 'Vietnam', countryCode: 'VN', fullDay: 36, partialDay: 24 },
  { country: 'Indonesien', countryCode: 'ID', fullDay: 42, partialDay: 28 },
  { country: 'Philippinen', countryCode: 'PH', fullDay: 38, partialDay: 25 },
  { country: 'Malaysia', countryCode: 'MY', fullDay: 40, partialDay: 27 },
  { country: 'Vereinigte Arabische Emirate', countryCode: 'AE', fullDay: 58, partialDay: 39 },
  { country: 'Saudi-Arabien', countryCode: 'SA', fullDay: 52, partialDay: 35 },
  { country: 'Israel', countryCode: 'IL', fullDay: 55, partialDay: 37 },
  { country: 'Türkei', countryCode: 'TR', fullDay: 38, partialDay: 25 },

  // Africa
  { country: 'Südafrika', countryCode: 'ZA', fullDay: 36, partialDay: 24 },
  { country: 'Ägypten', countryCode: 'EG', fullDay: 40, partialDay: 27 },
  { country: 'Marokko', countryCode: 'MA', fullDay: 38, partialDay: 25 },
  { country: 'Nigeria', countryCode: 'NG', fullDay: 48, partialDay: 32 },
  { country: 'Kenia', countryCode: 'KE', fullDay: 42, partialDay: 28 },

  // Oceania
  { country: 'Australien', countryCode: 'AU', fullDay: 56, partialDay: 37 },
  { country: 'Neuseeland', countryCode: 'NZ', fullDay: 50, partialDay: 33 },
];

export const getPerDiemRate = (countryCode: string): PerDiemRate => {
  const rate = perDiemRates.find(r => r.countryCode === countryCode);
  // Default to Germany if not found
  return rate || perDiemRates[0];
};

export const getCountryOptions = () => {
  return perDiemRates.map(r => ({
    value: r.countryCode,
    label: r.country,
    fullDay: r.fullDay,
    partialDay: r.partialDay,
  }));
};
