/**
 * Utilidad para generar enlaces de búsqueda de Amazon
 * Para hackathon/demo - en producción usarías Amazon Product Advertising API
 */

export function getAmazonLink(query: string, tag: string = 'demo-hackathon-20'): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://www.amazon.com/s?k=${encodedQuery}&tag=${tag}`
}

/**
 * Genera un enlace más específico con categoría
 */
export function getAmazonLinkWithCategory(
  query: string,
  category?: string,
  tag: string = 'demo-hackathon-20'
): string {
  const encodedQuery = encodeURIComponent(query)
  const categoryParam = category ? `&i=${category}` : ''
  return `https://www.amazon.com/s?k=${encodedQuery}${categoryParam}&tag=${tag}`
}
