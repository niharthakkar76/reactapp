import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'
import History from './History'
import Login from './Login'
import theme from './theme'
import './index.css'
import StockDetails from './StockDetails'

// Auth guard component
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  return isAuthenticated ? children : <Navigate to="/" replace />
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: 
      <PrivateRoute>
        <App />
      </PrivateRoute>
  },
  {
    path: "/history",
    element: 
      <PrivateRoute>
        <History />
      </PrivateRoute>
  },
  {
    path: "/stock/:symbol",
    element: 
      <PrivateRoute>
        <StockDetails />
      </PrivateRoute>
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
)
