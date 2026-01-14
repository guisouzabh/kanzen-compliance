import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { NormaNode } from '../../mocks/requisitosDashboard';

interface Props {
  data: NormaNode[];
}

interface TreemapTileProps extends NormaNode {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  root?: TreemapTileProps;
  children?: TreemapTileProps[];
  payload?: TreemapTileProps;
}

const COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#faad14', '#9254de', '#f759ab'];

const renderCustomizedContent = (props: TreemapTileProps) => {
  const { depth, x, y, width, height, name, value, index } = props;
  const color = COLORS[index % COLORS.length];

  if (width < 40 || height < 30) {
    return null;
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth === 1 ? `${color}30` : `${color}70`,
          stroke: '#fff'
        }}
      />
      <text x={x + 6} y={y + 20} fill="#0f172a" fontSize={12} fontWeight={600}>
        {name}
      </text>
      {typeof value === 'number' && (
        <text x={x + 6} y={y + 38} fill="#475569" fontSize={12}>
          {value} reqs
        </text>
      )}
    </g>
  );
};

function NormasTreemap({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <Treemap
        data={data}
        dataKey="value"
        stroke="#fff"
        content={renderCustomizedContent}
        animationDuration={400}
      >
        <Tooltip />
      </Treemap>
    </ResponsiveContainer>
  );
}

export default NormasTreemap;
