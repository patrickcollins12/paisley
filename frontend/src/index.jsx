import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import './i18n';

import { routeTree } from './routeTree.gen.js';

import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AuthContextProvider, useAuth } from "@/auth/AuthContext.jsx"

const router = createRouter({
  routeTree,
  context: {
    auth: undefined
  }
});

function App() {
  const authContext = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [authContext]);

  return <RouterProvider router={router} context={{ auth: authContext }} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </React.StrictMode>
)
