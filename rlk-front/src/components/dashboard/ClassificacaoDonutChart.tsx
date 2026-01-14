import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from 'recharts';
import type { ClassificacaoDistribuicaoItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: ClassificacaoDistribuicaoItem[];
}

const COLORS = ['#0b5be1', '#13c2c2', '#52c41a', '#faad14', '#f759ab', '#9254de'];

function ClassificacaoDonutChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          data={data}
          dataKey="valor"
          nameKey="classificacao"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.classificacao} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default ClassificacaoDonutChart;
