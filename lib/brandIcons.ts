/**
 * Utility to map vehicle brands to brand icons located in /public/icons.
 */

export interface BrandIconInfo {
  iconUrl: string;
  brandName: string;
}

const BRAND_ICON_MAP: Record<string, string> = {
  // Chery / Caoa Chery
  chery: '/icons/ioschery.png',
  caoachery: '/icons/ioschery.png',
  caoa: '/icons/ioschery.png',
  tiggo: '/icons/ioschery.png',

  // GAC / Aion / Trumpchi
  gac: '/icons/iosgac.png',
  gacmotor: '/icons/iosgac.png',
  aion: '/icons/iosgac.png',
  trumpchi: '/icons/iosgac.png',

  // GWM / Haval / Ora / Tank / Poer
  gwm: '/icons/iosgwm.png',
  haval: '/icons/iosgwm.png',
  ora: '/icons/iosgwm.png',
  tank: '/icons/iosgwm.png',
  poer: '/icons/iosgwm.png',
  greatwall: '/icons/iosgwm.png',
  greatwallmotors: '/icons/iosgwm.png',

  // Honda
  honda: '/icons/ioshonda.png',

  // Jetour
  jetour: '/icons/iosjetour.png',

  // Leapmotor
  leapmotor: '/icons/iosleapmotor.png',
  leap: '/icons/iosleapmotor.png',

  // Geely / Zeekr / Galaxy
  geely: '/icons/isogeely.png',
  zeekr: '/icons/isogeely.png',
  galaxy: '/icons/isogeely.png',
};

/**
 * Normalizes brand and model names to find matching brand icon.
 */
export function getBrandIconUrl(brand?: string | null, model?: string | null): string | null {
  if (!brand && !model) return null;

  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const cleanBrand = brand ? sanitize(brand) : '';
  const cleanModel = model ? sanitize(model) : '';

  // Direct brand exact match
  if (cleanBrand && BRAND_ICON_MAP[cleanBrand]) {
    return BRAND_ICON_MAP[cleanBrand];
  }

  // Brand substring check
  for (const [key, path] of Object.entries(BRAND_ICON_MAP)) {
    if (cleanBrand && (cleanBrand.includes(key) || key.includes(cleanBrand))) {
      return path;
    }
  }

  // Model substring check (e.g. brand is empty or user typed "Haval H6")
  for (const [key, path] of Object.entries(BRAND_ICON_MAP)) {
    if (cleanModel && cleanModel.includes(key)) {
      return path;
    }
  }

  return null;
}
