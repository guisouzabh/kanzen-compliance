import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Empresas from './pages/Empresas';
import Requisitos from './pages/Requisitos';
import Dashboard from './pages/Dashboard';
import Areas from './pages/Areas';
import Usuarios from './pages/Usuarios';
import Unidades from './pages/Unidades';
import Subareas from './pages/Subareas';
import Subarea2 from './pages/Subarea2';
import Hierarquia from './pages/Hierarquia';
import Notificacoes from './pages/Notificacoes';
import DocumentosRegulatorios from './pages/DocumentosRegulatorios';
import DocumentosEmpresa from './pages/DocumentosEmpresa';
import DocumentoConteudo from './pages/DocumentoConteudo';
import DocumentosModeloSecoes from './pages/DocumentosModeloSecoes';
import DocumentosConteudoSecoes from './pages/DocumentosConteudoSecoes';
import AssistenteSecoes from './pages/AssistenteSecoes';
import InventarioDados from './pages/InventarioDados';
import CategoriasDados from './pages/CategoriasDados';
import LgpdMapa from './pages/LgpdMapa';
import Processos from './pages/Processos';
import SolicitacoesTitular from './pages/SolicitacoesTitular';
import PainelMaturidadeSancoes from './pages/PainelMaturidadeSancoes';
import EmpresaDadosStatus from './pages/EmpresaDadosStatus';
import DiagnosticoLgpd from './pages/DiagnosticoLgpd';
import NovoRequisito from './pages/NovoRequisito';
import MatrizAcoes from './pages/MatrizAcoes';
import { EmpresaProvider } from './contexts/EmpresaContext';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/RequireAuth';
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0b5be1',
          colorInfo: '#0b5be1',
          colorSuccess: '#27ae60',
          borderRadius: 8
        }
      }}
    >
      <AntApp>
        <EmpresaProvider>
          <BrowserRouter>
            <Routes>
              {/* redireciona raiz pro login ou (mais pra frente) pra /empresas */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas */}
              <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/unidades" element={<Unidades />} />
                  <Route path="/areas" element={<Areas />} />
                  <Route path="/subareas" element={<Subareas />} />
                  <Route path="/subareas2" element={<Subarea2 />} />
                  <Route path="/hierarquia" element={<Hierarquia />} />
                  <Route path="/notificacoes" element={<Notificacoes />} />
                  <Route path="/documentos-regulatorios" element={<DocumentosRegulatorios />} />
                  <Route path="/documentos-empresa" element={<DocumentosEmpresa />} />
                  <Route path="/documento-conteudo" element={<DocumentoConteudo />} />
                  <Route path="/documentos-modelo-secoes" element={<DocumentosModeloSecoes />} />
                  <Route path="/documentos-conteudo-secoes" element={<DocumentosConteudoSecoes />} />
                  <Route path="/assistente-secoes" element={<AssistenteSecoes />} />
                  <Route path="/inventario-dados" element={<InventarioDados />} />
                  <Route path="/categorias-dados" element={<CategoriasDados />} />
                  <Route path="/processos" element={<Processos />} />
                  <Route path="/solicitacoes-titular" element={<SolicitacoesTitular />} />
                  <Route path="/painel-maturidade-sancoes" element={<PainelMaturidadeSancoes />} />
                  <Route path="/empresa-dados-status" element={<EmpresaDadosStatus />} />
                  <Route path="/diagnostico-lgpd" element={<DiagnosticoLgpd />} />
                  <Route path="/matriz-acoes" element={<MatrizAcoes />} />
                  <Route path="/lgpd-mapa" element={<LgpdMapa />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/requisitos/novo" element={<NovoRequisito />} />
                  <Route path="/requisitos" element={<Requisitos />} />
                  {/* futuras rotas protegidas entram aqui */}
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </EmpresaProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
