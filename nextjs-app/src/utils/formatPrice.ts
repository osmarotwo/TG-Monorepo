/**
 * Utilidades para formatear precios
 */

/**
 * Formatea un precio según la moneda especificada
 * @param price - Precio numérico a formatear
 * @param currency - Código de moneda ISO 4217 (COP, USD, EUR, etc.)
 * @param locale - Locale para el formato (por defecto es-CO)
 * @returns String con el precio formateado
 */
export function formatPrice(
  price: number,
  currency: string = 'COP',
  locale: string = 'es-CO'
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(price);
}

/**
 * Formatea un precio de forma compacta (con K, M para miles y millones)
 * @param price - Precio numérico a formatear
 * @param currency - Código de moneda ISO 4217
 * @returns String con el precio formateado de forma compacta
 */
export function formatPriceCompact(
  price: number,
  currency: string = 'COP'
): string {
  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  
  return formatter.format(price);
}

/**
 * Obtiene el símbolo de la moneda
 * @param currency - Código de moneda ISO 4217
 * @returns Símbolo de la moneda
 */
export function getCurrencySymbol(currency: string = 'COP'): string {
  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
  });
  
  // Extraer solo el símbolo
  const parts = formatter.formatToParts(0);
  const symbolPart = parts.find(part => part.type === 'currency');
  return symbolPart?.value || currency;
}
