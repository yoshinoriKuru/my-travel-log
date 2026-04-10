import { useState } from 'react'
import './App.css'

// 1. 旅行データの型定義
interface TravelCard {
  id: number;
  title: string;
  location: string;
  comment: string;
  mapUrl: string;
}

function App() {
  // 2. サンプルデータ
  const [travels] = useState<TravelCard[]>([
    {
      id: 1,
      title: "初夏の北海道　３泊４日",
      location: "札幌・小樽",
      comment: "海鮮丼が最高でした！小樽運河の夜景も綺麗だった。",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=小樽運河"
    }
  ]);

  return (
    <div className='container'>
      <h1>My Travel Log</h1>

      <div className='card-list'>
        {travels.map((travel) => (
          <div key={travel.id} className='travel-card'>
            <h2>{travel.title}</h2>
            <p><strong>場所：</strong> {travel.location}</p>
            <p>{travel.comment}</p>
            <a href={travel.mapUrl} target='_blank' rel='noopener noreferrer' className='map-button'>
              Googleマップで見る
            </a>
          </div>
        ))}
      </div>    
    </div>
  )
}

export default App
