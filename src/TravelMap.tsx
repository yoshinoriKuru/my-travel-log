import React, { useEffect, useRef} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


// App.tsxで定義している方と同じものを使用する
interface Spot {
  id: string;
  name: string;
  comment: string;
  mapUrl: string;
  photo?: string;
  lat: number;
  lng: number;
}

interface TravelMapSpots {
  spots: Spot[];
  onClose: () => void;
}

const TravelMap: React.FC<TravelMapSpots> = ({ spots, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(()=> {
    if (!mapContainer.current) return;

    // 地図の初期化
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          gsi: {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: "国土地理院",
          }
        },
        layers: [{ id: 'gsi-layer', type: 'raster', source: 'gsi' }]
      },
      center: [139.6917, 35.6895],
      zoom: 9
    });

    // スポットを全てピン刺し
    if (spots.length > 0) {
      const bounds = new maplibregl.LngLatBounds();

      spots.forEach(spot => {
        // ピン(マーカー)を作成
        new maplibregl.Marker({ color: "#ff4d4d" })
          .setLngLat([spot.lng, spot.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${spot.name}</b>`))
          .addTo(map);
        bounds.extend([spot.lng, spot.lat]);
      });

      // 全てのピンが収まるように表示範囲を調整
      map.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }

    return () => map.remove();
  }, [spots]);

  return (
    <div className='map-modal-overlay'>
      <div className='map-modal-content'>
        <button type="button" className='map-close-button' onClick={onClose}>
          閉じる
        </button>
        <div ref={mapContainer} className='map-canvas' />
      </div>
    </div>
  );
};

export default TravelMap;