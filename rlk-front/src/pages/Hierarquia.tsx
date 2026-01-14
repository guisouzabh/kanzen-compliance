import { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Skeleton, Space, Tree, Typography, message } from 'antd';
import api from '../services/api';

interface Empresa {
  id: number;
  nome: string;
}

interface Unidade {
  id: number;
  nome: string;
  empresa_id: number;
}

interface Area {
  id: number;
  nome: string;
  unidade_id: number;
}

interface SubArea {
  id: number;
  nome: string;
  area_id: number;
}

interface SubArea2 {
  id: number;
  nome: string;
  subarea_id: number;
}

interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
}

function buildTree(
  empresas: Empresa[],
  unidades: Unidade[],
  areas: Area[],
  subareas: SubArea[],
  subareas2: SubArea2[]
): TreeNode[] {
  const unidadesByEmpresa = new Map<number, Unidade[]>();
  const areasByUnidade = new Map<number, Area[]>();
  const subareasByArea = new Map<number, SubArea[]>();
  const subareas2BySubarea = new Map<number, SubArea2[]>();

  for (const unidade of unidades) {
    const list = unidadesByEmpresa.get(unidade.empresa_id) ?? [];
    list.push(unidade);
    unidadesByEmpresa.set(unidade.empresa_id, list);
  }

  for (const area of areas) {
    const list = areasByUnidade.get(area.unidade_id) ?? [];
    list.push(area);
    areasByUnidade.set(area.unidade_id, list);
  }

  for (const subarea of subareas) {
    const list = subareasByArea.get(subarea.area_id) ?? [];
    list.push(subarea);
    subareasByArea.set(subarea.area_id, list);
  }

  for (const subarea of subareas2) {
    const list = subareas2BySubarea.get(subarea.subarea_id) ?? [];
    list.push(subarea);
    subareas2BySubarea.set(subarea.subarea_id, list);
  }

  return empresas.map((empresa) => ({
    title: empresa.nome,
    key: `empresa-${empresa.id}`,
    children: (unidadesByEmpresa.get(empresa.id) ?? []).map((unidade) => ({
      title: unidade.nome,
      key: `unidade-${unidade.id}`,
      children: (areasByUnidade.get(unidade.id) ?? []).map((area) => ({
        title: area.nome,
        key: `area-${area.id}`,
        children: (subareasByArea.get(area.id) ?? []).map((subarea) => ({
          title: subarea.nome,
          key: `subarea-${subarea.id}`,
          children: (subareas2BySubarea.get(subarea.id) ?? []).map((subarea2) => ({
            title: subarea2.nome,
            key: `subarea2-${subarea2.id}`
          }))
        }))
      }))
    }))
  }));
}

function Hierarquia() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [subareas2, setSubareas2] = useState<SubArea2[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    try {
      setCarregando(true);
      const [empresasResp, unidadesResp, areasResp, subareasResp, subareas2Resp] =
        await Promise.all([
          api.get('/empresas'),
          api.get('/unidades'),
          api.get('/areas'),
          api.get('/subareas'),
          api.get('/subareas2')
        ]);

      setEmpresas(empresasResp.data || []);
      setUnidades(unidadesResp.data || []);
      setAreas(areasResp.data || []);
      setSubareas(subareasResp.data || []);
      setSubareas2(subareas2Resp.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar hierarquia');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const treeData = useMemo(
    () => buildTree(empresas, unidades, areas, subareas, subareas2),
    [empresas, unidades, areas, subareas, subareas2]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Hierarquia
        </Typography.Title>
        <Typography.Text type="secondary">
          Visualize a árvore Empresa → Unidade → Área → Subárea → SubÁrea 2.
        </Typography.Text>
      </div>

      <Card>
        {carregando ? (
          <Skeleton active />
        ) : treeData.length === 0 ? (
          <Empty description="Nenhum dado de hierarquia encontrado" />
        ) : (
          <Tree showLine defaultExpandAll treeData={treeData} />
        )}
      </Card>
    </Space>
  );
}

export default Hierarquia;
