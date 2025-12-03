import { useEffect, useState } from 'react';
import api from '../services/api';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  matriz_ou_filial: string;
  razao_social: string;
}

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // estado do formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [matrizOuFilial, setMatrizOuFilial] = useState<'MATRIZ' | 'FILIAL'>('MATRIZ');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [salvando, setSalvando] = useState(false);

  // id da empresa em edição (null = modo criação)
  const [empresaEditandoId, setEmpresaEditandoId] = useState<number | null>(null);

  async function carregarEmpresas() {
    try {
      setCarregando(true);
      const response = await api.get('/empresas');
      setEmpresas(response.data);
      setErro(null);
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'Erro ao carregar empresas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  // Quando clicar em uma linha, entra em modo edição
  function handleEditarClick(empresa: Empresa) {
    setEmpresaEditandoId(empresa.id);
    setNome(empresa.nome);
    setCnpj(empresa.cnpj);
    setMatrizOuFilial(empresa.matriz_ou_filial as 'MATRIZ' | 'FILIAL');
    setRazaoSocial(empresa.razao_social);
    setErro(null);
  }

  function limparFormulario() {
    setEmpresaEditandoId(null);
    setNome('');
    setCnpj('');
    setMatrizOuFilial('MATRIZ');
    setRazaoSocial('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      if (empresaEditandoId === null) {
        // CRIAR
        const response = await api.post('/empresas', {
          nome,
          cnpj,
          matriz_ou_filial: matrizOuFilial,
          razao_social: razaoSocial
        });

        setEmpresas(prev => [...prev, response.data]);
      } else {
        // ATUALIZAR
        const response = await api.put(`/empresas/${empresaEditandoId}`, {
          nome,
          cnpj,
          matriz_ou_filial: matrizOuFilial,
          razao_social: razaoSocial
        });

        const atualizada: Empresa = response.data;

        setEmpresas(prev =>
          prev.map(emp => (emp.id === atualizada.id ? atualizada : emp))
        );
      }

      limparFormulario();
    } catch (err: any) {
      console.error('Erro ao salvar empresa:', err?.response?.data || err);
      setErro(err?.response?.data?.erro || 'Erro ao salvar empresa');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    const confirma = window.confirm(`Tem certeza que deseja excluir a empresa ${id}?`);
    if (!confirma) return;

    try {
      await api.delete(`/empresas/${id}`);
      setEmpresas(prev => prev.filter(e => e.id !== id));

      // se eu estava editando essa empresa, limpa o form
      if (empresaEditandoId === id) {
        limparFormulario();
      }
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'Erro ao excluir empresa');
    }
  }

  if (carregando) return <p>Carregando empresas...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Empresas</h1>

      {erro && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      {/* Formulário de criação/edição */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>{empresaEditandoId ? `Editando empresa #${empresaEditandoId}` : 'Cadastrar nova empresa'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Nome<br />
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              CNPJ<br />
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Matriz ou Filial<br />
              <select
                value={matrizOuFilial}
                onChange={e => setMatrizOuFilial(e.target.value as 'MATRIZ' | 'FILIAL')}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="MATRIZ">MATRIZ</option>
                <option value="FILIAL">FILIAL</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Razão Social<br />
              <input
                type="text"
                value={razaoSocial}
                onChange={e => setRazaoSocial(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={salvando} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
            {salvando
              ? 'Salvando...'
              : empresaEditandoId
                ? 'Salvar alterações'
                : 'Salvar'}
          </button>

          {empresaEditandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              style={{ padding: '0.5rem 1rem' }}
            >
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      {/* Tabela de listagem */}
      <section>
        <h2>Lista de empresas</h2>
        {empresas.length === 0 ? (
          <p>Nenhuma empresa cadastrada.</p>
        ) : (
          <table border={1} cellPadding={8} style={{ marginTop: '1rem', width: '100%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Matriz/Filial</th>
                <th>Razão Social</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => handleEditarClick(emp)}
                  style={{ cursor: 'pointer', background: emp.id === empresaEditandoId ? '#eef' : 'transparent' }}
                >
                  <td>{emp.id}</td>
                  <td>{emp.nome}</td>
                  <td>{emp.cnpj}</td>
                  <td>{emp.matriz_ou_filial}</td>
                  <td>{emp.razao_social}</td>
                  <td>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // evita disparar edição ao clicar em excluir
                        handleDelete(emp.id);
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Empresas;
