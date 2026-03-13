const OVERPASS = 'https://overpass-api.de/api/interpreter'

// ── DETECÇÃO DE PAÍS DO USUÁRIO ───────────────────────────────────────────────
// zoom=3 = só país; zoom=10 = cidade
export async function detectUserLocation(lat, lng) {
  try {
    const [r1, r2] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`, { headers: { 'Accept-Language': 'en' } }),
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`, { headers: { 'Accept-Language': 'pt-BR' } }),
    ])
    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    const a2 = d2.address || {}
    return {
      countryCode: (d1.address?.country_code || 'br').toUpperCase(),
      country:      d1.address?.country || '',
      city:         a2.city || a2.town || a2.village || a2.county || a2.municipality || '',
    }
  } catch {
    return { countryCode: 'BR', country: 'Brasil', city: '' }
  }
}

// ── DETECTA PAÍS DE UM PONTO (coordenadas de uma loja) ────────────────────────
// Usamos cache para não fazer 50 chamadas repetidas na mesma região
const _countryCache = new Map()

async function getCountryOfPoint(lat, lng) {
  // Arredonda para ~1km de precisão — suficiente para saber o país
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  if (_countryCache.has(key)) return _countryCache.get(key)

  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const code = (data.address?.country_code || '').toUpperCase()
    const city = await getCityOfPoint(lat, lng)
    const result = { countryCode: code, city }
    _countryCache.set(key, result)
    return result
  } catch {
    return { countryCode: '', city: '' }
  }
}

async function getCityOfPoint(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    )
    const data = await res.json()
    const a    = data.address || {}
    return a.city || a.town || a.village || a.county || a.municipality || ''
  } catch { return '' }
}

// ── NOMES DE PAÍSES ───────────────────────────────────────────────────────────
export const COUNTRY_NAMES = {
  BR: 'Brasil', AR: 'Argentina', PY: 'Paraguai', UY: 'Uruguai',
  BO: 'Bolívia', CL: 'Chile', PE: 'Peru', CO: 'Colômbia',
  VE: 'Venezuela', EC: 'Equador', GY: 'Guiana', SR: 'Suriname',
  FR: 'França (Guiana)', US: 'EUA', MX: 'México',
}

// ── PARES DE FRONTEIRA ────────────────────────────────────────────────────────
const BORDER_PAIRS = [
  ['BR','AR'],['BR','PY'],['BR','UY'],['BR','BO'],['BR','CO'],
  ['BR','VE'],['BR','PE'],['BR','GY'],['BR','SR'],['BR','EC'],
  ['AR','PY'],['AR','UY'],['AR','BO'],['AR','CL'],
  ['PY','BO'],['BO','CL'],['BO','PE'],['PE','EC'],['PE','CO'],
]
export function isBorderRegion(c1, c2) {
  if (!c1 || !c2 || c1 === c2) return false
  return BORDER_PAIRS.some(([a,b]) => (a===c1&&b===c2)||(a===c2&&b===c1))
}

// ── QUERY OVERPASS ────────────────────────────────────────────────────────────
function buildQuery(lat, lng, r) {
  const a = `(around:${r},${lat},${lng})`
  return `[out:json][timeout:30];(
  node["shop"="supermarket"]${a};node["shop"="convenience"]${a};
  node["shop"="grocery"]${a};node["shop"="greengrocer"]${a};
  node["shop"="butcher"]${a};node["shop"="deli"]${a};
  node["shop"="health_food"]${a};node["shop"="nutrition_supplements"]${a};
  node["shop"="wholesale"]${a};
  node["amenity"="pharmacy"]${a};node["amenity"="drugstore"]${a};
  way["shop"="supermarket"]${a};way["shop"="convenience"]${a};
  way["shop"="grocery"]${a};way["amenity"="pharmacy"]${a};
);out center tags;`
}

// ── FILTROS DE NOME ────────────────────────────────────────────────────────────
const BAD_TAGS = ['tourism','leisure','historic','natural','sport','office','craft','aeroway','railway']

const BAD_WORDS = [
  'cataratas','cachoeira','parque','museu','monumento','mirante','falls','waterfall',
  'park','reserve','nacional','trilha','camping','turismo','pousada','hotel','hostel','resort',
  'moda','roupa','vestuario','boutique','brecho','calcado','sapato','tenis','vestuario',
  'bazar','antiquario','sebo','celular','eletronico','informatica',
  'conserto','reparo','mecanica','funilaria','borracharia',
  'salao','barbearia','estetica','spa','advocacia','contabil','imobiliaria',
  'pet shop','petshop','veterinario','veterinaria',
  'igreja','templo','paroquia','catedral',
]

const MARKET_KW = [
  'mercado','supermercado','minimercado','mercearia','emporio','armazem',
  'quitanda','hortifruti','acougue','frigorifico','peixaria','padaria',
  'confeitaria','panificadora','atacado','atacadista',
  'almacen','despensa','verduleria','carniceria','panaderia','almacén',
  'market','grocery','fresh','mart','superstore',
  'carrefour','assai','atacadao','sonda','giassi','angeloni','bistek',
  'savegnago','comper','condor','walmart','festval','fort ',
  'superseis','arete','supermas','coto ','jumbo','changomas','disco ',
]

const PHARMACY_KW = [
  'farmacia','farmácia','drogaria','droga','pharmacy','drugstore','farma',
  'remedios','remédios','medicamentos',
  'ultrafarma','panvel','raia','drogasil','pacheco','nissei',
  'farmacity','del pueblo','farmacenter',
]

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}

function classifyByTag(tags) {
  const s = tags.shop || '', a = tags.amenity || ''
  if (a==='pharmacy'||a==='drugstore'||s==='nutrition_supplements') return 'farmacia'
  if (['supermarket','convenience','grocery','greengrocer','butcher','deli','health_food','wholesale'].includes(s)) return 'mercado'
  return null
}

function parseNode(node) {
  const t   = node.tags || {}
  const lat = node.lat ?? node.center?.lat
  const lng = node.lon ?? node.center?.lon
  if (!lat || !lng) return null
  if (BAD_TAGS.some((k) => t[k])) return null

  const name = (t.name || t['name:pt'] || t['name:es'] || t['name:en'] || '').trim()
  if (!name) return null

  const n = norm(name)
  if (BAD_WORDS.some((w) => n.includes(w))) return null

  let type = classifyByTag(t)
  if (!type && MARKET_KW.some((w)   => n.includes(w))) type = 'mercado'
  if (!type && PHARMACY_KW.some((w) => n.includes(w))) type = 'farmacia'
  if (!type) return null

  return {
    id:      String(node.id),
    name,
    type,
    lat,
    lng,
    address: [t['addr:street'],t['addr:housenumber'],t['addr:suburb']||t['addr:neighbourhood'],t['addr:city']]
               .filter(Boolean).join(', ') || null,
    phone:   t.phone || t['contact:phone'] || null,
    website: t.website || t['contact:website'] || null,
    hours:   t.opening_hours || null,
    brand:   t.brand || null,
    // País e cidade serão preenchidos depois via reverse geocoding
    countryCode: (t['addr:country']||'').toUpperCase().trim().slice(0,2) || null,
    city: t['addr:city'] || null,
  }
}

// ── EXPORT PRINCIPAL ──────────────────────────────────────────────────────────
export const nearbyStores = {
  async fetch(lat, lng, radiusM, onProgress) {
    const res = await fetch(OVERPASS, {
      method:  'POST',
      body:    `data=${encodeURIComponent(buildQuery(lat, lng, radiusM))}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (!res.ok) throw new Error('Overpass API indisponível. Tente novamente.')

    const data = await res.json()

    // Parse e filtra
    let stores = (data.elements || [])
      .map(parseNode)
      .filter(Boolean)
      .filter((s, i, arr) =>
        arr.findIndex((x) => norm(x.name) === norm(s.name) && x.type === s.type) === i
      )

    if (stores.length === 0) return []

    // Para lojas sem country, agrupa por coordenada arredondada e resolve em batch
    // Máximo 5 chamadas paralelas para não sobrecarregar o Nominatim
    const unknown = stores.filter((s) => !s.countryCode)
    if (unknown.length > 0) {
      onProgress?.('Verificando localização dos estabelecimentos...')
      // Pega pontos únicos
      const uniqueKeys = [...new Set(unknown.map((s) => `${s.lat.toFixed(2)},${s.lng.toFixed(2)}`))]
      // Resolve em lotes de 5
      for (let i = 0; i < uniqueKeys.length; i += 5) {
        const batch = uniqueKeys.slice(i, i + 5)
        await Promise.all(batch.map(async (key) => {
          const [la, lo] = key.split(',').map(Number)
          const result = await getCountryOfPoint(la, lo)
          _countryCache.set(key, result)
        }))
      }
      // Aplica resultado em cada loja
      for (const s of stores) {
        if (!s.countryCode) {
          const key    = `${s.lat.toFixed(2)},${s.lng.toFixed(2)}`
          const cached = _countryCache.get(key)
          if (cached) {
            s.countryCode = cached.countryCode
            if (!s.city) s.city = cached.city
          }
        }
      }
    }

    return stores.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'mercado' ? -1 : 1
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  },
}
