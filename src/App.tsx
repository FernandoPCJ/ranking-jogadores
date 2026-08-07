import {
  Navigate,
  Route,
  Routes,
} from 'react-router'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AdminJogadores from './pages/AdminJogadores'
import CriarConta from './pages/CriarConta'
import DashboardPage from './pages/DashboardPage'
import Login from './pages/Login'
import Ranking from './pages/Ranking'
import MeuPerfil from './pages/MeuPerfil'

import PerfilJogador from './pages/PerfilJogador'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/criar-conta"
        element={<CriarConta />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/inicio"
          element={<DashboardPage />}
        />

        <Route
          path="/ranking/gols"
          element={<Ranking tipo="gols" />}
        />

        <Route
          path="/ranking/assistencias"
          element={<Ranking tipo="assistencias" />}
        />

        <Route
          path="/ranking/vitorias"
          element={<Ranking tipo="vitorias" />}
        />

        <Route
          path="/ranking/estrelas"
          element={<Ranking tipo="estrelas" />}
        />

        <Route element={<AdminRoute />}>
          <Route
            path="/admin/jogadores"
            element={<AdminJogadores />}
          />
        </Route>
      </Route>

      <Route
         path="/meu-perfil"
        element={<MeuPerfil />}
      />

      <Route
        path="/jogador/:id"
        element={<PerfilJogador />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App