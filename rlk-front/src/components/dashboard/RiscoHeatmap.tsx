import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { RiscoHeatmapItem } from '../../mocks/requisitosDashboard';

interface Props {
  data: RiscoHeatmapItem[];
}

interface HeatmapShapeProps {
  cx: number;
  cy: number;
  payload: RiscoHeatmapItem;
}

const riscoColor = (valor: number) => {
  if (valor >= 5) return '#d32029';
  if (valor >= 4) return '#fa541c';
  if (valor >= 3) return '#faad14';
  if (valor >= 2) return '#40a9ff';
  return '#52c41a';
};

const HeatCell = ({ cx, cy, payload }: HeatmapShapeProps) => {
  const size = 48;
  const color = riscoColor(payload.risco);

  return (
    <g>
      <rect
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        rx={10}
        ry={10}
        fill={color}
        opacity={0.9}
      />
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill="#fff" fontWeight={700}>
        {payload.risco}
      </text>
    </g>
  );
};

function RiscoHeatmap({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="category"
          dataKey="probabilidade"
          name="Probabilidade"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="severidade"
          name="Severidade"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f5' }}
          formatter={(valor: number) => [`Risco ${valor}`, 'Nível']}
          labelFormatter={() => ''}
        />
        <Scatter data={data} shape={(props: HeatmapShapeProps) => <HeatCell {...props} />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default RiscoHeatmap;
