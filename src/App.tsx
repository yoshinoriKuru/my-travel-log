import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import TravelMap from './TravelMap';
import { AREA_COORDINATES } from './constants';

// --- 型定義 ---
// スポットの型
interface Spot {
  id: string;
  name: string;
  comment: string;
  mapUrl: string;
  photo?: string;
  lat: number;
  lng: number;
}

// 旅行カードの型
interface TravelCard {
  id: string;
  title: string;
  area: string;
  totalComment: string;
  spots: Spot[];
}

// 入力フォーム用の型
interface TravelForm {
  title: string;
  area: string;
  totalComment: string;
}

function App() {
  // 1. 旅行一覧データのState
  // 初期値はlocalStorageから読み込む
  const [travels, setTravels] = useState<TravelCard[]>(() => {
    const savedTravels = localStorage.getItem('my-travel-logs');
    return savedTravels ? JSON.parse(savedTravels) : [];
  });

  // 2. 地図表示用のState (どの旅行記を地図で開いているか)
  const [activeTravelForMap, setActiveTravelForMap] = useState<TravelCard | null>(null);

  // 3. フォーム入力・編集用のState
  const [formData, setFormData] = useState<TravelForm>({ title: "", area: "", totalComment: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempSpots, setTempSpots] = useState<Spot[]>([]);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [spotInput, setSpotInput] = useState<Omit<Spot, 'id'>>({
    name: '', comment: '', mapUrl: '', photo: '', lat: 0, lng: 0,
  });
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // --- 地図上のピン移動を保存する処理 ---
  const handleSpotMove = (travelId: string, spotId: string, newLat: number, newLng: number) => {
    setTravels(prevTravels => {
      const updated = prevTravels.map(t => {
        if (t.id === travelId) {
          return {
            ...t,
            spots: t.spots.map(s => s.id === spotId ? { ...s, lat: newLat, lng: newLng } : s)
          };
        }
        return t;
      });
      return updated;
    });
  };

  // --- 画像リサイズ・処理 ---
  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("5MBを超える画像は選択できません。");
      return;
    }
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const resized = await resizeImage(reader.result as string);
        setSpotInput(prev => ({ ...prev, photo: resized }));
      };
      reader.readAsDataURL(file);
    }
  };

  const processEditFile = async (file: File, targetSpotId: string) => {
    if (!file.type.startsWith('image/')) {
      alert("画像ファイルを選択して下さい。");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const resized = await resizeImage(reader.result as string);
      setTempSpots(prev => prev.map(s =>
        s.id === targetSpotId ? { ...s, photo: resized } : s
      ));
    };
    reader.readAsDataURL(file);
  };

  // --- 検索・追加ロジック ---
  const fetchCoordinates = async (name: string, area: string) => {
    const query = area ? `${area} ${name}` : `日本 ${name}`;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) { console.error("座標取得失敗:", error); }
    return null;
  };

  const addSpotToTempList = async () => {
    if (!spotInput.name) return;
    const coords = await fetchCoordinates(spotInput.name, formData.area);
    let finalLat = 35.6812, finalLng = 139.7671;

    if (coords) {
      finalLat = coords.lat; finalLng = coords.lng;
    } else if (AREA_COORDINATES[formData.area]) {
      finalLat = AREA_COORDINATES[formData.area].lat;
      finalLng = AREA_COORDINATES[formData.area].lng;
      alert(`${formData.area}付近を設定しました。`);
    }

    const newSpot: Spot = {
      ...spotInput,
      id: crypto.randomUUID(),    // ブラウザ標準のランダムID
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spotInput.name)}`,
      lat: finalLat, lng: finalLng
    };
    setTempSpots([...tempSpots, newSpot]);
    setSpotInput({ name: "", comment: "", mapUrl: "", photo: "", lat: 0, lng: 0 });
  };

  // --- 保存・削除系 ---
  useEffect(() => {
    localStorage.setItem('my-travel-logs', JSON.stringify(travels));
  }, [travels]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (editingId) {
      setTravels(travels.map(t => t.id === editingId ? { ...formData, id: editingId, spots: tempSpots } : t));
    } else {
      setTravels([...travels, { ...formData, id: crypto.randomUUID(), spots: tempSpots }]);
    }
    setFormData({ title: "", area: "", totalComment: "" });
    setTempSpots([]);
    setEditingId(null);
  };

  // スポット入力中のリストから1つ削除する処理
  const deleteTempSpot = (id: string) => {
    setTempSpots(tempSpots.filter((spot) => spot.id !== id));
  };

  // 編集をキャンセルする処理
  const cancelEdit = () => {
    setEditingId(null);   // 編集モード終了
    setFormData({ title: '', area: '', totalComment: ''});    // フォームをクリア
    setTempSpots([]);   // スポットリストをリセット
    setSpotInput({name: '', comment: '', mapUrl: '', photo: '', lat: 0, lng: 0});   // 入力中の中身もクリア
  };

  return (
    <div className='container'>
      <h1>My Travel Log</h1>

      <form onSubmit={handleSubmit} className='travel-form'>
        <h3>{editingId ? "旅行記を編集" : "旅行の基本情報"}</h3>
        <input name='title' placeholder='タイトル' value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <div className='input-group'>
          <label>スポットのエリアを選択して下さい</label>
          <select
            className="area-select"
            value={formData.area}
            required
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          >
            <option value="" disabled>都道府県を選択して下さい</option>

            {Object.keys(AREA_COORDINATES).map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>
        
        <div className='spot-input-section'>
          <input name="name" placeholder='スポット名' value={spotInput.name} onChange={(e) => setSpotInput({...spotInput, name: e.target.value})} />
          <div 
            className="drop-zone" 
            onDrop={(e) => { 
              e.preventDefault(); 
              processFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => mainFileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <input
              type="file"
              ref={mainFileInputRef}
              style={{ display: 'none'}}
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
            {spotInput.photo ? (
              <div className='preview-container'>
                <img src={spotInput.photo} className="preview-img" alt="preview" />
                <div className="preview-overlay">
                  <span>タップして写真を変更</span>
                </div>
                <button 
                  type="button"
                  className='photo-delete-button'
                  onClick={(e) => {
                    e.stopPropagation();    // 親のonClick(ファイル選択)が動かないようにする
                    setSpotInput({ ...spotInput, photo: '' });

                    if (mainFileInputRef.current) {
                      mainFileInputRef.current.value = '';
                    }
                  }}
                >
                  x
                </button>
              </div>
            ) : (
              <div className='placeholder-content'>
                <span className="camera-icon">📷</span>
                <p>クリックまたはドロップして写真を追加</p>
              </div>
            )}
          </div>
          <textarea name="comment" placeholder='感想' value={spotInput.comment} onChange={(e) => setSpotInput({...spotInput, comment: e.target.value})} />
          <button type="button" onClick={addSpotToTempList} className='add-spot-button'>追加</button>
        </div>

        <ul className="temp-spot-list">
          {tempSpots.map(spot => (
            <li key={spot.id} className="temp-spot-item">
              {editingSpotId === spot.id ? (
                // スポット個別の編集モード
                <div className="spot-edit-box">
                  <input 
                    className='edit-input'
                    value={spot.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const encodedName = encodeURIComponent(newName);
                      const newUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;

                      setTempSpots(tempSpots.map(s => s.id === spot.id ? { ...s, name: newName, mapUrl: newUrl } : s));
                    }}
                    placeholder='スポット名'
                  />
                  <div 
                    className='edit-drop-zone'
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      processEditFile(file, spot.id);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById(`file-input-${spot.id}`)?.click()}   // クリックで隠しinputを起動
                  >
                    {/* 隠しinput(ファイル選択ダイアログ用) */}
                    <input 
                      type="file" 
                      id={`file-input-${spot.id}`}
                      style={{ display: 'none' }}
                      accept='image/*'
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processEditFile(file, spot.id);
                      }}
                    />
                    {spot.photo ? (
                      <div className='edit-preview-warpper'>
                        <img src={spot.photo} alt="Preview" className='edit-preview-img'/>
                        <p className='edit-drop-text'>クリックまたはドロップして差し替え</p>
                      </div>
                    ) : (
                      <div className="edit-placeholder">
                        <span className='camera-icon'>📷</span>
                        <p className='edit-drop-text'>写真を準備(クリック / ドロップ)</p>
                      </div>
                    )}
                  </div>
                  <textarea
                    className="edit-textarea"
                    value={spot.comment}
                    onChange={(e) => setTempSpots(tempSpots.map(s => s.id === spot.id ? { ...s, comment: e.target.value} : s))}
                    placeholder="感想"
                  />
                  <div className='edit-box-actions'>
                    <button 
                      type='button'
                      onClick={async () => {
                        // 現在の編集中のスポット名を取得
                        const spotToUpdate = tempSpots.find(s => s.id === spot.id);
                        if (!spotToUpdate) return;

                        // 座標を再検索
                        const coords = await fetchCoordinates(spotToUpdate.name, formData.area);

                        // データを一括更新
                          setTempSpots(tempSpots.map(s => {
                            if (s.id === spot.id) {
                              // 名前を基に新しい Google Maps URL を生成
                              const encodedName = encodeURIComponent(s.name);
                              const newUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
                              return { 
                                ...s, 
                                // 座標が見つかれば更新、見つからなければ今のまま
                                lat: coords ? coords.lat : s.lat,
                                lng: coords ? coords.lng : s.lng,
                                mapUrl: newUrl 
                              };
                            }
                            return s;
                          }));

                          if (!coords) {
                            alert("新しい場所の座標が見つかりませんでした。ピンの位置は変わりません。")
                          }

                          setEditingSpotId(null);
                      }}
                      className='spot-done-button'
                    >
                      完了
                    </button>
                  </div>
                </div>
              ) : (
                <div className='spot-display-row'>
                  {/* 通常モード */}
                  <span className='spot-name-text'>📍 {spot.name}</span>
                  <div className='spot-item-actions'>
                    <button 
                      type="button"
                      onClick={() => setEditingSpotId(spot.id)}
                      className='edit-mini-button'
                      title='名前や感想を修正'
                    >
                      編集する
                    </button>
                    <button 
                      type="button"
                      onClick={() => deleteTempSpot(spot.id)}
                      className='delete-mini-button'
                      title='削除'
                    >
                      x
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {editingId != null && (
          <div className='edit-actions-footer'>
            <button type="button" onClick={cancelEdit} className='cancel-edit-button'>
              編集をキャンセルする
            </button>
          </div>
        )}

        <textarea name="totalComment" placeholder='全体の感想' value={formData.totalComment} onChange={(e) => setFormData({...formData, totalComment: e.target.value})} />
        <button type='submit' className='main-submit-button'>保存</button>
      </form>

      <div className='card-list'>
        {travels.map((travel) => (
          <div key={travel.id} className='travel-card'>
            <span className='area-badge' style={{ cursor: 'pointer' }} onClick={() => setActiveTravelForMap(travel)}>
              {travel.area}
            </span>
            <div className='header-main'>
              <h2>{travel.title}</h2>
              <button onClick={() => setTravels(travels.filter(t => t.id !== travel.id))} className='delete-button'>削除</button>
              <button onClick={() => { setEditingId(travel.id); setFormData(travel); setTempSpots(travel.spots); window.scrollTo(0,0); }} className='edit-button'>編集</button>
            </div>
            
            <div className='spot-list'>
              {travel.spots.map(spot => (
                <div key={spot.id} className='spot-item'>
                  <h4>📍 {spot.name}</h4>
                  <a href={spot.mapUrl} target='_blank' rel='noopener noreferrer' className='map-link'>
                    GoogleMapで見る
                  </a>
                  {spot.photo && <img src={spot.photo} className='spot-card-img' alt={spot.name} />}
                  <p>{spot.comment}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeTravelForMap && (
        <TravelMap
          spots={activeTravelForMap.spots}
          onClose={() => setActiveTravelForMap(null)}
          onSpotMove={(spotId, lat, lng) => handleSpotMove(activeTravelForMap.id, spotId, lat, lng)}
        />
      )}
    </div>
  );
}

export default App;