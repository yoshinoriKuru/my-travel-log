import React, { useEffect, useRef} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';


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
  onClose: () => void;    // 保存せずに閉じる
  onSpotMove: (spotId: string, lat: number, lng: number) => void;   // 完了ボタンを押した時に、確定した移動分を親にまとめて報告する
}

const TravelMap: React.FC<TravelMapSpots> = ({ spots, onClose, onSpotMove }) => {
  // 地図を描画するためのHTML要素を保持するためのRef
  const mapContainer = useRef<HTMLDivElement>(null);
  // 地図インスタンス(機能)を保持するためのRef
  const map = useRef<maplibregl.Map | null>(null);
  // ドラッグした一時的な座標を保持するRef(親のStateを使用しない)　{"spotId": {lat:123, lng:456}}の形式で保存される
  const pendingMoves = useRef<{[key: string]: { lat: number, lng: number }}>({});

  useEffect(()=> {
    if (!mapContainer.current || map.current) return;

    // 地図の初期化
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          gsi: {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: "国土地理院, OpenStreetMap contributors",
          }
        },
        layers: [{ id: 'gsi-layer', type: 'raster', source: 'gsi' }]
      },
      center: [139.6917, 35.6895],
      zoom: 9
    }); 
    
    // 「確実に中身のある変数」としてコピーを作る
    const currentMap = map.current;

    spots.forEach(spot => {
      const marker = new maplibregl.Marker({
        color: "#ff4d4d",
        draggable: true       // ドラッグ可能にする
      })
      .setLngLat([spot.lng, spot.lat])
      .setPopup(new maplibregl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(`<b>${spot.name}</b><br/>ドラッグして移動可能`))
      .addTo(currentMap);

      // ドラッグが終わった時、一時保存Refを更新する
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        pendingMoves.current[spot.id] = { lat: newLngLat.lat, lng: newLngLat.lng };
      });
    });

    // 表示範囲の調整（初回のみ）
    if (spots.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      spots.forEach(s => bounds.extend([s.lng, s.lat]));
      currentMap.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [spots]);

  // 「位置を修正して完了して閉じる」ボタンが押された時の処理
  const handleConfirmSave = () => {
    // 溜まっていた移動（pendingMoves）をすべて親の handleSpotMove に流す
    Object.entries(pendingMoves.current).forEach(([spotId, coords]) => {
      onSpotMove(spotId, coords.lat, coords.lng);
    });
    onClose();    // モーダルを閉じる
  };

  return (
    <div className='map-modal-overlay'>
      <div className='map-modal-content'>
        <div className='map-header'>
          <div className='map-save'>
            <button type='button' className='map-save-confirm-button' onClick={handleConfirmSave}>
              位置修正を完了して閉じる
            </button>
          </div>
          <div className='map-close'>
            <button type="button" className='map-close-button' onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
        <div ref={mapContainer} className='map-canvas' />
      </div>
    </div>
  );
};

export default TravelMap;