import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { EvolucaoMensalItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: EvolucaoMensalItem[];
}

function EvolucaoConcluidosAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
        <defs>
          <linearGradient id="areaConcluidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#52c41a" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="concluidos"
          name="Concluídos"
          stroke="#52c41a"
          fill="url(#areaConcluidos)"
          strokeWidth={2}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="novos"
          name="Novos requisitos"
          stroke="#1677ff"
          fill="#1677ff10"
          strokeWidth={2}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default EvolucaoConcluidosAreaChart;
