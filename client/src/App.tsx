import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ListPage from './pages/ListPage'

function StandaloneRedirect() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  const lastList = localStorage.getItem('lastList')
  if (isStandalone && lastList) return <Navigate to={`/list/${lastList}`} replace />
  return <Home />
}

const router = createBrowserRouter([
  { path: '/', element: <StandaloneRedirect /> },
  { path: '/list/:id', element: <ListPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
