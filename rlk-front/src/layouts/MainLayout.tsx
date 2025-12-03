import { Link, Outlet, useNavigate } from "react-router-dom";

function MainLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <header className="bg-rlkBlue text-white px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* “Logo” simples azul+amarelo */}
          <div className="w-9 h-9 rounded-full bg-rlkYellow flex items-center justify-center">
            <span className="font-bold text-rlkBlue">R</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-wide">RLK</span>
            <span className="text-xs text-white/80">Painel Administrativo</span>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            to="/empresas"
            className="text-sm font-medium hover:text-rlkYellow transition"
          >
            Empresas
          </Link>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm border border-white/40 rounded-md hover:bg-white hover:text-rlkBlue transition"
          >
            Sair
          </button>
        </nav>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
