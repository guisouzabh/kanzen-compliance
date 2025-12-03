import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Empresas from './pages/Empresas';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/RequireAuth';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* redireciona raiz pro login ou (mais pra frente) pra /empresas */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/empresas" element={<Empresas />} />
            {/* futuras rotas protegidas entram aqui */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
