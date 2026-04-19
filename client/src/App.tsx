import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import ListPage from './pages/ListPage'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/list/:id', element: <ListPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
