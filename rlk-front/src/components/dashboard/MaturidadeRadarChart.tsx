import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type { MaturidadeAreaItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: MaturidadeAreaItem[];
}

function MaturidadeRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="area" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Radar
          name="Maturidade"
          dataKey="percentual"
          stroke="#0b5be1"
          fill="#0b5be1"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default MaturidadeRadarChart;
