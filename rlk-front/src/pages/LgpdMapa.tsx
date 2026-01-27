import { Card, Button, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';

/**
 * Página estática que exibe o diagrama LGPD fornecido
 * e oferece um CTA para o Inventário de Dados Pessoais.
 *
 * Observação: coloque o arquivo da imagem em
 * `rlk-front/public/lgpd-mapa.png` (ou ajuste o src abaixo).
 */
function LgpdMapa() {
  const imageSrc = '/lgpd-mapa.png';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Jornada LGPD
      </Typography.Title>
      <Typography.Text type="secondary">
        Visualize as fases e áreas da adequação e acesse rapidamente o Inventário de Dados Pessoais.
      </Typography.Text>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          overflow: 'hidden',
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            background: '#0f1f3a',
            minHeight: 480
          }}
        >
          <img
            src={imageSrc}
            alt="Mapa LGPD"
            style={{
              width: '100%',
              display: 'block',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // fallback para evitar quebra se a imagem não estiver presente
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              style={{
                pointerEvents: 'auto',
                boxShadow: '0 8px 20px rgba(11,91,225,0.35)'
              }}
            >
              <Link to="/inventario-dados" style={{ color: '#fff' }}>
                Inventário de Dados Pessoais
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </Space>
  );
}

export default LgpdMapa;
