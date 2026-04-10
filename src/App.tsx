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
  // 2. サンプルデータ
  // const [travels] = useState<TravelCard[]>([
  //   {
  //     id: 1,
  //     title: "初夏の北海道　３泊４日",
  //     area: "北海道",
  //     totalComment: "天候にも恵まれて最高な旅行でした。",
  //     spots: [
  //       {
  //         id: 101,
  //         name: "小樽運河",
  //         comment: "夜のガス灯がとてもロマンチックでした。",
  //         mapUrl: "https://www.google.com/maps/search/?api=1&query=小樽運河"
  //       },
  //       {
  //         id: 102,
  //         name: "札幌市時計台",
  //         comment: "街の中にポツンとあって驚いたけど、歴史を感じた。",
  //         mapUrl: "https://www.google.com/maps/search/?api=1&query=札幌市時計台"
  //       }
  //     ]
  //   }
  // ]);

  // 1. 旅行一覧のデータ
  const [travels, setTravels] = useState<TravelCard[]>([]);

  // 2. フォーム入力中のデータ
  const [formData, setFormData] = useState<TravelForm>({
    title: "",
    area: "",
    totalComment: ""
  })

  // 入力が変更された時の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 保存ボタンが押された時の処理
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const newTravel: TravelCard = {
      ...formData,
      id: Date.now(), // 簡易的なID生成
      spots: []       // 最初は空のリスト
    };

    setTravels([...travels, newTravel]);                    // リストに追加
    setFormData({title: "", area: "", totalComment: ""});   // フォームを空にする
  };

  return (
    <div className='container'>
      <h1>My Travel Log</h1>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className='travel-form'>
        <input
          name='title'
          placeholder='旅行のタイトル（例:北海道 3泊4日）'
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
        <textarea 
          name="totalComment"
          placeholder='全体の感想'
          value={formData.totalComment}
          onChange={handleChange}
        />
        <button type="submit">旅行を登録する</button>
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
