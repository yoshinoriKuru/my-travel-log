import React, { useState, useEffect } from 'react'
import './App.css'

// 訪れた地点ごとの型
interface Spot {
  id: number;
  name: string;       // 観光地などの名前
  comment: string;    // 訪れた地点ごとの感想
  mapUrl: string;
  photo?: string;
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
  // 初期値をlocalStorageから読み込む。初回アクセス時は空配列[]を使う
  const [travels, setTravels] = useState<TravelCard[]>(() => {
    const savedTravels = localStorage.getItem('my-travel-logs');
    return savedTravels ? JSON.parse(savedTravels) : [];
  });

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
    photo: ''
  });

  // ファイルを処理する関数
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        // 写真データをBase64文字列として保存
        setSpotInput(prev => ({ ...prev, photo: reader.result as string }));
      };
      // addEventListenerを使用する時(1つのイベントに対して、複数の処理を登録できる)
      // reader.addEventListener("load", () => {
      //   setSpotInput(prev => ({ ...prev, photo: reader.result as string }));
      // });

      reader.readAsDataURL(file);
    } else {
      alert("画像ファイル(jpg, png等)を選択して下さい。");
    }
  };

  // ドロップ時の処理
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();     // ブラウザが画像を開くのを防ぐ
    e.stopPropagation();    // イベントの伝播停止

    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  // ドラッグオーバー(これがないとドロップが反応しない)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // ドラッグエンターした時の処理
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  // 編集中の旅行記のIDを保持する(nullなら新規作成モード)
  const [editingId, setEditingId] = useState<number | null>(null);

  // 編集ボタンが押された時の処理
  const startEdit = (travel: TravelCard) => {
    setEditingId(travel.id);
    setFormData({
      title: travel.title,
      area: travel.area,
      totalComment: travel.totalComment
    });
    setTempSpots(travel.spots);   // スポットリストもフォームに呼び戻す

    // 画面の一番上(フォームがある場所)へスムーズにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 編集をキャンセルする処理
  const cancelEdit = ()=> {
    setEditingId(null);
    setFormData({ title: '', area: '', totalComment: '' });
    setTempSpots([]);
  };

  // travelsが更新されるたびにlocalStorageに保存する
  // [travels]を監視対象に指定し、travelsに変化（追加や削除）があった瞬間に自動でlocalStorageを最新状態に上書きする
  useEffect(() => {
    localStorage.setItem('my-travel-logs', JSON.stringify(travels));
  }, [travels]);

  // 保存ボタンが押された時の処理
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();   // ページが勝手にリロードされるのを防ぐ
    
    if (editingId !== null) {
      // [編集モード]既存のデータをマップして、IDが一致するものだけ差し替える
      const updatedTravels = travels.map((t) =>
        t.id === editingId ? { ...formData, id: editingId, spots: tempSpots } : t
      );
      setTravels(updatedTravels);
      setEditingId(null);     // 編集モード終了
    } else {
      // [新規作成モード]
      const newTravel: TravelCard = {
        ...formData,
        id: Date.now(), // 簡易的なID生成
        spots: tempSpots     // 溜めておいたスポットリストをここで合体
      };
      setTravels([...travels, newTravel]);                    // リストに追加
    }
    
    // 共通の初期化処理
    setFormData({title: "", area: "", totalComment: ""});   // フォームを空にする
    setTempSpots([]);                                       // スポットリストをリセット
  };

  // 旅行記を削除する処理
  const deleteTravel = (id: number) => {
    if (window.confirm("この旅行記を削除してもよろしいですか？")) {
      const updatedTravels = travels.filter((travel) => travel.id !== id);
      setTravels(updatedTravels);   // useEffectが動くので、localStorageも自動で更新される
    }
  };

  // スポット入力中のリストから1つ削除する処理
  const deleteTempSpot = (id: number) => {
    setTempSpots(tempSpots.filter((spot) => spot.id !== id));
  };

  return (
    <div className='container'>
      <h1>My Travel Log</h1>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className='travel-form'>
        <h3>{editingId !== null ? "旅行記を編集" : "1. 旅行の基本情報"}</h3>
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
          <button type='button' onClick={addSpotToTempList} className='add-spot-button'>
            このスポットを追加
          </button>
          {/* ドロップ領域とプレビュー */}
          <div
            className={`drop-zone ${spotInput.photo ? 'has-photo' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
          >
            {spotInput.photo ? (
              <div className='preview-container'>
                <img src={spotInput.photo} alt="Selected" className='preview-img' />
                <button type='button' onClick={() => setSpotInput({ ...spotInput, photo: '' })}>
                  写真を変更
                </button>
              </div>
            ) : (
              <p>📷 写真をドラッグ＆ドロップ</p>
            )}
          </div>

          <button type="button" onClick={addSpotToTempList} className='add-spot-button'>
            スポットを追加
          </button>
        </div>

        {/* 追加予定のスポット一覧を表示 */}
        <ul className="temp-spot-list">
          {tempSpots.map(spot => (
            <li key={spot.id}>📍 {spot.name}
              <button type='button' onClick={() => deleteTempSpot(spot.id)} className='delete-mini-button'>
                x
              </button>
            </li>
          ))}
        </ul>

        <hr />

        <textarea
          name="totalComment"
          placeholder='旅行全体の感想'
          value={formData.totalComment}
          onChange={handleChange}
        />

        <button type='submit' className='main-submit-button'>
          {editingId !== null ? "変更を保存する" : "旅行記を保存する"}
        </button>
        
        {editingId !== null && (
          <button type="button" onClick={cancelEdit} className='cancel-button'>
            キャンセル
          </button>
        )}
      </form>

      <hr />
      
      {/* 保存済みカードの表示部分 */}
      <div className='card-list'>
        {travels.map((travel) => (
          <div key={travel.id} className='travel-card'>
            {/* エリアをバッジとして表示 */}
            <div className='card-header'>
              <span className='area-badge'>{travel.area}</span>
              <div className='header-main'>
                <h2>{travel.title}</h2>
                {/* 削除ボタン */}
                <button onClick={() => deleteTravel(travel.id)} className='delete-button'>
                  削除
                </button>
                {/* カード一覧の削除ボタンの横に編集ボタンを追加 */}
                <button onClick={() => startEdit(travel)} className='edit-button'>
                  編集
                </button>
              </div>
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
