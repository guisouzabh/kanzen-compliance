import { Alert, Empty, Typography } from 'antd';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';

type Status = 'CONFORME' | 'NAO_CONFORME' | 'EM_ANALISE' | 'SEM_ANALISE' | 'EM_REANALISE';

interface AreaMapa {
  id: number;
  nome: string;
  latitude?: number | null;
  longitude?: number | null;
  empresa_nome?: string;
}

interface RequisitoMapa {
  id: number;
  titulo: string;
  status: Status;
  area_responsavel_id: number;
  outras_areas_ids?: number[];
}

type AreaComCoordenadas = AreaMapa & { latitude: number; longitude: number };

interface Props {
  areas: AreaMapa[];
  requisitos: RequisitoMapa[];
}

const statusColor: Record<Status, string> = {
  CONFORME: '#52c41a',
  NAO_CONFORME: '#f5222d',
  EM_ANALISE: '#1677ff',
  SEM_ANALISE: '#faad14',
  EM_REANALISE: '#722ed1'
};

const MAPA_CENTRO: [number, number] = [-51.9253, -14.235];

function criarPopup(area: AreaComCoordenadas, relacionados: RequisitoMapa[]) {
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '260px';

  const titulo = document.createElement('div');
  titulo.style.fontWeight = '700';
  titulo.style.fontSize = '14px';
  titulo.textContent = area.nome;
  wrapper.appendChild(titulo);

  if (area.empresa_nome) {
    const empresa = document.createElement('div');
    empresa.style.color = '#1677ff';
    empresa.style.fontSize = '12px';
    empresa.textContent = area.empresa_nome;
    wrapper.appendChild(empresa);
  }

  const quantidade = document.createElement('div');
  quantidade.style.margin = '6px 0';
  quantidade.textContent = `${relacionados.length} requisito(s)`;
  wrapper.appendChild(quantidade);

  const statusResumo = document.createElement('div');
  statusResumo.style.display = 'flex';
  statusResumo.style.flexWrap = 'wrap';
  statusResumo.style.gap = '6px';

  const contagemStatus = relacionados.reduce<Record<Status, number>>(
    (acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    },
    { CONFORME: 0, NAO_CONFORME: 0, EM_ANALISE: 0, SEM_ANALISE: 0, EM_REANALISE: 0 }
  );

  (Object.keys(contagemStatus) as Status[]).forEach((status) => {
    const total = contagemStatus[status];
    if (!total) return;

    const tag = document.createElement('span');
    tag.style.background = statusColor[status];
    tag.style.color = '#fff';
    tag.style.padding = '4px 8px';
    tag.style.borderRadius = '999px';
    tag.style.fontSize = '11px';
    tag.style.fontWeight = '600';
    tag.textContent = `${status.replace('_', ' ')} (${total})`;
    statusResumo.appendChild(tag);
  });

  wrapper.appendChild(statusResumo);

  const lista = document.createElement('ul');
  lista.style.paddingLeft = '18px';
  lista.style.margin = '8px 0 0';
  relacionados.slice(0, 4).forEach((req) => {
    const item = document.createElement('li');
    item.textContent = `${req.titulo} (${req.status.replace('_', ' ')})`;
    lista.appendChild(item);
  });
  wrapper.appendChild(lista);

  if (relacionados.length > 4) {
    const extra = document.createElement('div');
    extra.style.marginTop = '6px';
    extra.style.color = '#595959';
    extra.style.fontSize = '12px';
    extra.textContent = `+${relacionados.length - 4} requisito(s)`;
    wrapper.appendChild(extra);
  }

  return wrapper;
}

function corDoMarcador(requisitos: RequisitoMapa[]) {
  if (requisitos.some((r) => r.status === 'NAO_CONFORME')) return statusColor.NAO_CONFORME;
  if (requisitos.some((r) => r.status === 'EM_ANALISE')) return statusColor.EM_ANALISE;
  if (requisitos.some((r) => r.status === 'EM_REANALISE')) return statusColor.EM_REANALISE;
  if (requisitos.some((r) => r.status === 'SEM_ANALISE')) return statusColor.SEM_ANALISE;
  if (requisitos.length) return statusColor.CONFORME;
  return '#8c8c8c';
}

function RequisitosMapa({ areas, requisitos }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapaCarregadoRef = useRef(false);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const requisitosPorArea = useMemo(() => {
    const mapa: Record<number, RequisitoMapa[]> = {};

    requisitos.forEach((req) => {
      const areaIds = new Set([req.area_responsavel_id, ...(req.outras_areas_ids || [])]);
      areaIds.forEach((areaId) => {
        mapa[areaId] = mapa[areaId] || [];
        mapa[areaId].push(req);
      });
    });

    return mapa;
  }, [requisitos]);

  const areasComCoordenadas = useMemo<AreaComCoordenadas[]>(
    () =>
      areas
        .map((area) => ({
          ...area,
          latitude: area.latitude != null ? Number(area.latitude) : undefined,
          longitude: area.longitude != null ? Number(area.longitude) : undefined
        }))
        .filter((area): area is AreaComCoordenadas => {
          return Number.isFinite(area.latitude) && Number.isFinite(area.longitude);
        }),
    [areas]
  );

  const areasParaPlotar = useMemo(
    () => areasComCoordenadas.filter((area) => (requisitosPorArea[area.id]?.length || 0) > 0),
    [areasComCoordenadas, requisitosPorArea]
  );

  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MAPA_CENTRO,
      zoom: 3.5
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.on('load', () => {
      mapaCarregadoRef.current = true;
      map.resize();
    });
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const desenharMarcadores = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (!areasParaPlotar.length) return;

      const bounds = new mapboxgl.LngLatBounds();

      areasParaPlotar.forEach((area) => {
        const relacionados = requisitosPorArea[area.id] || [];
        const cor = corDoMarcador(relacionados);

        const marcador = document.createElement('div');
        marcador.style.width = '34px';
        marcador.style.height = '34px';
        marcador.style.borderRadius = '12px';
        marcador.style.background = cor;
        marcador.style.color = '#fff';
        marcador.style.display = 'grid';
        marcador.style.placeItems = 'center';
        marcador.style.fontWeight = '800';
        marcador.style.boxShadow = '0 10px 22px rgba(0,0,0,0.25)';
        marcador.style.border = '2px solid #fff';
        marcador.textContent = String(relacionados.length);

        const popup = new mapboxgl.Popup({ offset: 16 }).setDOMContent(
          criarPopup(area, relacionados)
        );

        const marker = new mapboxgl.Marker({ element: marcador })
          .setLngLat([area.longitude, area.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
        bounds.extend([area.longitude, area.latitude]);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 12 });
      }
    };

    if (map.isStyleLoaded() && mapaCarregadoRef.current) {
      desenharMarcadores();
    } else {
      const handler = () => {
        mapaCarregadoRef.current = true;
        desenharMarcadores();
      };
      map.once('load', handler);
      return () => {
        map.off('load', handler);
      };
    }
  }, [areasParaPlotar, requisitosPorArea]);

  if (!token) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Configure a chave do Mapbox"
        description="Defina a variável VITE_MAPBOX_TOKEN para habilitar a visualização no mapa."
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{
          height: 520,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      />

      {!areasParaPlotar.length ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <Empty description="Nenhuma área com coordenadas para os requisitos filtrados" />
        </div>
      ) : null}

      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
        Marcadores priorizam áreas não conformes (vermelho), em análise (azul) e pendentes (amarelo).
      </Typography.Text>
    </div>
  );
}

export default RequisitosMapa;
