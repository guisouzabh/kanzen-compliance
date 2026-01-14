import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { RevisaoPorAreaItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: RevisaoPorAreaItem[];
}

const corSla = (dias: number, sla: number) => {
  if (dias <= sla * 0.6) return '#52c41a';
  if (dias <= sla) return '#faad14';
  return '#f5222d';
};

function RevisaoPorAreaBarChart({ data }: Props) {
  const slaReferencia = data.length ? Math.max(...data.map((item) => item.slaDias)) : 0;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="area" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {slaReferencia ? (
          <ReferenceLine
            y={slaReferencia}
            label={`SLA máximo (${slaReferencia}d)`}
            stroke="#1677ff"
            strokeDasharray="4 4"
          />
        ) : null}
        <Bar dataKey="diasSemRevisao" name="Dias desde última revisão">
          {data.map((item) => (
            <Cell key={item.area} fill={corSla(item.diasSemRevisao, item.slaDias)} radius={[6, 6, 0, 0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RevisaoPorAreaBarChart;
