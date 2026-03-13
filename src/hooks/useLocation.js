import { useState } from 'react'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [status,   setStatus]   = useState('idle') // idle|loading|success|denied|error
  const [error,    setError]    = useState(null)

  const request = () => {
    if (!navigator.geolocation) {
      setStatus('error'); setError('Geolocalização não suportada.'); return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`)
          const data = await res.json()
          const a    = data.address || {}
          const city = a.city || a.town || a.village || a.county || 'Localização'
          setLocation({ lat, lng, city, state: a.state || '', display: `${city}${a.state ? ', ' + a.state : ''}` })
        } catch {
          setLocation({ lat, lng, city: 'Localização atual', state: '', display: 'Localização atual' })
        }
        setStatus('success')
      },
      (err) => {
        setStatus(err.code === 1 ? 'denied' : 'error')
        setError(err.code === 1 ? 'Permissão de localização negada.' : 'Não foi possível obter a localização.')
      },
      { timeout: 8000, maximumAge: 300000 }
    )
  }

  return { location, status, error, request }
}
