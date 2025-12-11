import { DaySchedule, GuideLocation, BookingItem, Tab } from './types';

// --- 設定您的 Firebase Config ---
// 請前往 Firebase Console > Project Settings > General > Your apps 複製設定
// 填入後，部署到 GitHub，朋友打開網頁即可自動連線，無需手動輸入
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-xMOB9D-d-2DqRW64jIvxRpB7BlAmSWM", 
  authDomain: "tokyo-trip-51592.firebaseapp.com", 
  projectId: "tokyo-trip-51592", 
  storageBucket: "tokyo-trip-51592.firebasestorage.app", 
  messagingSenderId: "1008859950162", 
  appId: "1:1008859950162:web:d53c524e1ea5ef0178838b"
};

export const FLIGHTS = {
  outbound: {
    airline: '星宇航空 JX804',
    date: '12/17',
    depart: { time: '15:00', place: '桃園機場 (TPE)' },
    arrive: { time: '19:00', place: '成田機場 (NRT)' },
  },
  inbound: {
    airline: '台灣虎航 IT203',
    date: '12/22',
    depart: { time: '18:25', place: '成田機場 (NRT)' },
    arrive: { time: '21:50', place: '桃園機場 (TPE)' },
  }
};

export const HOTELS = [
  {
    period: '12/17 - 12/20',
    name: '東京京橋雷姆飯店',
    enName: 'Remm Tokyo Kyobashi',
    address: 'Kyobashi, Tokyo',
    mapLink: 'https://maps.app.goo.gl/bxZNMcPWgM31LXa6A'
  },
  {
    period: '12/20 - 12/22',
    name: '東京秋葉原 Resol 飯店',
    enName: 'Hotel Resol Akihabara',
    address: 'Akihabara, Tokyo',
    mapLink: 'https://maps.app.goo.gl/qokbXoRbd4B5FiFo8'
  }
];

const IMG_HOTEL_1 = 'https://cf.bstatic.com/xdata/images/hotel/max1280x900/223709051.jpg?k=330554157147772a39282361730043586326176161623168233388708453&o=&hp=1';
const IMG_HOTEL_2 = 'https://cf.bstatic.com/xdata/images/hotel/max1280x900/192534431.jpg?k=069695604111364661858567118181604927237890732801831818507851&o=&hp=1';
const IMG_FOOD = 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80';

export const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'f1',
    type: 'flight',
    title: '星宇航空',
    subTitle: 'JX804',
    date: '2025/12/17',
    details: {
      from: 'TPE',
      to: 'NRT',
      departTime: '15:00',
      arriveTime: '19:00',
      seat: '24A',
      gate: '--', 
      terminal: '第一航廈 (T1)',
      counter: '3, 5, 6',
      baggage: '--'
    }
  },
  {
    id: 'f2',
    type: 'flight',
    title: '台灣虎航',
    subTitle: 'IT203',
    date: '2025/12/22',
    details: {
      from: 'NRT',
      to: 'TPE',
      departTime: '18:25',
      arriveTime: '21:50',
      seat: '12F',
      gate: '--', 
      terminal: '第二航廈 (T2)',
      counter: 'T',
      baggage: '--' 
    }
  },
  {
    id: 'h1',
    type: 'hotel',
    title: '東京京橋雷姆飯店',
    subTitle: '12/17 - 12/20 (3晚)',
    date: '2025/12/17',
    imageUrl: IMG_HOTEL_1,
    details: {
      checkIn: '14:00',
      checkOut: '12:00',
      address: '東京都中央區京橋2-6-21',
      mapLink: 'https://maps.app.goo.gl/bxZNMcPWgM31LXa6A'
    }
  },
  {
    id: 'h2',
    type: 'hotel',
    title: '東京秋葉原 Resol 飯店',
    subTitle: '12/20 - 12/22 (2晚)',
    date: '2025/12/20',
    imageUrl: IMG_HOTEL_2,
    details: {
      checkIn: '15:00',
      checkOut: '11:00',
      address: '東京都千代田區神田須田町2-25-12',
      mapLink: 'https://maps.app.goo.gl/qokbXoRbd4B5FiFo8'
    }
  },
  {
    id: 'd1',
    type: 'dining',
    title: '敘敘苑',
    subTitle: '銀座 Miyuki 大道店',
    date: '2025/12/20 (週六)',
    time: '11:30',
    imageUrl: IMG_FOOD,
    details: {
      pax: 2,
      mapLink: 'https://maps.app.goo.gl/eZArqns8efq52ucZ9',
      cancelLink: '#'
    }
  }
];

export const GUIDE_SPOTS: GuideLocation[] = [
  {
    id: 'g_tokyo_st_17',
    date: '12/17',
    title: '東京車站',
    subtitle: 'Tokyo Station',
    description: '東京的玄關，其丸之內側的紅磚站舍是國家重要文化財，展現了辰野金吾式建築的莊重與華麗。車站下方的「東京一番街」匯集了拉麵街、動漫角色街，是購買伴手禮與用餐的絕佳去處。',
    tags: ['建築', '伴手禮', '交通樞紐'],
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_disney',
    date: '12/18',
    title: '東京迪士尼樂園',
    subtitle: 'Tokyo Disneyland',
    description: '夢想與魔法的王國，由七大主題園區組成。這裡有灰姑娘城堡、刺激的太空山、溫馨的小熊維尼獵蜜記。晚上的電子大遊行「夢之光」更是不可錯過的視覺饗宴。記得入園後先使用 App 抽取 40週年優先入場卡 (Priority Pass)。',
    tags: ['樂園', '遊行', '煙火'],
    imageUrl: 'https://images.unsplash.com/photo-1545580124-a28a2a890476?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_kamakura',
    date: '12/19',
    title: '鎌倉',
    subtitle: 'Kamakura',
    description: '鎌倉是日本三大古都之一，三面環山，一面臨海。這裡不僅有眾多的神社寺廟，還有迷人的湘南海岸風光。作為《灌籃高手》等作品的取景地，充滿了濃厚的日式青春氣息與歷史底蘊。',
    tags: ['古都', '大佛', '海岸'],
    imageUrl: 'https://images.unsplash.com/photo-1599816075883-93723793df66?auto=format&fit=crop&w=800&q=80',
    mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=139.5300%2C35.3000%2C139.5700%2C35.3400&layer=mapnik'
  },
  {
    id: 'g_komachi',
    date: '12/19',
    title: '小町通 / 鶴岡八幡宮',
    subtitle: 'Komachi Dori',
    description: '小町通是鎌倉最熱鬧的商業街，兩旁林立著各式各樣的伴手禮店、咖啡廳與小吃攤。街道盡頭便是著名的「鶴岡八幡宮」，是鎌倉幕府時期的中心神社，紅色的鳥居與本宮氣勢恢弘，是祈求勝運的重要能量景點。',
    tags: ['逛街', '神社', '小吃'],
    imageUrl: 'https://images.unsplash.com/photo-1572973809226-c2cb74070a27?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g3',
    date: '12/19',
    title: '七里濱',
    subtitle: 'Shichirigahama',
    description: '這裡有被譽為「世界第一早餐」的 Bills，邊享用鬆餅邊眺望湘南海岸與富士山是極致的享受。附近的「鎌倉高校前」平交道更是《灌籃高手》的經典場景，吸引無數粉絲朝聖。',
    tags: ['海景', '灌籃高手', '咖啡'],
    imageUrl: 'https://images.unsplash.com/photo-1549643276-fbc2bd874326?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_enoshima',
    date: '12/19',
    title: '江之島',
    subtitle: 'Enoshima',
    description: '透過大橋與陸地相連的小島。島上有江島神社，是求財與戀愛的聖地。爬上島頂的展望燈塔 (Sea Candle) 可以飽覽360度的海景，天氣好時更能看見富士山。名物是將整隻章魚壓扁製成的「章魚仙貝」。',
    tags: ['海島', '神社', '夕陽'],
    imageUrl: 'https://images.unsplash.com/photo-1596350314414-b6c86a34591a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_yokohama',
    date: '12/19',
    title: '橫濱',
    subtitle: 'Yokohama',
    description: '日本最早開港的城市之一，充滿異國情調。擁有廣闊的港未來21區、巨大的摩天輪以及美麗的夜景。是個融合了現代都市與歷史港口風情的浪漫城市。',
    tags: ['港口', '夜景', '約會'],
    imageUrl: 'https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_redbrick',
    date: '12/19',
    title: '橫濱紅磚倉庫',
    subtitle: 'Red Brick Warehouse',
    description: '由明治大正時期的紅磚建築改建而成的文創園區。保留了復古的外觀，內部則是時尚的商店、餐廳與展演空間。每逢聖誕節，廣場會舉辦盛大的聖誕市集，氣氛非常浪漫。',
    tags: ['文創', '歷史建築', '聖誕市集'],
    imageUrl: 'https://images.unsplash.com/photo-1606216482167-73b3202970a2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_chinatown',
    date: '12/19',
    title: '橫濱中華街',
    subtitle: 'Chinatown',
    description: '日本最大的中華街，擁有超過500家店舖。色彩鮮豔的牌樓與充滿活力的街道是其特徵。這裡的肉包、小籠包與各種中華料理聞名全日本，是美食愛好者的天堂。',
    tags: ['美食', '中華料理', '熱鬧'],
    imageUrl: 'https://images.unsplash.com/photo-1565551624647-1959828e352d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_ginza',
    date: '12/20',
    title: '銀座',
    subtitle: 'Ginza',
    description: '東京最奢華的購物區，匯集了世界頂級精品旗艦店與老字號百貨。週末會實施「步行者天國」，整條馬路開放給行人行走。這裡也是美食的一級戰區，從米其林餐廳到百年老店應有盡有。',
    tags: ['購物', '精品', '步行者天國'],
    imageUrl: 'https://images.unsplash.com/photo-1565624796338-3c35b8eb8371?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_tokyo_st',
    date: '12/20',
    title: '東京車站',
    subtitle: 'Tokyo Station',
    description: '東京的玄關，其丸之內側的紅磚站舍是國家重要文化財，展現了辰野金吾式建築的莊重與華麗。車站下方的「東京一番街」匯集了拉麵街、動漫角色街，是購買伴手禮與用餐的絕佳去處。',
    tags: ['建築', '伴手禮', '交通樞紐'],
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_akiba',
    date: '12/20',
    title: '秋葉原',
    subtitle: 'Akihabara',
    description: '世界知名的電器街與御宅族(Otaku)聖地。滿街的動漫看板、女僕咖啡廳、公仔模型店與電子零件行構成了獨特的街景。無論你是動漫迷還是科技愛好者，這裡都是必訪之地。',
    tags: ['動漫', '電器', '女僕咖啡'],
    imageUrl: 'https://images.unsplash.com/photo-1569931727787-4340798a44b8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_skytree',
    date: '12/20',
    title: '晴空塔',
    subtitle: 'Tokyo Skytree',
    description: '高634公尺，是世界最高的自立式電波塔。塔下的「索拉町 (Solamachi)」購物中心擁有300多家店舖。登上展望台可以俯瞰整個關東平原，天氣好時甚至能看到富士山。夜晚的點燈更是東京夜景的象徵。',
    tags: ['地標', '夜景', '購物'],
    imageUrl: 'https://images.unsplash.com/photo-1545389659-1ecf04b20a7d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g1',
    date: '12/21',
    title: '豪德寺',
    subtitle: 'Gotokuji Temple',
    description: '傳說中「招財貓」的發源地。井伊直孝在獵鷹歸途路過豪德寺門口，看到一隻貓舉著手在招呼他，便下馬入寺休息。不久，雷雨交加，直孝慶幸自己免於被淋濕，這便是招財貓傳說的由來。這裡有成千上萬隻招財貓，非常壯觀。',
    tags: ['歷史', '拍照', '寧靜'],
    imageUrl: 'https://images.unsplash.com/photo-1595856424075-d147814b8a2c?auto=format&fit=crop&w=800&q=80',
    mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=139.6450%2C35.6480%2C139.6490%2C35.6520&layer=mapnik'
  },
  {
    id: 'g2',
    date: '12/21',
    title: '麻布台之丘',
    subtitle: 'Azabudai Hills',
    description: '2023年底全新開幕的東京新地標，主塔樓高330公尺，超越阿倍野Harukas成為日本第一高樓。由知名設計師海澤維克工作室設計，建築外觀充滿流線型綠意，結合了奢華住宅、辦公室、TeamLab美術館與森JP塔。',
    tags: ['新地標', '夜景', '建築'],
    imageUrl: 'https://images.unsplash.com/photo-1707228800539-7e452932456e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_shibuya',
    date: '12/21',
    title: '澀谷',
    subtitle: 'Shibuya',
    description: '東京年輕文化的發源地，以繁忙的十字路口與忠犬八公像聞名於世。這裡匯集了最新的時尚潮流、音樂與美食。近期新地標 SHIBUYA SKY 提供了360度無死角的東京俯瞰視野，是必訪的打卡熱點。',
    tags: ['潮流', '十字路口', '夜景'],
    imageUrl: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_harajuku',
    date: '12/21',
    title: '原宿',
    subtitle: 'Harajuku',
    description: '卡哇伊(Kawaii)文化的中心。竹下通擠滿了販售可麗餅、偶像周邊與獨特服飾的店舖。穿過熱鬧的街道，旁邊便是森林般寧靜的明治神宮，是感受東京現代與傳統強烈對比的最佳區域。',
    tags: ['卡哇伊', '竹下通', '神社'],
    imageUrl: 'https://images.unsplash.com/photo-1551641506-ee5bf4cb95f6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_shinjuku',
    date: '12/21',
    title: '新宿',
    subtitle: 'Shinjuku',
    description: '東京最大的交通樞紐與不夜城。這裡有充滿霓虹燈與哥吉拉頭像的歌舞伎町，也有充滿昭和風情的居酒屋街「回憶橫丁」。西口則是摩天大樓林立的辦公區，東京都廳提供免費的展望台。',
    tags: ['繁華', '夜生活', '購物'],
    imageUrl: 'https://images.unsplash.com/photo-1570162613388-9d4134986348?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_tsukiji',
    date: '12/22',
    title: '築地市場',
    subtitle: 'Tsukiji Market',
    description: '東京的廚房。雖然場內批發市場已搬遷至豐洲，但「場外市場」依然保留了濃厚的下町風情與美食。這裡有最新鮮的生魚片、玉子燒、烤海鮮與各種乾貨，是早上大快朵頤的最佳去處。',
    tags: ['海鮮', '美食', '市場'],
    imageUrl: 'https://images.unsplash.com/photo-1572979261314-884852c08365?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g_ueno',
    date: '12/22',
    title: '上野',
    subtitle: 'Ueno',
    description: '充滿文化與庶民氣息的區域。上野公園內有動物園（熊貓）、美術館與博物館。鐵道旁的「阿美橫丁」則是戰後興起的商店街，充滿了叫賣聲與便宜的零食、藥妝與海鮮，非常有活力。',
    tags: ['公園', '動物園', '阿美橫丁'],
    imageUrl: 'https://images.unsplash.com/photo-1575960088924-f7c60317e307?auto=format&fit=crop&w=800&q=80'
  }
];

export const ITINERARY: DaySchedule[] = [
  {
    date: '12/17',
    fullDate: '2025-12-17',
    dayOfWeek: '週三',
    weather: { condition: 'sunny', temp: '2°C - 12°C' },
    items: [
      { id: '17-1', time: '15:00', activity: '飛往東京 (JX804)', type: 'flight', linkTo: { tab: Tab.BOOKINGS, targetId: 'f1' } },
      { 
        id: '17-main-1', 
        time: '21:30', 
        activity: '東京車站', 
        type: 'activity', 
        location: '千代田區',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_tokyo_st_17' },
        subItems: [
           { id: '17-2', time: '21:30', activity: 'Check-in: 東京京橋雷姆飯店', type: 'hotel', location: '京橋', linkTo: { tab: Tab.BOOKINGS, targetId: 'h1' }, mapsLink: 'https://maps.app.goo.gl/bxZNMcPWgM31LXa6A' }
        ]
      }
    ]
  },
  {
    date: '12/18',
    fullDate: '2025-12-18',
    dayOfWeek: '週四',
    weather: { condition: 'sunny', temp: '0°C - 12°C' },
    items: [
      { 
        id: '18-2', 
        time: '09:00', 
        activity: '東京迪士尼樂園', 
        type: 'activity', 
        notes: '夢想與魔法的王國。記得使用 App 抽取 Priority Pass。', 
        location: '舞濱',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_disney' },
        subItems: [
             { id: '18-3', time: '17:45', activity: '主城堡光雕秀 + 煙火', type: 'activity', notes: '建議提早 30 分鐘卡位' },
             { id: '18-4', time: '19:00', activity: '電子大遊行', type: 'activity', notes: '夢之光 Dreamlights' }
        ]
      },
    ]
  },
  {
    date: '12/19',
    fullDate: '2025-12-19',
    dayOfWeek: '週五',
    weather: { condition: 'sunny', temp: '0°C - 12°C' },
    items: [
      {
        id: '19-main-1',
        time: '11:00',
        activity: '鎌倉散策',
        type: 'activity',
        location: '神奈川',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_kamakura' },
        subItems: [
            { id: '19-s1', time: '11:00', activity: '小町通 / 鶴岡八幡宮', type: 'activity', notes: '商店街、神社參拜', linkTo: { tab: Tab.GUIDE, targetId: 'g_komachi' } },
            { id: '19-s2', time: '12:52', activity: '七里濱', type: 'activity', notes: 'Bills早餐、看海、平交道', linkTo: { tab: Tab.GUIDE, targetId: 'g3' } },
            { id: '19-new-1', time: '13:00', activity: '午餐：Espresso D Works', type: 'food', notes: '七里濱海景咖啡廳' },
            { id: '19-s3', time: '15:00', activity: '江之島', type: 'activity', notes: '江島神社、吻仔魚丼', linkTo: { tab: Tab.GUIDE, targetId: 'g_enoshima' } }
        ]
      },
      {
        id: '19-main-2',
        time: '18:30',
        activity: '橫濱港未來',
        type: 'activity',
        location: '橫濱',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_yokohama' },
        subItems: [
            { id: '19-s4', time: '18:30', activity: '橫濱紅磚倉庫', type: 'activity', notes: '夜景、聖誕市集', linkTo: { tab: Tab.GUIDE, targetId: 'g_redbrick' } },
            { id: '19-s5', time: '19:30', activity: '中華街', type: 'food', notes: '晚餐、肉包', linkTo: { tab: Tab.GUIDE, targetId: 'g_chinatown' } },
            { id: '19-s6', time: '20:30', activity: '聖誕市集', type: 'activity', notes: '感受節慶氛圍' }
        ]
      }
    ]
  },
  {
    date: '12/20',
    fullDate: '2025-12-20',
    dayOfWeek: '週六',
    weather: { condition: 'sunny', temp: '4°C - 13°C' },
    items: [
      { 
        id: '20-main-1', 
        time: '11:00', 
        activity: '銀座', 
        type: 'activity', 
        location: '中央區',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_ginza' },
        subItems: [
           { id: '20-s1', time: '11:30', activity: '午餐：敘敘苑燒肉', type: 'food', notes: 'Miyuki 大道店', linkTo: { tab: Tab.BOOKINGS, targetId: 'd1' } }
        ]
      },
      { 
        id: '20-main-2', 
        time: '12:30', 
        activity: '東京車站', 
        type: 'activity',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_tokyo_st' },
        subItems: [
          { id: '20-s2', time: '12:30', activity: '東京一番街 (地下街)', type: 'activity', notes: '拉麵街、動漫街、伴手禮' }
        ] 
      },
      { 
        id: '20-main-3', 
        time: '15:00', 
        activity: '秋葉原', 
        type: 'activity', 
        linkTo: { tab: Tab.GUIDE, targetId: 'g_akiba' },
        subItems: [
           { id: '20-s3', time: '15:00', activity: 'Check-in: Resol Hotel', type: 'hotel', notes: '寄放行李/入住', linkTo: { tab: Tab.BOOKINGS, targetId: 'h2' } },
           { id: '20-s4', time: '15:30', activity: '秋葉原電器街', type: 'activity', notes: 'Bic Camera, Yodobashi, 動漫店' }
        ]
      },
      { 
        id: '20-main-4', 
        time: '19:30', 
        activity: '晴空塔', 
        type: 'activity', 
        location: '押上',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_skytree' },
        subItems: [
           { id: '20-s5', time: '19:30', activity: '索拉町聖誕市集', type: 'activity', notes: '晚餐、逛街、夜景' }
        ]
      }
    ]
  },
  {
    date: '12/21',
    fullDate: '2025-12-21',
    dayOfWeek: '週日',
    weather: { condition: 'sunny', temp: '5°C - 13°C' },
    items: [
      { 
        id: '21-main-1', 
        time: '10:30', 
        activity: '豪德寺', 
        type: 'activity', 
        location: '世田谷',
        linkTo: { tab: Tab.GUIDE, targetId: 'g1' },
        subItems: [
          { id: '21-s1', time: '10:30', activity: '豪德寺', type: 'activity', notes: '滿滿的招財貓' }
        ]
      },
      { 
        id: '21-main-2', 
        time: '12:30', 
        activity: '澀谷', 
        type: 'activity', 
        location: '澀谷',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_shibuya' },
        subItems: [
          { id: '21-s2', time: '12:30', activity: '午餐：瑞兆豬排', type: 'food', notes: '著名的豬排丼' }
        ]
      },
      { 
        id: '21-main-3', 
        time: '14:40', 
        activity: '原宿', 
        type: 'activity', 
        linkTo: { tab: Tab.GUIDE, targetId: 'g_harajuku' },
        subItems: [
          { id: '21-s3', time: '14:40', activity: '3 coins', type: 'activity', notes: '平價雜貨尋寶' }
        ]
      },
      { 
        id: '21-main-4', 
        time: '16:10', 
        activity: '新宿', 
        type: 'activity', 
        linkTo: { tab: Tab.GUIDE, targetId: 'g_shinjuku' },
        subItems: [
          { id: '21-s4', time: '16:10', activity: 'POMME d\'AMOUR TOKYO', type: 'food', notes: '特製蘋果糖專賣店' }
        ]
      },
      { 
        id: '21-main-5', 
        time: '19:30', 
        activity: '麻布台之丘', 
        type: 'activity', 
        location: '港區',
        linkTo: { tab: Tab.GUIDE, targetId: 'g2' },
        subItems: [
           { id: '21-s5', time: '19:30', activity: '聖誕市集', type: 'activity', notes: '感受奢華的節慶氛圍' }
        ]
      }
    ]
  },
  {
    date: '12/22',
    fullDate: '2025-12-22',
    dayOfWeek: '週一',
    weather: { condition: 'cloudy', temp: '6°C - 13°C' },
    items: [
      { 
        id: '22-main-1', 
        time: '11:15', 
        activity: '築地市場', 
        type: 'activity', 
        linkTo: { tab: Tab.GUIDE, targetId: 'g_tsukiji' },
        subItems: [
          { id: '22-s1', time: '11:15', activity: '築地市場', type: 'food', notes: '早午餐, 邊走邊吃' }
        ]
      },
      {
        id: '22-main-2',
        time: '15:30',
        activity: '上野',
        type: 'activity',
        linkTo: { tab: Tab.GUIDE, targetId: 'g_ueno' },
        subItems: [
          { id: '22-s2', time: '16:25', activity: '搭乘 Skyliner', type: 'transport', notes: '前往成田機場' }
        ]
      },
      { id: '22-4', time: '18:25', activity: '飛往台北 (IT203)', type: 'flight', linkTo: { tab: Tab.BOOKINGS, targetId: 'f2' } }
    ]
  }
];

export const PACKING_LIST_INITIAL = [
  '護照', '日幣現金', '信用卡', '保險單', 'Sim卡 / 漫遊', '手機', '充電器', '行動電源', '換洗衣物', '常備藥品'
];