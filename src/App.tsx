import {
  Navigate,
  Route,
  Routes,
} from 'react-router'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AdminJogadores from './pages/AdminJogadores'
import AdminRegistrarRacha from './pages/AdminRegistrarRacha'
import CriarConta from './pages/CriarConta'
import DashboardPage from './pages/DashboardPage'
import HallDaFama from './pages/HallDaFama'
import Login from './pages/Login'
import MeuCard from './pages/MeuCard'
import MeuPerfil from './pages/MeuPerfil'
import PerfilJogador from './pages/PerfilJogador'
import Ranking from './pages/Ranking'
import SelecaoSemana from './pages/SelecaoSemana'
import Temporadas from './pages/Temporadas'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />

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
          element={
            <Ranking tipo="assistencias" />
          }
        />

        <Route
          path="/ranking/vitorias"
          element={
            <Ranking tipo="vitorias" />
          }
        />

        <Route
          path="/ranking/estrelas"
          element={
            <Ranking tipo="estrelas" />
          }
        />

        <Route
          path="/selecao-da-semana"
          element={<SelecaoSemana />}
        />

        <Route
          path="/hall-da-fama"
          element={<HallDaFama />}
        />

        <Route
          path="/temporadas"
          element={<Temporadas />}
        />

        <Route
          path="/meu-perfil"
          element={<MeuPerfil />}
        />

        <Route
          path="/meu-card"
          element={<MeuCard />}
        />

        <Route
          path="/jogador/:id"
          element={<PerfilJogador />}
        />

        <Route element={<AdminRoute />}>
          <Route
            path="/admin/jogadores"
            element={<AdminJogadores />}
          />

          <Route
            path="/admin/registrar-racha"
            element={<AdminRegistrarRacha />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App