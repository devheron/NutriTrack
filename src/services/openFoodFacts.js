// Open Food Facts API — gratuita, sem API key, +3 milhões de produtos
const BASE = 'https://world.openfoodfacts.org'

function parseProduct(p) {
  const n = p.nutriments || {}
  return {
    barcode:     p.code || '',
    name:        p.product_name_pt || p.product_name || p.product_name_en || 'Produto sem nome',
    brand:       p.brands || '',
    category:    detectCategory(p.categories_tags || []),
    calories:    Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    protein:     +(n.proteins_100g || 0).toFixed(1),
    carbs:       +(n.carbohydrates_100g || 0).toFixed(1),
    fat:         +(n.fat_100g || 0).toFixed(1),
    serving:     parseFloat(p.serving_size) || 100,
    unit:        'g',
    photo_url:   p.image_front_url || p.image_url || null,
    description: p.generic_name_pt || p.generic_name || '',
    source:      'openfoodfacts',
    price:       0,
  }
}

function detectCategory(tags) {
  const str = tags.join(' ').toLowerCase()
  if (str.includes('supplement') || str.includes('whey') || str.includes('protein-powder')) return 'suplemento'
  if (str.includes('pharmacy') || str.includes('farma')) return 'farmacia'
  if (str.includes('cereal') || str.includes('grain') || str.includes('oat')) return 'graos'
  if (str.includes('meat') || str.includes('fish') || str.includes('egg') || str.includes('poultry')) return 'proteina'
  return 'mercado'
}

export const openFoodFacts = {
  // Busca por nome (produtos no Brasil primeiro)
  async search(query, page = 1) {
    if (!query.trim()) return []
    try {
      const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&page=${page}&lc=pt&cc=br&fields=code,product_name,product_name_pt,product_name_en,brands,categories_tags,nutriments,image_front_url,image_url,serving_size,generic_name,generic_name_pt`
      const res  = await fetch(url)
      const data = await res.json()
      return (data.products || [])
        .filter((p) => p.product_name || p.product_name_pt)
        .map(parseProduct)
    } catch {
      return []
    }
  },

  // Busca por código de barras
  async getByBarcode(code) {
    try {
      const res  = await fetch(`${BASE}/api/v0/product/${code}.json`)
      const data = await res.json()
      if (data.status !== 1) return null
      return parseProduct(data.product)
    } catch {
      return null
    }
  },
}
