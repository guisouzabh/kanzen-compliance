import { Card, Typography } from 'antd';

interface ModuloPlaceholderProps {
  title: string;
  description: string;
}

function ModuloPlaceholder({ title, description }: ModuloPlaceholderProps) {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Paragraph style={{ marginBottom: 0, color: '#4b5563' }}>{description}</Typography.Paragraph>
    </Card>
  );
}

export default ModuloPlaceholder;
