import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import type { StatusStackedItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: StatusStackedItem[];
}

const STATUS_COLORS = {
  naoIniciado: '#bfbfbf',
  emAndamento: '#1677ff',
  concluido: '#52c41a',
  atrasado: '#f5222d'
};

function StatusRequisitosStacked({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="categoria" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="naoIniciado"
          stackId="status"
          name="Não iniciado"
          fill={STATUS_COLORS.naoIniciado}
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="emAndamento"
          stackId="status"
          name="Em andamento"
          fill={STATUS_COLORS.emAndamento}
        />
        <Bar
          dataKey="concluido"
          stackId="status"
          name="Concluído"
          fill={STATUS_COLORS.concluido}
        />
        <Bar
          dataKey="atrasado"
          stackId="status"
          name="Atrasado"
          fill={STATUS_COLORS.atrasado}
          radius={[0, 0, 8, 8]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default StatusRequisitosStacked;
