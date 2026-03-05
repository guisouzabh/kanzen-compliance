import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { PlusOutlined, ReloadOutlined, SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import type { InventarioDado, CategoriaDado } from '../types/Inventario';

type InventarioFormValues = {
  categoria_id?: number;
  dado_tratado: string;
  dados_sensiveis?: boolean;
  dados_menor?: boolean;
  tempo_armazenamento?: string | null;
  local_armazenamento?: string | null;
  processo_id?: number | null;
  quantidade_existente?: number | null;
  quantidade_inserida_mes?: number | null;
  quantidade_tratada_mes?: number | null;
  principal_agente?: string | null;
};

function InventarioDados() {
  const [lista, setLista] = useState<InventarioDado[]>([]);
  const [categoriasFiltro, setCategoriasFiltro] = useState<number[]>([]);
  const [filtroSensivel, setFiltroSensivel] = useState<Array<'sim' | 'nao'>>([]);
  const [filtroMenor, setFiltroMenor] = useState<Array<'sim' | 'nao'>>([]);
  const listaFiltrada = useMemo(
    () =>
      lista.filter((i) => {
        if (categoriasFiltro.length && !categoriasFiltro.includes(i.categoria_id ?? -1))
          return false;
        if (filtroSensivel.length) {
          const isSensivel = !!i.dados_sensiveis;
          if (isSensivel && !filtroSensivel.includes('sim')) return false;
          if (!isSensivel && !filtroSensivel.includes('nao')) return false;
        }
        if (filtroMenor.length) {
          const isMenor = !!i.dados_menor;
          if (isMenor && !filtroMenor.includes('sim')) return false;
          if (!isMenor && !filtroMenor.includes('nao')) return false;
        }
        return true;
      }),
    [lista, categoriasFiltro, filtroSensivel, filtroMenor]
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<InventarioFormValues>();
  const estaEditando = editandoId !== null;
  const [categorias, setCategorias] = useState<CategoriaDado[]>([]);
  const [processos, setProcessos] = useState<{ id: number; nome: string }[]>([]);
  const categoriasComContagem = useMemo(() => {
    const counts = new Map<number | 'sem', { id?: number; nome: string; count: number }>();
    lista.forEach((item) => {
      const key = item.categoria_id ?? 'sem';
      const nome =
        categorias.find((c) => c.id === item.categoria_id)?.nome || 'Sem categoria';
      const current = counts.get(key) ?? { id: item.categoria_id, nome, count: 0 };
      counts.set(key, { ...current, count: current.count + 1 });
    });
    return Array.from(counts.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [lista, categorias]);

  function gerarTempId() {
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const [cats, inv, proc] = await Promise.all([
        api.get('/categorias-dados-pessoais'),
        api.get('/inventario-dados'),
        api.get('/processos')
      ]);
      setCategorias(cats.data || []);
      setProcessos(proc.data || []);
      const lista = (inv.data || []).map((i: InventarioDado) => {
        const categoriaId =
          i.categoria_id ||
          cats.data?.find((c: CategoriaDado) => c.nome === i.categoria)?.id ||
          undefined;
        return {
          ...i,
          categoria_id: categoriaId,
          _status: 'salvo',
          _tempId: gerarTempId()
        };
      });
      setLista(lista);
      if (showMessage) message.success('Inventário atualizado');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar inventário');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function iniciarEdicao(item: InventarioDado) {
    form.setFieldsValue({
      categoria_id: item.categoria_id,
      dado_tratado: item.dado_tratado,
      dados_sensiveis: item.dados_sensiveis ?? false,
      dados_menor: item.dados_menor ?? false,
      tempo_armazenamento: item.tempo_armazenamento ?? null,
      local_armazenamento: item.local_armazenamento ?? null,
      processo_id: item.processo_id ?? null,
      quantidade_existente: item.quantidade_existente ?? null,
      quantidade_inserida_mes: item.quantidade_inserida_mes ?? null,
      quantidade_tratada_mes: item.quantidade_tratada_mes ?? null,
      principal_agente: item.principal_agente ?? null
    });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: InventarioFormValues) {
    setSalvando(true);
    try {
      const payload = {
        categoria_id: values.categoria_id,
        dado_tratado: values.dado_tratado.trim(),
        dados_sensiveis: values.dados_sensiveis ?? false,
        dados_menor: values.dados_menor ?? false,
        tempo_armazenamento: values.tempo_armazenamento || null,
        local_armazenamento: values.local_armazenamento || null,
        processo_id: values.processo_id ?? null,
        quantidade_existente: values.quantidade_existente ?? null,
        quantidade_inserida_mes: values.quantidade_inserida_mes ?? null,
        quantidade_tratada_mes: values.quantidade_tratada_mes ?? null,
        principal_agente: values.principal_agente?.trim() || null
      };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/inventario-dados/${editandoId}`, payload);
        const atualizado: InventarioDado = resp.data;
        setLista((prev) => prev.map((i) => (i.id === atualizado.id ? atualizado : i)));
        message.success('Item atualizado');
      } else {
        const resp = await api.post('/inventario-dados', payload);
        const criado: InventarioDado = resp.data;
        setLista((prev) => [criado, ...prev]);
        message.success('Item criado');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar item');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/inventario-dados/${id}`);
      setLista((prev) => prev.filter((i) => i.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Item removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir item');
    }
  }

  function addLinhaVazia() {
    const tempId = gerarTempId();
    setLista((prev) => [
      ...prev,
      { _tempId: tempId, categoria_id: undefined, dado_tratado: '', _status: 'novo' }
    ]);
  }

  async function salvarLinha(item: InventarioDado) {
    if (!item.categoria_id || !item.dado_tratado.trim()) {
      message.warning('Selecione categoria e preencha o dado pessoal antes de salvar.');
      return;
    }
    const isNovo = !item.id;
    const payload = {
      categoria_id: item.categoria_id,
      dado_tratado: item.dado_tratado.trim(),
      dados_sensiveis: item.dados_sensiveis ?? false,
      dados_menor: item.dados_menor ?? false,
      tempo_armazenamento: item.tempo_armazenamento ?? null,
      local_armazenamento: item.local_armazenamento ?? null,
      processo_id: item.processo_id ?? null,
      quantidade_existente: item.quantidade_existente ?? null,
      quantidade_inserida_mes: item.quantidade_inserida_mes ?? null,
      quantidade_tratada_mes: item.quantidade_tratada_mes ?? null,
      principal_agente: item.principal_agente ?? null
    };
    setLista((prev) =>
      prev.map((i) =>
        i.id === item.id || i._tempId === item._tempId ? { ...i, _loading: true } : i
      )
    );
    try {
      if (isNovo) {
        const resp = await api.post('/inventario-dados', payload);
        const criado: InventarioDado = resp.data;
        setLista((prev) =>
          prev.map((i) =>
            i._tempId === item._tempId ? { ...criado, _status: 'salvo' } : i
          )
        );
      } else {
        const resp = await api.put(`/inventario-dados/${item.id}`, payload);
        const atualizado: InventarioDado = resp.data;
        setLista((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...atualizado, _status: 'salvo' } : i
          )
        );
      }
      message.success('Linha salva');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar linha');
    } finally {
      setLista((prev) =>
        prev.map((i) =>
          i.id === item.id || i._tempId === item._tempId ? { ...i, _loading: false } : i
        )
      );
    }
  }

  function marcarAlterado(id?: number, _tempId?: string, patch?: Partial<InventarioDado>) {
    setLista((prev) =>
      prev.map((i) => {
        const match = (id && i.id === id) || (_tempId && i._tempId === _tempId);
        if (!match) return i;
        return { ...i, ...patch, _status: i.id ? 'alterado' : 'novo' };
      })
    );
  }

  function removerLinha(item: InventarioDado) {
    if (!item.id) {
      setLista((prev) => prev.filter((i) => i._tempId !== item._tempId));
      return;
    }
    handleDelete(item.id);
  }

  const colunas = [
    {
      title: 'Categoria do Dado Pessoal',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 240,
      fixed: 'left' as const,
      render: (_: string, record: InventarioDado) => (
        <Select
          style={{ minWidth: 220 }}
          value={record.categoria_id}
          placeholder="Categoria"
          options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          onChange={(val) => marcarAlterado(record.id, record._tempId, { categoria_id: val })}
          showSearch
          optionFilterProp="label"
        />
      )
    },
    {
      title: 'Dado pessoal tratado',
      dataIndex: 'dado_tratado',
      key: 'dado_tratado',
      width: 360,
      fixed: 'left' as const,
      render: (_: string, record: InventarioDado) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={record.dado_tratado}
          placeholder="Ex: Nome completo, Idade..."
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, { dado_tratado: e.target.value })
          }
        />
      )
    },
    {
      title: 'Status',
      dataIndex: '_status',
      width: 110,
      render: (value: InventarioDado['_status']) => (
        <Tag color={value === 'alterado' ? 'gold' : value === 'novo' ? 'blue' : 'green'}>
          {value === 'alterado' ? 'Alterado' : value === 'novo' ? 'Novo' : 'Salvo'}
        </Tag>
      )
    },
    {
      title: 'Sensíveis',
      dataIndex: 'dados_sensiveis',
      width: 120,
      render: (_: any, record: InventarioDado) => (
        <Select
          style={{ width: 120 }}
          value={record.dados_sensiveis ?? false}
          options={[
            { value: true, label: 'Sim' },
            { value: false, label: 'Não' }
          ]}
          onChange={(val) => marcarAlterado(record.id, record._tempId, { dados_sensiveis: val })}
        />
      )
    },
    {
      title: 'Menor',
      dataIndex: 'dados_menor',
      width: 120,
      render: (_: any, record: InventarioDado) => (
        <Select
          style={{ width: 120 }}
          value={record.dados_menor ?? false}
          options={[
            { value: true, label: 'Sim' },
            { value: false, label: 'Não' }
          ]}
          onChange={(val) => marcarAlterado(record.id, record._tempId, { dados_menor: val })}
        />
      )
    },
    {
      title: 'Tempo',
      dataIndex: 'tempo_armazenamento',
      width: 180,
      render: (_: string, record: InventarioDado) => (
        <Input
          value={record.tempo_armazenamento ?? ''}
          placeholder="Ex: 5 anos"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, { tempo_armazenamento: e.target.value })
          }
        />
      )
    },
    {
      title: 'Local',
      dataIndex: 'local_armazenamento',
      width: 200,
      render: (_: string, record: InventarioDado) => (
        <Input
          value={record.local_armazenamento ?? ''}
          placeholder="Ex: Nuvem / Data center"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, { local_armazenamento: e.target.value })
          }
        />
      )
    },
    {
      title: 'Processo',
      dataIndex: 'processo_id',
      render: (_: any, record: InventarioDado) => {
        const nome = processos.find((p) => p.id === record.processo_id)?.nome;
        return (
          <Select
            style={{ minWidth: 200 }}
            allowClear
            placeholder="Selecione"
            options={processos.map((p) => ({ value: p.id, label: p.nome }))}
            value={record.processo_id ?? undefined}
            onChange={(val) => marcarAlterado(record.id, record._tempId, { processo_id: val ?? null })}
            showSearch
            optionFilterProp="label"
          >
            {nome || ''}
          </Select>
        );
      }
    },
    {
      title: 'Qtd existente',
      dataIndex: 'quantidade_existente',
      width: 150,
      render: (_: number, record: InventarioDado) => (
        <Input
          type="number"
          min={0}
          value={record.quantidade_existente ?? undefined}
          placeholder="0"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, {
              quantidade_existente: e.target.value === '' ? null : Number(e.target.value)
            })
          }
        />
      )
    },
    {
      title: 'Qtd inserida/mês',
      dataIndex: 'quantidade_inserida_mes',
      width: 170,
      render: (_: number, record: InventarioDado) => (
        <Input
          type="number"
          min={0}
          value={record.quantidade_inserida_mes ?? undefined}
          placeholder="0"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, {
              quantidade_inserida_mes: e.target.value === '' ? null : Number(e.target.value)
            })
          }
        />
      )
    },
    {
      title: 'Qtd tratada/mês',
      dataIndex: 'quantidade_tratada_mes',
      width: 170,
      render: (_: number, record: InventarioDado) => (
        <Input
          type="number"
          min={0}
          value={record.quantidade_tratada_mes ?? undefined}
          placeholder="0"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, {
              quantidade_tratada_mes: e.target.value === '' ? null : Number(e.target.value)
            })
          }
        />
      )
    },
    {
      title: 'Principal agente',
      dataIndex: 'principal_agente',
      width: 200,
      render: (_: string, record: InventarioDado) => (
        <Input
          value={record.principal_agente ?? ''}
          placeholder="Ex: Atendimento, RH"
          onChange={(e) =>
            marcarAlterado(record.id, record._tempId, { principal_agente: e.target.value })
          }
        />
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 140,
      render: (_: any, item: InventarioDado) => (
        <Space>
          <Button
            icon={<SaveOutlined />}
            size="small"
            loading={item._loading}
            onClick={() => salvarLinha(item)}
          />
          <Popconfirm
            title="Excluir item?"
            okText="Sim"
            cancelText="Não"
            onConfirm={() => removerLinha(item)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
          >
            Novo item
          </Button>
        </Space>
      </Flex>

      <Flex align="start" gap={16} wrap={false} style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <Card bodyStyle={{ padding: 16, width: '100%' }} style={{ flex: 1 }}>
          <Flex gap={12} wrap align="center" style={{ marginBottom: 12 }}>
            <div style={{ minWidth: 260 }}>
              <Typography.Text strong>Categorias</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="Filtrar categorias"
                value={categoriasFiltro}
                options={categoriasComContagem.map((cat) => ({
                  value: cat.id ?? -1,
                  label: `${cat.nome} (${cat.count})`
                }))}
                style={{ width: '100%' }}
                onChange={(vals) =>
                  setCategoriasFiltro(vals.map((v) => (v === -1 ? undefined : Number(v))))
                }
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Typography.Text strong>Sensíveis</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="Sensíveis"
                value={filtroSensivel}
                options={[
                  { value: 'sim', label: 'Sim' },
                  { value: 'nao', label: 'Não' }
                ]}
                style={{ width: '100%' }}
                onChange={(vals) => setFiltroSensivel(vals as Array<'sim' | 'nao'>)}
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <Typography.Text strong>Menor de idade</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                placeholder="Menor de idade"
                value={filtroMenor}
                options={[
                  { value: 'sim', label: 'Sim' },
                  { value: 'nao', label: 'Não' }
                ]}
                style={{ width: '100%' }}
                onChange={(vals) => setFiltroMenor(vals as Array<'sim' | 'nao'>)}
              />
            </div>
          </Flex>
          {listaFiltrada.length === 0 && !carregando ? (
            <Empty description="Nenhum dado cadastrado" />
          ) : (
            <Table
              rowKey={(row) => row.id?.toString() ?? row._tempId ?? gerarTempId()}
              dataSource={listaFiltrada}
              columns={colunas}
              loading={carregando}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1400, y: 480 }}
            />
          )}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            style={{ marginTop: 12 }}
            onClick={addLinhaVazia}
          >
            Adicionar linha
          </Button>
        </Card>
      </Flex>

      {/* Modal antigo mantido, mas não usado; pronto para remoção se desejar */}
      <Modal
        title={estaEditando ? 'Editar item' : 'Novo item'}
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Categoria do Dado Pessoal"
            name="categoria_id"
            rules={[{ required: true, message: 'Selecione a categoria' }]}
          >
            <Select
              placeholder="Selecione"
              options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Dado pessoal tratado"
            name="dado_tratado"
            rules={[{ required: true, message: 'Descreva o dado pessoal' }]}
          >
            <Input.TextArea rows={4} placeholder="Ex: Nome completo, Idade, Nacionalidade..." />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="Dados sensíveis" name="dados_sensiveis" initialValue={false}>
              <Select
                options={[
                  { value: true, label: 'Sim' },
                  { value: false, label: 'Não' }
                ]}
              />
            </Form.Item>
            <Form.Item label="Dados de menor" name="dados_menor" initialValue={false}>
              <Select
                options={[
                  { value: true, label: 'Sim' },
                  { value: false, label: 'Não' }
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item label="Tempo de armazenamento" name="tempo_armazenamento">
            <Input placeholder="Ex: 5 anos, 180 dias, até revogação" maxLength={255} />
          </Form.Item>

          <Form.Item label="Local de armazenamento" name="local_armazenamento">
            <Input placeholder="Ex: Servidor EU, Nuvem AWS, Data center interno" maxLength={255} />
          </Form.Item>

          <Form.Item label="Processo envolvido" name="processo_id">
            <Select
              placeholder="Selecione o processo"
              allowClear
              options={processos.map((p) => ({ value: p.id, label: p.nome }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="Quantidade existente" name="quantidade_existente">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item label="Quantidade inserida por mês" name="quantidade_inserida_mes">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item label="Quantidade tratada por mês" name="quantidade_tratada_mes">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
          </Space>

          <Form.Item label="Principal agente" name="principal_agente">
            <Input placeholder="Ex: Atendimento, RH, Comercial" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default InventarioDados;
