import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@teste.com");
  const [senha, setSenha] = useState("123456");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", { email, senha });
      localStorage.setItem("token", response.data.token);
      navigate("/empresas");
    } catch (err: any) {
      setErro(err?.response?.data?.erro || "Erro ao fazer login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-rlkBlue/10 via-gray-100 to-rlkYellow/10">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-rlkBlue mb-2">
          RLK Login
        </h1>
        <p className="text-center text-xs text-gray-500 mb-6">
          Acesse o painel administrativo
        </p>

        {erro && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rlkBlue focus:border-rlkBlue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rlkBlue focus:border-rlkBlue"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={carregando}
            className="w-full bg-rlkBlue text-white py-2.5 rounded-md text-sm font-medium hover:bg-rlkBlueDark transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
