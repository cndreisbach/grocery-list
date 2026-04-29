import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ListPage from './pages/ListPage'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/list/:id',
    element: <ProtectedRoute><ListPage /></ProtectedRoute>,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
