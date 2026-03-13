import { useState, useEffect } from 'react'

export function useUserLocation() {
  const [location, setLocation] = useState(null)   // { lat, lng, city, state }
  const [status, setStatus]     = useState('idle') // idle | loading | success | error | denied
  const [error, setError]       = useState(null)

  const request = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Geolocalização não suportada neste navegador.')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          // Reverse geocoding via nominatim (gratuito, sem API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const city  = addr.city || addr.town || addr.village || addr.county || 'Sua cidade'
          const state = addr.state || ''
          setLocation({ lat, lng, city, state, display: `${city}, ${state}` })
          setStatus('success')
        } catch {
          // Fallback: usa coordenadas sem nome de cidade
          setLocation({ lat, lng, city: 'Localização atual', state: '', display: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
          setStatus('success')
        }
      },
      (err) => {
        setStatus(err.code === 1 ? 'denied' : 'error')
        setError(
          err.code === 1
            ? 'Permissão de localização negada. Habilite nas configurações do navegador.'
            : 'Não foi possível obter sua localização.'
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }

  return { location, status, error, request }
}
