import { useState } from 'react'
import './App.css'

// 訪れた地点ごとの型
interface Spot {
  id: number;
  name: string;       // 観光地などの名前
  comment: string;    // 訪れた地点ごとの感想
  mapUrl: string;
}

// 1. １つの旅行カードの型定義
interface TravelCard {
  id: number;
  title: string;
  area: string;         // 「北海道」「九州」など
  totalComment: string;
  spots: Spot[];
}

// 入力フォーム専用の型定義(IDは保存時に生成する)
interface TravelForm {
  title: string;
  area: string;
  totalComment: string;
}

function App() {
  // 旅行一覧のデータのState
  const [travels, setTravels] = useState<TravelCard[]>([]);

  // フォーム入力中のデータ(旅行の基本情報用)のState
  const [formData, setFormData] = useState<TravelForm>({
    title: "",
    area: "",
    totalComment: ""
  });

  // 入力が変更された時の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // フォームに入力中の「スポット単体」のState
  const [spotInput, setSpotInput] = useState<Omit<Spot, 'id'>>({
    name: '',
    comment: '',
    mapUrl: '',
  });

  // この旅行に追加予定の「スポットリスト」のState
  const [tempSpots, setTempSpots] = useState<Spot[]>([]);

  // スポット入力欄が変更された時の処理
  const handleSpotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSpotInput({...spotInput, [name]: value});
  };

  // 「スポットをリストに追加」ボタンを押した時の処理
  const addSpotToTempList = () => {
    if (!spotInput.name) return;  // 名前が空なら追加しない

      // 1. スポット名をエンコード(スペースや日本語をURLで使える形式に変換)
      const encodedName = encodeURIComponent(spotInput.name);

      // 2. GoogleMapの検索URLを作成
      const generatedMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
      
      const newSpot: Spot ={
        ...spotInput,
        id: Date.now(),   // 簡易ID
        mapUrl: generatedMapUrl,    // 自動生成したURLをセット
      };
      setTempSpots([...tempSpots, newSpot]);
      setSpotInput({name: "", comment: "", mapUrl: ""});    // 入力欄をクリア
  };

  // 保存ボタンが押された時の処理
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();   // ページが勝手にリロードされるのを防ぐ

    const newTravel: TravelCard = {
      ...formData,
      id: Date.now(), // 簡易的なID生成
      spots: tempSpots     // 溜めておいたスポットリストをここで合体
    };

    setTravels([...travels, newTravel]);                    // リストに追加
    setFormData({title: "", area: "", totalComment: ""});   // フォームを空にする
    setTempSpots([]);                                       // スポットリストをリセット
  };

  return (
    <div className='container'>
      <h1>My Travel Log</h1>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className='travel-form'>
        <h3>1. 旅行の基本情報</h3>
        <input
          name='title'
          placeholder='旅行のタイトル（例:北海道 3泊4日)'
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          name="area"
          placeholder='エリア（例：北海道）'
          value={formData.area}
          onChange={handleChange}
          required
        />

        <hr />

        <h3>2. 訪れたスポットを追加</h3>
        <div className='spot-input-section'>
          <input name="name" placeholder='スポット名(例:小樽運河)' value={spotInput.name} onChange={handleSpotChange} />
          <textarea name="comment" placeholder='スポットの感想' value={spotInput.comment} onChange={handleSpotChange}></textarea>
          {/* <input name="mapUrl" placeholder='GoogleマップのURL' value={spotInput.mapUrl} onChange={handleSpotChange} /> */}
          <button type='button' onClick={addSpotToTempList} className='add-spot-button'>
            このスポットを追加
          </button>
        </div>

        {/* 追加予定のスポット一覧を表示 */}
        <ul className="temp-spot-list">
          {tempSpots.map(spot => (
            <li key={spot.id}>📍 {spot.name}</li>
          ))}
        </ul>

        <hr />

        <textarea
          name="totalComment"
          placeholder='旅行全体の感想'
          value={formData.totalComment}
          onChange={handleChange}
        />
        <button type="submit" className='main-submit-button'>旅行記を保存する</button>
      </form>

      <hr />

      <div className='card-list'>
        {travels.map((travel) => (
          <div key={travel.id} className='travel-card'>
            {/* エリアをバッジとして表示 */}
            <div className='card-header'>
              <span className='area-badge'>{travel.area}</span>
              <h2>{travel.title}</h2>
            </div>
            <p className='total-comment'>{travel.totalComment}</p>

            {/* スポットリストなどを表示 */}
            <div className='spot-list'>
            <h3>訪れたスポット</h3>
            {travel.spots.map((spot) => (
              <div key={spot.id} className='spot-item'>
                <h4>📍 {spot.name}</h4>
                <p>{spot.comment}</p>
                <a href={spot.mapUrl} target='_blank' rel='noopener noreferrer' className='map-link'>
                  マップで見る
                </a>
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>    
    </div>
  )
}

export default App
