import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import type { RequisitosPorAreaItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: RequisitosPorAreaItem[];
}

function RequisitosPorAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="area" type="category" width={120} />
        <Tooltip />
        <Bar dataKey="quantidade" fill="#0b5be1" radius={[0, 10, 10, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RequisitosPorAreaChart;
