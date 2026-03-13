import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth }    from './hooks/useAuth'
import Navbar         from './components/Navbar'
import LoginPage      from './components/LoginPage'
import FoodBank       from './pages/FoodBank'
import NearbyStores   from './pages/NearbyStores'
import DailyPlan      from './pages/DailyPlan'
import Schedule       from './pages/Schedule'

export default function App() {
  const { user, loading, signInWithGoogle, signInWithGithub, signOut } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div className="spin" style={{ width:28, height:28, border:'2px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%' }} />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onGoogle={signInWithGoogle} onGithub={signInWithGithub} />
  }

  return (
    // key={user.id} força React a destruir e recriar TODOS os componentes
    // quando o usuário muda — zerando todo estado em memória
    <BrowserRouter key={user.id}>
      <Navbar user={user} onSignOut={signOut} />
      <Routes>
        <Route path="/"         element={<FoodBank />}     />
        <Route path="/stores"   element={<NearbyStores />} />
        <Route path="/daily"    element={<DailyPlan />}    />
        <Route path="/schedule" element={<Schedule />}     />
      </Routes>
    </BrowserRouter>
  )
}
