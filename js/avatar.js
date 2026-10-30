// 캐릭터 꾸미기 — 아이템 목록, SVG 그리기, 저장/구매.
// 점수 사용: 쓸 수 있는 점수 = 모은 점수(point_events 합계) − 산 아이템 가격 합계(avatar_purchases).
// 레벨·총점은 모은 점수 기준 그대로라서 아이템을 사도 공부 기록은 줄지 않는다.
// 아이템 id(slot:key)는 구매 기록에 저장되므로 한 번 만든 id는 바꾸지 않는다.
import { supabase, getSession } from './supabase-client.js';
import { getPointsSummary } from './points-client.js';

// ── 아이템 목록 ──
// slot: 착용 정보(equipped)의 키. optional = '없음' 선택 가능, multi = 여러 개 착용.
export const CATEGORIES = [
  { slot: 'face',      label: '얼굴형' },
  { slot: 'skin',      label: '피부색' },
  { slot: 'eyes',      label: '눈' },
  { slot: 'brows',     label: '눈썹' },
  { slot: 'nose',      label: '코' },
  { slot: 'mouth',     label: '입' },
  { slot: 'cheek',     label: '볼 꾸미기' },
  { slot: 'hair',      label: '헤어' },
  { slot: 'hairColor', label: '머리색' },
  { slot: 'hat',       label: '모자·머리띠', optional: true },
  { slot: 'top',       label: '상의·원피스', optional: true },
  { slot: 'bottom',    label: '하의', optional: true },
  { slot: 'shoes',     label: '신발', optional: true },
  { slot: 'acc',       label: '액세서리', multi: true },
  { slot: 'bg',        label: '배경' },
  { slot: 'pet',       label: '애완동물', optional: true },
];

// group: 같은 그룹 액세서리는 하나만 (손에 드는 물건, 날개, 안경)
const I = (slot, key, name, price, group) => ({ id: `${slot}:${key}`, slot, key, name, price, group });
export const ITEMS = [
  I('face', 'round', '동글 얼굴', 0), I('face', 'oval', '갸름 얼굴', 10), I('face', 'chubby', '통통 볼살', 10),
  I('face', 'small', '아담 얼굴', 10), I('face', 'long', '길쭉 얼굴', 10),

  I('skin', 'light', '하얀 피부', 0), I('skin', 'pale', '뽀얀 피부', 0), I('skin', 'peach', '복숭아 피부', 0),
  I('skin', 'olive', '밀빛 피부', 0), I('skin', 'tan', '구릿빛 피부', 0), I('skin', 'deep', '갈색 피부', 0),

  I('eyes', 'dot', '콩알 눈', 0), I('eyes', 'round', '동그란 눈', 10), I('eyes', 'sparkle', '반짝 눈', 15),
  I('eyes', 'happy', '웃는 눈', 15), I('eyes', 'sleepy', '졸린 눈', 15), I('eyes', 'lashes', '속눈썹 눈', 20),
  I('eyes', 'lashsmile', '속눈썹 웃는 눈', 20), I('eyes', 'wink', '윙크', 20), I('eyes', 'teary', '글썽 눈', 20),
  I('eyes', 'blue', '파란 눈', 20), I('eyes', 'green', '초록 눈', 20), I('eyes', 'pinkeye', '분홍 눈', 20),
  I('eyes', 'violet', '보라 눈', 20), I('eyes', 'star', '별 눈', 25), I('eyes', 'heart', '하트 눈', 25),

  I('brows', 'none', '없음', 0), I('brows', 'soft', '순한 눈썹', 0), I('brows', 'thick', '진한 눈썹', 10),
  I('brows', 'arched', '아치 눈썹', 10), I('brows', 'worried', '걱정 눈썹', 10), I('brows', 'angry', '화난 눈썹', 15),

  I('nose', 'dot', '콩알 코', 0), I('nose', 'tiny', '작은 코', 0), I('nose', 'curve', '오똑 코', 10),
  I('nose', 'button', '단추 코', 10), I('nose', 'cat', '고양이 코', 15), I('nose', 'pig', '돼지 코', 15), I('nose', 'clown', '빨간 코', 20),

  I('mouth', 'smile', '미소', 0), I('mouth', 'flat', '일자 입', 10), I('mouth', 'grin', '활짝 웃음', 10),
  I('mouth', 'oh', '놀란 입', 10), I('mouth', 'teeth', '이 보이는 웃음', 15), I('mouth', 'pout', '삐죽 입', 15),
  I('mouth', 'cat', '고양이 입', 15), I('mouth', 'tongue', '메롱', 15), I('mouth', 'fang', '덧니', 20),
  I('mouth', 'lipstick', '빨간 립', 20), I('mouth', 'kiss', '쪽 하트', 20),

  I('cheek', 'blush', '분홍 볼', 0), I('cheek', 'none', '없음', 0), I('cheek', 'bigblush', '발그레 볼', 10),
  I('cheek', 'freckles', '주근깨', 10), I('cheek', 'heartsticker', '하트 스티커', 15), I('cheek', 'starsticker', '별 스티커', 15),
  I('cheek', 'bandage', '반창고', 15), I('cheek', 'whiskers', '고양이 수염', 20),

  I('hair', 'bob', '단발', 0), I('hair', 'pixie', '숏컷', 20), I('hair', 'long', '긴 생머리', 25),
  I('hair', 'ponytail', '포니테일', 30), I('hair', 'sideponytail', '옆으로 묶은 머리', 30),
  I('hair', 'twintails', '양갈래', 35), I('hair', 'buns', '똥머리', 35), I('hair', 'hime', '히메컷', 35),
  I('hair', 'curly', '뽀글 파마', 40), I('hair', 'braids', '양갈래 땋은 머리', 40), I('hair', 'halfup', '반묶음', 40),
  I('hair', 'wavy', '웨이브 긴 머리', 40), I('hair', 'bunstails', '똥머리 양갈래', 45),

  I('hairColor', 'black', '검은색', 0), I('hairColor', 'brown', '갈색', 0), I('hairColor', 'blonde', '금발', 15),
  I('hairColor', 'red', '빨간색', 20), I('hairColor', 'orange', '주황색', 20), I('hairColor', 'pink', '분홍색', 20),
  I('hairColor', 'purple', '보라색', 20), I('hairColor', 'mint', '민트색', 20), I('hairColor', 'skyblue', '하늘색', 20),
  I('hairColor', 'silver', '은발', 25), I('hairColor', 'cotton', '솜사탕 그라데이션', 40), I('hairColor', 'galaxy', '은하수 그라데이션', 40),

  I('hat', 'beret', '베레모', 25), I('hat', 'cap', '야구 모자', 25), I('hat', 'beanie', '방울 비니', 25),
  I('hat', 'catears', '고양이 귀 머리띠', 30), I('hat', 'bunnyears', '토끼 귀 머리띠', 30), I('hat', 'straw', '밀짚모자', 30),
  I('hat', 'santa', '산타 모자', 30), I('hat', 'flowercrown', '꽃 화관', 35), I('hat', 'witch', '마녀 모자', 40),

  I('top', 'tshirt', '노랑 티셔츠', 20), I('top', 'pinktee', '분홍 티셔츠', 20), I('top', 'minttee', '민트 티셔츠', 20),
  I('top', 'striped', '줄무늬 티', 25), I('top', 'croptop', '크롭 티', 30), I('top', 'jersey', '운동복', 30),
  I('top', 'sailor', '세일러 교복', 35), I('top', 'hoodie', '보라 후드티', 35), I('top', 'cardigan', '분홍 가디건', 35),
  I('top', 'sweater', '하트 스웨터', 35), I('top', 'denim', '청재킷', 40), I('top', 'raincoat', '노랑 우비', 35),
  I('top', 'overalls', '멜빵 반바지', 40), I('top', 'pinkdress', '분홍 원피스', 45), I('top', 'onesie', '곰돌이 잠옷', 50),
  I('top', 'idoldress', '아이돌 무대 의상', 60), I('top', 'hanbok', '한복', 70), I('top', 'magical', '마법소녀 드레스', 80),
  I('top', 'gown', '공주 드레스', 80),

  I('bottom', 'shorts', '청반바지', 15), I('bottom', 'skirt', '주름 치마', 20), I('bottom', 'leggings', '레깅스', 20),
  I('bottom', 'jeans', '청바지', 25), I('bottom', 'plaid', '체크 치마', 25), I('bottom', 'cargo', '카고 바지', 25),
  I('bottom', 'tutu', '발레 튜튜', 30), I('bottom', 'longskirt', '긴 치마', 30),

  I('shoes', 'sneakers', '운동화', 15), I('shoes', 'slippers', '방울 슬리퍼', 15), I('shoes', 'maryjanes', '구두', 20),
  I('shoes', 'flats', '리본 플랫', 20), I('shoes', 'rainboots', '장화', 20), I('shoes', 'boots', '부츠', 25),
  I('shoes', 'hightop', '하이탑', 25), I('shoes', 'bunnyslippers', '토끼 슬리퍼', 30), I('shoes', 'skates', '롤러스케이트', 45),

  I('acc', 'starpin', '별 핀', 10), I('acc', 'ribbon', '리본', 15), I('acc', 'butterflyclip', '나비 집게핀', 15),
  I('acc', 'earrings', '하트 귀걸이', 15), I('acc', 'necklace', '하트 목걸이', 15), I('acc', 'scarf', '목도리', 25),
  I('acc', 'bag', '크로스백', 25), I('acc', 'glasses', '동그란 안경', 20, 'eyes'), I('acc', 'sunglasses', '하트 선글라스', 30, 'eyes'),
  I('acc', 'headphones', '헤드폰', 30), I('acc', 'crown', '왕관', 50),
  I('acc', 'flower', '꽃 한 송이', 15, 'L'), I('acc', 'icecream', '아이스크림', 20, 'L'), I('acc', 'bubbletea', '버블티', 20, 'L'),
  I('acc', 'balloon', '하트 풍선', 25, 'L'), I('acc', 'phone', '폰케이스 낀 폰', 30, 'L'), I('acc', 'teddy', '곰인형', 35, 'L'),
  I('acc', 'mic', '마이크', 40, 'R'), I('acc', 'lightstick', '응원봉', 35, 'R'), I('acc', 'wand', '요술봉', 40, 'R'),
  I('acc', 'angelwings', '천사 날개', 50, 'back'), I('acc', 'butterflywings', '나비 날개', 50, 'back'),

  I('bg', 'pastel', '핑크', 0), I('bg', 'mint', '민트', 0), I('bg', 'lavender', '라벤더', 0),
  I('bg', 'bedroom', '내 방', 30), I('bg', 'park', '공원', 30), I('bg', 'classroom', '교실', 30),
  I('bg', 'beach', '바닷가', 35), I('bg', 'cafe', '카페', 35), I('bg', 'snow', '눈 오는 날', 35),
  I('bg', 'night', '밤하늘', 40), I('bg', 'rainbow', '무지개', 40), I('bg', 'cherry', '벚꽃', 40),
  I('bg', 'amusement', '놀이공원', 45), I('bg', 'underwater', '바닷속', 45), I('bg', 'gacha', '가챠샵', 45),
  I('bg', 'stage', '콘서트 무대', 50), I('bg', 'space', '우주', 50), I('bg', 'candy', '과자 나라', 50), I('bg', 'castle', '공주님 성', 55),

  I('pet', 'chick', '병아리', 25), I('pet', 'snail', '달팽이', 30), I('pet', 'frog', '개구리', 30),
  I('pet', 'goldfish', '금붕어 어항', 30), I('pet', 'hamster', '햄스터', 35), I('pet', 'puppy', '강아지', 40),
  I('pet', 'cat', '고양이', 40), I('pet', 'bunny', '토끼', 40), I('pet', 'parrot', '앵무새', 40),
  I('pet', 'fox', '여우', 45), I('pet', 'penguin', '펭귄', 45), I('pet', 'panda', '판다', 50),
  I('pet', 'dino', '아기 공룡', 60), I('pet', 'unicorn', '유니콘', 70),
];
export const itemById = id => ITEMS.find(i => i.id === id);

// 처음 캐릭터: 속옷만 입은 기본 모습
export const DEFAULT_EQUIPPED = {
  face: 'round', skin: 'light', eyes: 'dot', brows: 'none', nose: 'dot', mouth: 'smile', cheek: 'blush',
  hair: 'bob', hairColor: 'brown', hat: null, top: null, bottom: null, shoes: null, acc: [], bg: 'pastel', pet: null,
};

// ── 그리기 도구 ──
const SKIN = { light: '#FFE3D3', pale: '#FFEEE6', peach: '#F8CBA6', olive: '#E9C29A', tan: '#DFA77E', deep: '#A8704A' };
const HAIR = {
  black: '#2B2024', brown: '#6B4226', blonde: '#E8C15A', red: '#D9443F', orange: '#F08A3C', pink: '#F58FB5',
  purple: '#9B7BD6', mint: '#5FC9B6', skyblue: '#6EC1F0', silver: '#C9CED8',
};
const HAIR_GRAD = { cotton: ['#FF9EC7', '#8FD3FF'], galaxy: ['#7B5BD6', '#1E2A6B'] };
const FACE = { round: [44, 44], oval: [40, 47], chubby: [47, 41], small: [40, 41], long: [41, 50] };
const INK = '#3A2630';
let uid = 0; // 그라데이션 id가 화면 안에서 겹치지 않게

const star = (cx, cy, r, fill, extra = '') => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`;
};
const heart = (cx, cy, s, fill, extra = '') =>
  `<path d="M${cx} ${cy + s * 0.9}C${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.6} ${cy - s * 1.1} ${cx} ${cy - s * 0.35}C${cx + s * 0.6} ${cy - s * 1.1} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z" fill="${fill}" ${extra}/>`;
const flower = (cx, cy, r, c) =>
  [0, 72, 144, 216, 288].map(a => `<circle cx="${(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(cy + r * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="${r * 0.75}" fill="${c}"/>`).join('') +
  `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#FFE066"/>`;
const sleeves = (len, c, w = 16) =>
  `<rect x="${67 - w / 2}" y="132" width="${w}" height="${len}" rx="7" fill="${c}" transform="rotate(12 67 136)"/>` +
  `<rect x="${133 - w / 2}" y="132" width="${w}" height="${len}" rx="7" fill="${c}" transform="rotate(-12 133 136)"/>`;
const torso = (h, c, extra = '') => `<rect x="72" y="129" width="56" height="${h}" rx="13" fill="${c}" ${extra}/>`;
const bothFeet = f => f(88) + f(112);

// ── 배경 ──
const BG = {
  pastel: `<rect width="200" height="240" fill="#FDE7EF"/><circle cx="30" cy="40" r="22" fill="#fff" opacity=".5"/><circle cx="172" cy="70" r="14" fill="#fff" opacity=".5"/><circle cx="160" cy="200" r="26" fill="#fff" opacity=".4"/>`,
  mint: `<rect width="200" height="240" fill="#DDF5F0"/><circle cx="34" cy="60" r="18" fill="#fff" opacity=".55"/><circle cx="170" cy="36" r="22" fill="#fff" opacity=".5"/><circle cx="150" cy="210" r="18" fill="#fff" opacity=".45"/>`,
  lavender: `<rect width="200" height="240" fill="#EDE4FB"/>${heart(32, 44, 10, '#fff', 'opacity=".6"')}${heart(170, 86, 7, '#fff', 'opacity=".6"')}${heart(160, 206, 12, '#fff', 'opacity=".5"')}`,
  bedroom: `<rect width="200" height="240" fill="#FCE4EC"/><rect x="18" y="22" width="56" height="48" rx="4" fill="#BFE6FF" stroke="#fff" stroke-width="4"/><path d="M46 22v48M18 46h56" stroke="#fff" stroke-width="3"/><rect y="200" width="200" height="40" fill="#E8C9A6"/><ellipse cx="100" cy="222" rx="70" ry="10" fill="#F7A8C0" opacity=".7"/><rect x="160" y="150" width="14" height="50" rx="3" fill="#C49A6C"/><circle cx="167" cy="146" r="14" fill="#7CC47F"/>`,
  park: `<rect width="200" height="240" fill="#CDEBFF"/><circle cx="168" cy="32" r="16" fill="#FFD66B"/><rect y="190" width="200" height="50" fill="#9ED98B"/><rect x="170" y="120" width="10" height="72" fill="#9A6B44"/><circle cx="175" cy="110" r="26" fill="#5DBB63"/><circle cx="150" cy="214" r="4" fill="#FF8FB1"/><circle cx="185" cy="222" r="4" fill="#FFE066"/>`,
  classroom: `<rect width="200" height="240" fill="#FFF4DC"/><rect x="20" y="22" width="160" height="62" rx="4" fill="#2F6B4F" stroke="#B9875A" stroke-width="5"/><path d="M34 40h40M34 52h60M120 44l10 10 20-20" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".85"/><rect y="200" width="200" height="40" fill="#D9B48A"/><rect x="150" y="160" width="40" height="8" rx="2" fill="#C49A6C"/><rect x="154" y="168" width="4" height="32" fill="#9A6B44"/><rect x="182" y="168" width="4" height="32" fill="#9A6B44"/>`,
  beach: `<rect width="200" height="240" fill="#BDE7FF"/><circle cx="36" cy="34" r="16" fill="#FFD66B"/><rect y="150" width="200" height="40" fill="#5CC2E8"/><path d="M0 152q12-6 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/><rect y="186" width="200" height="54" fill="#F6DFA8"/><circle cx="176" cy="214" r="5" fill="#FF9EC0"/>`,
  cafe: `<rect width="200" height="240" fill="#F3E2CF"/><rect y="0" width="200" height="18" fill="#C98F5A"/><path d="M0 18h200" stroke="#fff" stroke-dasharray="10 6" stroke-width="3"/><rect x="14" y="40" width="40" height="30" rx="4" fill="#fff"/><path d="M20 50h28M20 58h20" stroke="#C98F5A" stroke-width="2"/><rect y="186" width="200" height="54" fill="#B07A4C"/><rect x="146" y="166" width="16" height="20" rx="3" fill="#fff"/><path d="M162 172q6 0 6 5t-6 5" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M150 160q2-6 0-10M157 160q2-6 0-10" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/><circle cx="182" cy="178" r="7" fill="#F7A8C0"/>`,
  snow: `<rect width="200" height="240" fill="#D7E9F7"/>${[[20, 30], [60, 60], [150, 20], [180, 70], [30, 120], [170, 140], [110, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join('')}<path d="M0 196q50-14 100 0t100 0v44H0z" fill="#fff"/><circle cx="168" cy="186" r="14" fill="#fff" stroke="#E2ECF5"/><circle cx="168" cy="164" r="10" fill="#fff" stroke="#E2ECF5"/><path d="M168 166l6 2-6 2z" fill="#F08A3C"/><circle cx="165" cy="162" r="1.3" fill="${INK}"/><circle cx="171" cy="162" r="1.3" fill="${INK}"/>`,
  night: `<rect width="200" height="240" fill="#1D2350"/><circle cx="160" cy="40" r="18" fill="#FFF3B0"/><circle cx="168" cy="34" r="16" fill="#1D2350"/>${star(30, 30, 5, '#FFF3B0')}${star(60, 70, 3, '#FFF3B0')}${star(180, 110, 4, '#FFF3B0')}${star(20, 150, 3, '#FFF3B0')}<rect y="208" width="200" height="32" fill="#2C3470"/>`,
  rainbow: `<rect width="200" height="240" fill="#D6F0FF"/>${['#FF7B7B', '#FFB36B', '#FFE066', '#8EE08A', '#7CC7F0', '#B79BF0'].map((c, i) => `<path d="M${-10 + i * 8} 170A${110 - i * 8} ${110 - i * 8} 0 0 1 ${210 - i * 8} 170" stroke="${c}" stroke-width="8" fill="none"/>`).join('')}<ellipse cx="20" cy="172" rx="30" ry="14" fill="#fff"/><ellipse cx="180" cy="172" rx="30" ry="14" fill="#fff"/><rect y="200" width="200" height="40" fill="#A8E6A0"/>`,
  cherry: `<rect width="200" height="240" fill="#E3F2FF"/><rect y="196" width="200" height="44" fill="#BFE5A8"/><path d="M168 200v-80q0-14-14-24M168 140q10-10 22-12" stroke="#7A4E36" stroke-width="7" fill="none" stroke-linecap="round"/>${[[150, 90], [172, 80], [190, 100], [160, 110], [184, 124], [140, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#FFC6DA"/>`).join('')}${[[30, 40], [60, 90], [20, 150], [110, 30], [90, 180]].map(([x, y]) => flower(x, y, 3, '#FFB3CC')).join('')}`,
  amusement: `<rect width="200" height="240" fill="#FFE3C8"/><g stroke="#fff" stroke-width="3" fill="none"><circle cx="158" cy="104" r="44"/><path d="M158 60v88M114 104h88M127 73l62 62M189 73l-62 62"/><path d="M158 104l-20 96M158 104l20 96"/></g><circle cx="158" cy="60" r="6" fill="#FF8FB1"/><circle cx="202" cy="104" r="6" fill="#7CC7F0"/><circle cx="114" cy="104" r="6" fill="#FFD66B"/><circle cx="158" cy="148" r="6" fill="#9B7BD6"/><rect y="200" width="200" height="40" fill="#B6E3A8"/>`,
  underwater: `<rect width="200" height="240" fill="#4FB6DE"/><rect y="0" width="200" height="60" fill="#7BD0EE" opacity=".6"/>${[[30, 50, 5], [44, 30, 3], [170, 60, 6], [160, 100, 3], [20, 140, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/>`).join('')}<path d="M150 150q8-4 16 0t16 0l-4 6 4 6q-8 4-16 0t-16 0z" fill="#FFB36B"/><circle cx="156" cy="154" r="1.5" fill="${INK}"/><rect y="210" width="200" height="30" fill="#F2D9A6"/><path d="M20 212q-8-20 0-40q8 20 0 40M34 212q8-24-2-48" stroke="#3DAA6B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M176 212q-6-16 4-34" stroke="#3DAA6B" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  gacha: `<rect width="200" height="240" fill="#FFF0F5"/>${[12, 52, 140, 180].map((x, i) => `<rect x="${x - 12}" y="40" width="34" height="140" rx="6" fill="${['#FF8FB1', '#7CC7F0', '#FFD66B', '#9B7BD6'][i]}"/><rect x="${x - 6}" y="48" width="22" height="40" rx="10" fill="#fff" opacity=".85"/><circle cx="${x + 1}" cy="66" r="5" fill="#FF6F91"/><circle cx="${x + 9}" cy="72" r="5" fill="#6EC1F0"/><circle cx="${x + 3}" cy="78" r="5" fill="#FFE066"/><circle cx="${x + 5}" cy="110" r="7" fill="#fff"/><rect x="${x - 1}" y="140" width="12" height="10" rx="2" fill="${INK}" opacity=".5"/>`).join('')}<rect y="196" width="200" height="44" fill="#F5D5E0"/>`,
  stage: `<rect width="200" height="240" fill="#2A1540"/><path d="M30 0h26l70 240H-20z" fill="#FFF3B0" opacity=".16"/><path d="M144 0h26l50 240H74z" fill="#FFB0D0" opacity=".16"/>${star(24, 40, 5, '#FFE066')}${star(176, 30, 4, '#FFE066')}${star(186, 120, 3, '#fff')}<rect y="200" width="200" height="40" fill="#4B2A6B"/><path d="M0 200h200" stroke="#FFE066" stroke-width="2"/>`,
  space: `<rect width="200" height="240" fill="#14112E"/>${[[20, 20], [70, 50], [180, 30], [140, 80], [30, 110], [186, 160], [10, 200], [120, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}<circle cx="164" cy="190" r="26" fill="#F08A3C"/><ellipse cx="164" cy="190" rx="40" ry="8" fill="none" stroke="#FFD66B" stroke-width="3"/><circle cx="36" cy="60" r="14" fill="#7CC7F0"/><path d="M26 56q10 6 20-2" stroke="#3DAA6B" stroke-width="4" fill="none"/>${star(150, 54, 5, '#FFE066')}`,
  candy: `<rect width="200" height="240" fill="#FFE1EE"/><rect y="196" width="200" height="44" fill="#FFB3CF"/><path d="M0 196q10 10 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" fill="#fff" opacity=".7"/><rect x="24" y="110" width="5" height="86" fill="#fff"/><circle cx="26" cy="100" r="18" fill="#7CC7F0"/><path d="M26 100m-12 0a12 12 0 0 1 24 0a8 8 0 0 1-16 0a4 4 0 0 1 8 0" stroke="#fff" stroke-width="3" fill="none"/><rect x="172" y="120" width="5" height="76" fill="#fff"/><circle cx="174" cy="110" r="16" fill="#FF8FB1"/><path d="M174 110m-10 0a10 10 0 0 1 20 0a6 6 0 0 1-12 0" stroke="#fff" stroke-width="3" fill="none"/>${[[60, 40, '#FFD66B'], [150, 50, '#9B7BD6'], [100, 20, '#8EE08A']].map(([x, y, c]) => `<rect x="${x - 7}" y="${y - 5}" width="14" height="10" rx="4" fill="${c}"/><path d="M${x - 7} ${y}l-6-5v10zM${x + 7} ${y}l6-5v10z" fill="${c}"/>`).join('')}`,
  castle: `<rect width="200" height="240" fill="#FFE8F4"/><g fill="#F7C3DE"><rect x="120" y="90" width="70" height="110"/><rect x="112" y="70" width="20" height="130"/><rect x="178" y="70" width="20" height="130"/><rect x="140" y="56" width="30" height="40"/></g><g fill="#B98AE0"><path d="M108 72l14-26 14 26z"/><path d="M174 72l14-26 14 26z"/><path d="M136 58l19-34 19 34z"/></g><path d="M146 200v-26a9 9 0 0 1 18 0v26z" fill="#B98AE0"/><rect y="198" width="200" height="42" fill="#C9EBC0"/>${star(30, 40, 5, '#FFE066')}${star(70, 24, 3, '#FFE066')}`,
};

// ── 애완동물 (왼쪽 아래) ──
const PET = {
  chick: `<circle cx="36" cy="216" r="15" fill="#FFE066"/><path d="M48 214l8 3-8 3z" fill="#F59E2C"/><circle cx="41" cy="210" r="2" fill="${INK}"/><path d="M26 218q6 6 12 0" fill="#F5CF3A"/><path d="M30 232v4M40 232v4" stroke="#F59E2C" stroke-width="2"/>`,
  snail: `<path d="M8 232q2-14 16-12l36 6q6 6-2 6z" fill="#D9CBB5"/><path d="M14 222l-4-14M20 221l2-14" stroke="#B8A78C" stroke-width="2"/><circle cx="10" cy="207" r="2.5" fill="#B8A78C"/><circle cx="22" cy="206" r="2.5" fill="#B8A78C"/><circle cx="15" cy="225" r="1.6" fill="${INK}"/><circle cx="40" cy="212" r="16" fill="#E8A86B"/><path d="M40 212m-3 0a3 3 0 1 1 6 0a7 7 0 1 1-13 1a11 11 0 1 1 22-2" fill="none" stroke="#B9763D" stroke-width="2"/>`,
  frog: `<ellipse cx="36" cy="222" rx="18" ry="12" fill="#7CCB6B"/><circle cx="27" cy="206" r="7" fill="#7CCB6B"/><circle cx="45" cy="206" r="7" fill="#7CCB6B"/><circle cx="27" cy="206" r="3.5" fill="#fff"/><circle cx="45" cy="206" r="3.5" fill="#fff"/><circle cx="27" cy="206" r="1.8" fill="${INK}"/><circle cx="45" cy="206" r="1.8" fill="${INK}"/><path d="M28 220q8 6 16 0" stroke="${INK}" stroke-width="1.5" fill="none"/><ellipse cx="24" cy="223" rx="3" ry="2" fill="#FF9EB5" opacity=".7"/><ellipse cx="48" cy="223" rx="3" ry="2" fill="#FF9EB5" opacity=".7"/>`,
  goldfish: `<path d="M12 200h48l-4 30q-20 6-40 0z" fill="#CDEEFF" stroke="#9BD3F0" stroke-width="2" opacity=".9"/><path d="M14 210h44" stroke="#7CC7F0" stroke-width="2"/><ellipse cx="34" cy="220" rx="9" ry="6" fill="#FF8A3C"/><path d="M43 220l7-5v10z" fill="#FF8A3C"/><circle cx="30" cy="218" r="1.3" fill="${INK}"/><circle cx="22" cy="206" r="1.8" fill="none" stroke="#fff"/>`,
  hamster: `<ellipse cx="36" cy="218" rx="18" ry="15" fill="#F3C58E"/><ellipse cx="36" cy="224" rx="10" ry="8" fill="#FFF4E4"/><circle cx="24" cy="205" r="5" fill="#F3C58E"/><circle cx="48" cy="205" r="5" fill="#F3C58E"/><circle cx="24" cy="205" r="2.5" fill="#FFB3C0"/><circle cx="48" cy="205" r="2.5" fill="#FFB3C0"/><circle cx="30" cy="214" r="2" fill="${INK}"/><circle cx="42" cy="214" r="2" fill="${INK}"/><circle cx="36" cy="218" r="1.6" fill="#E57A90"/>`,
  puppy: `<ellipse cx="38" cy="222" rx="17" ry="12" fill="#F2D2A9"/><circle cx="36" cy="198" r="14" fill="#F2D2A9"/><ellipse cx="23" cy="197" rx="5" ry="10" fill="#C9925D"/><ellipse cx="49" cy="197" rx="5" ry="10" fill="#C9925D"/><circle cx="31" cy="196" r="2" fill="${INK}"/><circle cx="41" cy="196" r="2" fill="${INK}"/><ellipse cx="36" cy="203" rx="3" ry="2" fill="${INK}"/><path d="M54 218q8-6 6-14" stroke="#C9925D" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  cat: `<ellipse cx="38" cy="222" rx="15" ry="11" fill="#B8B8C8"/><path d="M52 222q14-4 8-20" stroke="#B8B8C8" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="36" cy="200" r="13" fill="#B8B8C8"/><path d="M25 194l1-13 9 7zM47 194l-1-13-9 7z" fill="#B8B8C8"/><circle cx="31" cy="199" r="2" fill="${INK}"/><circle cx="41" cy="199" r="2" fill="${INK}"/><path d="M34 204q2 2 4 0" stroke="${INK}" fill="none"/><path d="M22 203h-8M50 203h8" stroke="#8C8CA0"/>`,
  bunny: `<ellipse cx="30" cy="180" rx="4.5" ry="13" fill="#fff" stroke="#EADDE5"/><ellipse cx="42" cy="180" rx="4.5" ry="13" fill="#fff" stroke="#EADDE5"/><ellipse cx="30" cy="181" rx="2" ry="9" fill="#FFC6D8"/><ellipse cx="42" cy="181" rx="2" ry="9" fill="#FFC6D8"/><ellipse cx="37" cy="222" rx="16" ry="12" fill="#fff" stroke="#EADDE5"/><circle cx="36" cy="200" r="13" fill="#fff" stroke="#EADDE5"/><circle cx="31" cy="199" r="2" fill="${INK}"/><circle cx="41" cy="199" r="2" fill="${INK}"/><circle cx="36" cy="204" r="1.6" fill="#FF8FB1"/>`,
  parrot: `<path d="M22 232h30" stroke="#9A6B44" stroke-width="4" stroke-linecap="round"/><ellipse cx="36" cy="214" rx="11" ry="16" fill="#4CC07A"/><circle cx="36" cy="196" r="10" fill="#4CC07A"/><path d="M44 196q8 2 4 9l-6-4z" fill="#FFB33C"/><circle cx="38" cy="194" r="2" fill="${INK}"/><path d="M28 210q-8 10-2 22" stroke="#2F9A5C" stroke-width="5" fill="none"/><circle cx="31" cy="188" r="3" fill="#FF6F6F"/>`,
  fox: `<ellipse cx="36" cy="222" rx="15" ry="11" fill="#F0883C"/><path d="M50 224q18-2 12-22q-2 10-12 12z" fill="#F0883C"/><path d="M58 206l4-4 1 6z" fill="#fff"/><circle cx="35" cy="200" r="12" fill="#F0883C"/><path d="M24 196l0-14 10 8zM46 196l0-14-10 8z" fill="#F0883C"/><path d="M27 204q8 10 16 0q-8 4-16 0z" fill="#fff"/><circle cx="31" cy="198" r="1.8" fill="${INK}"/><circle cx="39" cy="198" r="1.8" fill="${INK}"/><circle cx="35" cy="205" r="1.6" fill="${INK}"/>`,
  penguin: `<ellipse cx="36" cy="214" rx="15" ry="20" fill="#2E3445"/><ellipse cx="36" cy="218" rx="10" ry="14" fill="#fff"/><circle cx="31" cy="204" r="1.8" fill="${INK}"/><circle cx="41" cy="204" r="1.8" fill="${INK}"/><path d="M33 208h6l-3 4z" fill="#FFB33C"/><ellipse cx="30" cy="234" rx="5" ry="2.5" fill="#FFB33C"/><ellipse cx="42" cy="234" rx="5" ry="2.5" fill="#FFB33C"/><ellipse cx="29" cy="209" rx="3" ry="2" fill="#FF9EB5" opacity=".6"/><ellipse cx="43" cy="209" rx="3" ry="2" fill="#FF9EB5" opacity=".6"/>`,
  panda: `<ellipse cx="37" cy="222" rx="17" ry="12" fill="#fff" stroke="#E5E5EA"/><ellipse cx="24" cy="226" rx="6" ry="8" fill="#2E2E36"/><ellipse cx="50" cy="226" rx="6" ry="8" fill="#2E2E36"/><circle cx="36" cy="199" r="14" fill="#fff" stroke="#E5E5EA"/><circle cx="25" cy="188" r="5" fill="#2E2E36"/><circle cx="47" cy="188" r="5" fill="#2E2E36"/><ellipse cx="30" cy="199" rx="4" ry="5" fill="#2E2E36"/><ellipse cx="42" cy="199" rx="4" ry="5" fill="#2E2E36"/><circle cx="30" cy="198" r="1.3" fill="#fff"/><circle cx="42" cy="198" r="1.3" fill="#fff"/><ellipse cx="36" cy="205" rx="2.5" ry="1.6" fill="#2E2E36"/>`,
  dino: `<path d="M14 232q0-26 22-26h6q14 0 16 16l4 10z" fill="#8AD47A"/><circle cx="46" cy="198" r="12" fill="#8AD47A"/><path d="M20 210l4-8 4 6 4-8 4 6" fill="#FFD66B"/><circle cx="50" cy="196" r="2" fill="${INK}"/><path d="M48 204q4 2 8-1" stroke="${INK}" stroke-width="1.5" fill="none"/><path d="M14 232q-8-4-10-12" stroke="#8AD47A" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  unicorn: `<ellipse cx="34" cy="220" rx="18" ry="12" fill="#fff" stroke="#EADDE5"/><path d="M22 230v6M30 231v6M40 231v6M48 230v6" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M38 214q4-16 12-20l6 12q-6 6-10 12z" fill="#fff" stroke="#EADDE5"/><path d="M50 194l4-16 3 15z" fill="#FFD66B"/><path d="M44 196q-10 2-8 16M42 200q-8 6-4 16" stroke="#C79BF0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M16 220q-10 2-8 14" stroke="#FF9EC7" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="52" cy="200" r="1.8" fill="${INK}"/>`,
};

// ── 얼굴 ──
const irisEye = color => x => `<ellipse cx="${x}" cy="92" rx="7" ry="8.5" fill="${color}"/><ellipse cx="${x}" cy="93" rx="3.5" ry="4.5" fill="${INK}"/><circle cx="${x + 2.5}" cy="88.5" r="2.4" fill="#fff"/><circle cx="${x - 2.4}" cy="96" r="1.2" fill="#fff"/>`;
const EYES = {
  dot: x => `<ellipse cx="${x}" cy="92" rx="4.5" ry="5.5" fill="${INK}"/><circle cx="${x + 1.5}" cy="90" r="1.5" fill="#fff"/>`,
  round: x => `<circle cx="${x}" cy="92" r="7" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${x + 1}" cy="93" r="3.4" fill="${INK}"/>`,
  sparkle: x => `<ellipse cx="${x}" cy="92" rx="7" ry="8.5" fill="#4A2A3A"/><circle cx="${x + 2.5}" cy="88.5" r="2.6" fill="#fff"/><circle cx="${x - 2.5}" cy="95.5" r="1.3" fill="#fff"/>`,
  happy: x => `<path d="M${x - 6} 94q6-8 12 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  sleepy: x => `<path d="M${x - 6} 92q6 5 12 0z" fill="${INK}"/><path d="M${x - 7} 92h14" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  lashes: x => `<ellipse cx="${x}" cy="93" rx="5" ry="6" fill="${INK}"/><circle cx="${x + 1.6}" cy="91" r="1.6" fill="#fff"/><path d="M${x - 5} 89l-3-3M${x} 87v-4M${x + 5} 89l3-3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  lashsmile: x => `<path d="M${x - 6} 94q6-8 12 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${x - 6} 93l-3-2M${x + 6} 93l3-2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  teary: x => `<ellipse cx="${x}" cy="92" rx="7" ry="8.5" fill="#4A2A3A"/><circle cx="${x + 2.5}" cy="88.5" r="2.6" fill="#fff"/><circle cx="${x - 2.5}" cy="95.5" r="1.3" fill="#fff"/><path d="M${x + 5} 99q3 5 0 7q-3-2 0-7z" fill="#8FD3FF"/>`,
  blue: irisEye('#4A90E2'), green: irisEye('#3FB06B'), pinkeye: irisEye('#FF6FA8'), violet: irisEye('#9B6BE0'),
  star: x => star(x, 92, 8, '#FFC93C', `stroke="${INK}" stroke-width="1.2"`),
  heart: x => heart(x, 92, 7, '#FF4F7B'),
};
const eyesSvg = k => k === 'wink' ? EYES.sparkle(83) + EYES.happy(117) : (EYES[k] || EYES.dot)(83) + (EYES[k] || EYES.dot)(117);

const BROWS = {
  none: () => '',
  soft: c => `<path d="M77 80q6-4 12 0M111 80q6-4 12 0" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  thick: c => `<path d="M76 80q7-5 14 0M110 80q7-5 14 0" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
  arched: c => `<path d="M76 81q7-8 14-2M110 79q7-6 14 2" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  worried: c => `<path d="M77 80l12-4M123 80l-12-4" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
  angry: c => `<path d="M77 76l12 5M123 76l-12 5" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`,
};

const NOSE = {
  dot: `<ellipse cx="100" cy="104" rx="1.8" ry="1.3" fill="#D99A86"/>`,
  tiny: `<path d="M98 105h4" stroke="#C98872" stroke-width="1.6" stroke-linecap="round"/>`,
  curve: `<path d="M99 100q4 4 0 7" stroke="#C98872" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  button: `<circle cx="100" cy="104" r="2.8" fill="#F29BA5"/>`,
  cat: `<path d="M97 102h6l-3 3.5z" fill="#F07C95"/>`,
  pig: `<ellipse cx="100" cy="104" rx="5.5" ry="4" fill="#F7A1B1"/><ellipse cx="98" cy="104" rx="1.1" ry="1.6" fill="#C2566E"/><ellipse cx="102" cy="104" rx="1.1" ry="1.6" fill="#C2566E"/>`,
  clown: `<circle cx="100" cy="104" r="5" fill="#FF3B3B"/><circle cx="98.5" cy="102.5" r="1.5" fill="#fff" opacity=".7"/>`,
};
const MOUTH = {
  smile: `<path d="M93 112q7 7 14 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  flat: `<path d="M94 114h12" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  grin: `<path d="M92 110q8 14 16 0z" fill="#B23A5A"/><path d="M95 115q5 4 10 0" fill="#FF8FA8"/>`,
  oh: `<ellipse cx="100" cy="114" rx="3.5" ry="4.5" fill="#B23A5A"/>`,
  teeth: `<path d="M92 110q8 12 16 0z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
  pout: `<path d="M96 114q4-3 8 0q-4 3-8 0z" fill="#E86A8A"/>`,
  cat: `<path d="M92 111q4 5 8 0q4 5 8 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  tongue: `<path d="M93 111q7 6 14 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M98 114h6v3a3 3 0 0 1-6 0z" fill="#FF8FA8"/>`,
  fang: `<path d="M93 112q7 7 14 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M96 114l1.5 4 1.5-3.4z" fill="#fff" stroke="${INK}" stroke-width=".8"/>`,
  lipstick: `<path d="M92 113q4-4 8-1q4-3 8 1q-8 7-16 0z" fill="#E2315A"/>`,
  kiss: heart(100, 114, 4, '#E2315A'),
};
const CHEEK = {
  none: () => '',
  blush: () => `<ellipse cx="76" cy="105" rx="7" ry="4" fill="#FF9EB5" opacity=".45"/><ellipse cx="124" cy="105" rx="7" ry="4" fill="#FF9EB5" opacity=".45"/>`,
  bigblush: () => `<ellipse cx="76" cy="105" rx="10" ry="6" fill="#FF7FA0" opacity=".55"/><ellipse cx="124" cy="105" rx="10" ry="6" fill="#FF7FA0" opacity=".55"/><path d="M71 103l3 4M76 103l3 4M121 103l3 4M126 103l3 4" stroke="#fff" stroke-width="1.2" opacity=".8"/>`,
  freckles: () => [[72, 103], [76, 106], [80, 102], [120, 102], [124, 106], [128, 103]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#B9764E"/>`).join(''),
  heartsticker: () => `<ellipse cx="76" cy="105" rx="7" ry="4" fill="#FF9EB5" opacity=".45"/>` + heart(124, 105, 5, '#FF4F7B'),
  starsticker: () => `<ellipse cx="124" cy="105" rx="7" ry="4" fill="#FF9EB5" opacity=".45"/>` + star(76, 105, 6, '#FFD23C'),
  bandage: () => `<ellipse cx="76" cy="105" rx="7" ry="4" fill="#FF9EB5" opacity=".45"/><g transform="rotate(-20 124 104)"><rect x="115" y="100" width="18" height="7" rx="3" fill="#F6D2A8"/><rect x="121" y="100" width="6" height="7" fill="#EBBF90"/></g>`,
  whiskers: () => `<path d="M80 104l-14-2M80 107h-15M80 110l-14 3M120 104l14-2M120 107h15M120 110l14 3" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`,
};

// ── 머리 (동글 얼굴 반지름 44 기준으로 그리고 얼굴형에 맞게 늘린다) ──
const BANGS = 'M52 90C48 40 74 30 100 30C126 30 152 40 148 90C143 76 137 66 128 60C121 69 110 71 104 61C96 71 84 71 78 61C66 66 58 76 52 90Z';
const BLUNT = 'M54 76C50 38 76 30 100 30C124 30 150 38 146 76Z';
const SWEPT = 'M52 92C46 36 80 26 104 30C136 34 154 50 148 92C140 70 126 58 104 58C84 60 66 68 52 92Z';
const HAIR_BACK = {
  bob: 'M52 88C46 30 154 30 148 88L150 120C138 128 126 122 122 112L78 112C74 122 62 128 50 120Z',
  long: 'M52 88C46 30 154 30 148 88L156 182C142 194 124 188 118 176L82 176C76 188 58 194 44 182Z',
  short: 'M52 88C46 30 154 30 148 88L148 100L52 100Z',
  wavy: 'M52 88C46 30 154 30 148 88C160 110 146 130 158 150C168 170 150 186 140 180L60 180C50 186 32 170 42 150C54 130 40 110 52 88Z',
  hime: 'M52 88C46 30 154 30 148 88L150 176L50 176Z',
};
function hairLayers(style, fill) {
  const P = d => `<path d="${d}"/>`;
  const dots = (pts, r) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const tie = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#FF6F91"/>`;
  const tails = P('M60 64C28 70 22 130 36 176C46 152 50 118 64 92Z') + P('M140 64C172 70 178 130 164 176C154 152 150 118 136 92Z');
  let back = P(HAIR_BACK.short), pre = '', front = '', bangs = BANGS; // pre: 앞머리 뒤, front: 앞머리 위
  switch (style) {
    case 'bob': back = P(HAIR_BACK.bob); break;
    case 'long': back = P(HAIR_BACK.long); break;
    case 'wavy': back = P(HAIR_BACK.wavy); break;
    case 'pixie': bangs = SWEPT; break;
    case 'hime': back = P(HAIR_BACK.hime); bangs = BLUNT; front = P('M50 70h14v50h-14z') + P('M136 70h14v50h-14z'); break;
    case 'twintails': back += tails; front = tie(60, 66) + tie(140, 66); break;
    case 'ponytail': back += P('M128 44C176 38 182 120 160 160C162 118 154 82 134 62Z'); front = tie(132, 48); break;
    case 'sideponytail': back += P('M64 62C24 72 26 150 50 172C46 142 52 110 70 88Z'); front = tie(64, 64); break;
    case 'buns': pre = dots([[66, 40], [134, 40]], 15); break;
    case 'bunstails': back += tails; pre = dots([[66, 40], [134, 40]], 14); break;
    case 'halfup': back = P(HAIR_BACK.long); pre = dots([[100, 30]], 11) + `<path d="M90 32l-8-6v12zM110 32l8-6v12z" fill="#FF6F91"/>`; break;
    case 'braids':
      back += dots([[56, 112], [54, 126], [53, 140], [53, 154], [54, 168], [144, 112], [146, 126], [147, 140], [147, 154], [146, 168]], 8);
      front = tie(54, 178) + tie(146, 178); break;
    case 'curly':
      back = dots([[56, 70], [52, 92], [54, 112], [146, 70], [148, 92], [146, 112], [64, 48], [136, 48], [80, 36], [100, 32], [120, 36], [58, 128], [142, 128]], 16);
      front = dots([[68, 54], [84, 46], [100, 44], [116, 46], [132, 54]], 13); bangs = null; break;
  }
  const fr = bangs ? `<path d="${bangs}"/><path d="M70 44q16-8 30-8" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>` : '';
  return { back: `<g fill="${fill}">${back}</g>`, front: `<g fill="${fill}">${pre}${fr}${front}</g>` };
}

const HAT = {
  beret: `<g transform="rotate(-10 100 40)"><ellipse cx="96" cy="42" rx="42" ry="14" fill="#E2455F"/><circle cx="96" cy="28" r="3" fill="#E2455F"/></g>`,
  cap: `<path d="M56 62C56 18 144 18 144 62Z" fill="#4F7DB8"/><path d="M60 58h92q12 2 4 9h-96z" fill="#3B66A0"/><circle cx="100" cy="24" r="3" fill="#3B66A0"/>${star(100, 44, 7, '#FFE066')}`,
  beanie: `<path d="M54 66C52 20 148 20 146 66Z" fill="#FF8FB1"/><rect x="52" y="56" width="96" height="14" rx="6" fill="#F5739B"/><path d="M62 58v10M72 58v10M82 58v10M92 58v10M102 58v10M112 58v10M122 58v10M132 58v10" stroke="#FF8FB1" stroke-width="2"/><circle cx="100" cy="20" r="9" fill="#fff"/>`,
  catears: `<path d="M56 60C60 26 140 26 144 60" stroke="#2E2E36" stroke-width="5" fill="none"/><path d="M62 44l4-28 20 16zM138 44l-4-28-20 16z" fill="#2E2E36"/><path d="M67 38l2-14 9 8zM133 38l-2-14-9 8z" fill="#FF9EC0"/>`,
  bunnyears: `<path d="M56 60C60 26 140 26 144 60" stroke="#fff" stroke-width="5" fill="none"/><g transform="rotate(-12 82 30)"><ellipse cx="82" cy="16" rx="8" ry="20" fill="#fff" stroke="#EADDE5"/><ellipse cx="82" cy="18" rx="3.5" ry="14" fill="#FFC6D8"/></g><g transform="rotate(12 118 30)"><ellipse cx="118" cy="16" rx="8" ry="20" fill="#fff" stroke="#EADDE5"/><ellipse cx="118" cy="18" rx="3.5" ry="14" fill="#FFC6D8"/></g>`,
  straw: `<ellipse cx="100" cy="46" rx="64" ry="12" fill="#F2D58A"/><path d="M66 46C66 12 134 12 134 46Z" fill="#F5DE9C"/><rect x="66" y="36" width="68" height="8" fill="#FF8FB1"/>`,
  santa: `<path d="M56 58C58 20 130 12 158 56Z" fill="#E2353F"/><rect x="52" y="50" width="98" height="14" rx="7" fill="#fff"/><circle cx="158" cy="60" r="8" fill="#fff"/>`,
  flowercrown: [[60, 58, '#FF8FB1'], [74, 46, '#FFD66B'], [90, 40, '#B79BF0'], [110, 40, '#FF8FB1'], [126, 46, '#7CC7F0'], [140, 58, '#FFD66B']].map(([x, y, c]) => flower(x, y, 5, c)).join(''),
  witch: `<ellipse cx="100" cy="42" rx="60" ry="10" fill="#3D2A5C"/><path d="M72 40L100 2L128 40Z" fill="#4B3570"/><rect x="74" y="32" width="52" height="7" fill="#9B6BE0"/>${star(110, 22, 4, '#FFE066')}`,
};

// ── 옷 ──
const tee = (c, print) => () => sleeves(16, c) + torso(44, c) + print;
const TOP = {
  tshirt: tee('#FFD66B', heart(100, 156, 5, '#FF6F91')),
  pinktee: tee('#FF9EC0', star(100, 155, 7, '#fff')),
  minttee: tee('#8FE0CF', heart(100, 156, 5, '#fff')),
  striped: () => sleeves(16, '#fff') + torso(44, '#fff') + [138, 148, 158, 168].map(y => `<rect x="73" y="${y}" width="54" height="4" fill="#3B4E8C"/>`).join(''),
  croptop: () => sleeves(10, '#B79BF0') + `<rect x="72" y="129" width="56" height="26" rx="12" fill="#B79BF0"/>` + star(100, 142, 5, '#fff'),
  jersey: () => sleeves(16, '#E2455F') + torso(46, '#E2455F') + `<path d="M72 150h56" stroke="#fff" stroke-width="3"/><text x="100" y="170" font-family="Arial, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="#fff">7</text>`,
  sailor: () => sleeves(18, '#fff') + torso(46, '#fff', 'stroke="#E5E0EA"') + `<path d="M80 130h40l-20 22z" fill="#2E3A6B"/><path d="M100 148l-9-5v10zM100 148l9-5v10z" fill="#E2455F"/>`,
  hoodie: () => `<path d="M80 128q20 20 40 0l-2-5q-18 13-36 0z" fill="#9C86D6"/>` + sleeves(42, '#B9A3E8') + torso(50, '#B9A3E8') + `<rect x="86" y="160" width="28" height="13" rx="5" fill="#A48FDC"/><path d="M95 133v12M105 133v12" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  cardigan: () => torso(44, '#fff') + sleeves(42, '#FF9EC0') + `<rect x="72" y="129" width="22" height="50" rx="10" fill="#FF9EC0"/><rect x="106" y="129" width="22" height="50" rx="10" fill="#FF9EC0"/><circle cx="91" cy="146" r="2" fill="#fff"/><circle cx="91" cy="160" r="2" fill="#fff"/>`,
  sweater: () => sleeves(42, '#F6E2C0') + torso(50, '#F6E2C0') + `<path d="M74 172h52M74 176h52" stroke="#E8CFA2" stroke-width="2"/>` + heart(100, 152, 8, '#FF6F91'),
  denim: () => torso(44, '#fff') + sleeves(42, '#6C9BD2') + `<rect x="72" y="129" width="22" height="48" rx="10" fill="#6C9BD2"/><rect x="106" y="129" width="22" height="48" rx="10" fill="#6C9BD2"/><path d="M84 129l10 12M116 129l-10 12" stroke="#4F7DB8" stroke-width="3"/><rect x="77" y="148" width="10" height="8" rx="2" fill="#4F7DB8"/><rect x="113" y="148" width="10" height="8" rx="2" fill="#4F7DB8"/>`,
  raincoat: () => `<path d="M78 128q22 22 44 0" fill="#F5C842"/>` + sleeves(42, '#FFD84D') + `<path d="M76 130h48l10 64q-34 8-68 0z" fill="#FFD84D"/><circle cx="96" cy="148" r="2.2" fill="#E0A800"/><circle cx="96" cy="164" r="2.2" fill="#E0A800"/><circle cx="96" cy="180" r="2.2" fill="#E0A800"/>`,
  overalls: () => sleeves(16, '#fff') + torso(40, '#fff', 'stroke="#E5E0EA"') + `<rect x="75" y="164" width="50" height="26" rx="6" fill="#6C9BD2"/><rect x="84" y="144" width="32" height="24" rx="4" fill="#6C9BD2"/><path d="M84 146l-6-16M116 146l6-16" stroke="#6C9BD2" stroke-width="5"/><circle cx="88" cy="148" r="2" fill="#FFD66B"/><circle cx="112" cy="148" r="2" fill="#FFD66B"/><path d="M100 176v14" stroke="#4F7DB8" stroke-width="2"/>`,
  pinkdress: () => `<circle cx="66" cy="137" r="9" fill="#FF9EC0"/><circle cx="134" cy="137" r="9" fill="#FF9EC0"/><path d="M76 130h48l14 64q-38 10-76 0z" fill="#FF9EC0"/><path d="M88 130q12 10 24 0" fill="#fff"/><path d="M70 186q30 8 60 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
  onesie: () => sleeves(44, '#D8A774') + `<rect x="79" y="170" width="19" height="48" rx="7" fill="#D8A774"/><rect x="102" y="170" width="19" height="48" rx="7" fill="#D8A774"/>` + torso(54, '#D8A774') + `<ellipse cx="100" cy="160" rx="16" ry="18" fill="#F5DEC0"/><circle cx="100" cy="140" r="2" fill="#8A5A3B"/><circle cx="100" cy="150" r="2" fill="#8A5A3B"/>`,
  idoldress: () => sleeves(12, '#8E5BD8') + `<path d="M76 130h48l12 60q-36 9-72 0z" fill="#8E5BD8"/><rect x="74" y="160" width="52" height="5" fill="#FFC93C"/>${star(88, 145, 4, '#FFE066')}${star(112, 176, 4, '#FFE066')}${star(84, 180, 3, '#fff')}${star(114, 142, 3, '#fff')}`,
  hanbok: () => sleeves(40, '#FFD66B') + [150, 157, 164].map((y, i) => `<path d="M${50 + i} ${y + 6}l18 4M${150 - i} ${y + 6}l-18 4" stroke="${['#FF6F91', '#7CC7F0', '#8EE08A'][i]}" stroke-width="4"/>`).join('') +
    `<path d="M70 150h60l20 68q-50 8-100 0z" fill="#E8466A"/><path d="M74 129h52v24h-52z" fill="#FFD66B"/><path d="M86 129l14 14 14-14" stroke="#fff" stroke-width="3" fill="none"/><path d="M100 146l-4 22M100 146l6 20" stroke="#E2315A" stroke-width="3" stroke-linecap="round"/>`,
  magical: () => `<circle cx="66" cy="137" r="8" fill="#fff"/><circle cx="134" cy="137" r="8" fill="#fff"/><path d="M76 150h48l20 46q-44 10-88 0z" fill="#FFB3D1"/><path d="M70 186q30 10 60 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M76 130h48v24h-48z" fill="#fff"/>` +
    `<path d="M100 144l-16-10v20zM100 144l16-10v20z" fill="#FF4F8B"/><circle cx="100" cy="144" r="4" fill="#FFD23C"/>${star(84, 176, 4, '#FFE066')}${star(116, 170, 4, '#FFE066')}`,
  gown: () => `<circle cx="66" cy="137" r="9" fill="#BFE6FF"/><circle cx="134" cy="137" r="9" fill="#BFE6FF"/><path d="M78 130h44v30h-44z" fill="#9ED8FF"/><path d="M78 158h44l30 58q-52 10-104 0z" fill="#9ED8FF"/><path d="M60 206q40 12 80 0M70 186q30 8 60 0" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>` +
    `${star(80, 196, 3, '#fff')}${star(120, 190, 3, '#fff')}${star(100, 206, 3, '#fff')}<path d="M86 130q14 10 28 0" fill="#fff"/>`,
};
const FULL_BODY = new Set(['pinkdress', 'idoldress', 'raincoat', 'overalls', 'onesie', 'hanbok', 'magical', 'gown']); // 하의를 가리는 옷
const BOTTOM = {
  shorts: `<rect x="75" y="164" width="50" height="24" rx="6" fill="#6C9BD2"/><path d="M100 172v16" stroke="#4F7DB8" stroke-width="2"/>`,
  skirt: `<path d="M74 164h52l8 30q-34 6-68 0z" fill="#F27BA0"/><path d="M88 166l-4 28M100 166v30M112 166l4 28" stroke="#D95F87" stroke-width="1.5"/>`,
  leggings: `<rect x="75" y="164" width="50" height="16" rx="6" fill="#2E2E36"/><rect x="80" y="170" width="17" height="48" rx="6" fill="#2E2E36"/><rect x="103" y="170" width="17" height="48" rx="6" fill="#2E2E36"/>`,
  jeans: `<rect x="75" y="164" width="50" height="16" rx="6" fill="#5B83C2"/><rect x="79" y="170" width="19" height="46" rx="6" fill="#5B83C2"/><rect x="102" y="170" width="19" height="46" rx="6" fill="#5B83C2"/>`,
  plaid: `<path d="M74 164h52l8 30q-34 6-68 0z" fill="#2E3A6B"/><path d="M84 164l-4 30M100 164v32M116 164l4 30M72 176h56M70 186h60" stroke="#E2455F" stroke-width="2"/>`,
  cargo: `<rect x="75" y="164" width="50" height="16" rx="6" fill="#A39272"/><rect x="78" y="170" width="20" height="46" rx="6" fill="#A39272"/><rect x="102" y="170" width="20" height="46" rx="6" fill="#A39272"/><rect x="78" y="186" width="9" height="10" rx="2" fill="#8C7C5E"/><rect x="113" y="186" width="9" height="10" rx="2" fill="#8C7C5E"/>`,
  tutu: `<ellipse cx="100" cy="176" rx="36" ry="12" fill="#FFC6DA"/><ellipse cx="100" cy="172" rx="30" ry="10" fill="#FFB3CF"/><rect x="76" y="162" width="48" height="8" rx="4" fill="#FF8FB1"/>`,
  longskirt: `<path d="M74 164h52l10 50q-36 6-72 0z" fill="#C3B1EC"/><path d="M68 206q32 6 64 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
};
const SHOES = {
  sneakers: bothFeet(x => `<ellipse cx="${x}" cy="219" rx="11" ry="6" fill="#fff" stroke="#E0D6DE"/><path d="M${x - 8} 221h16" stroke="#FF6F91" stroke-width="2"/>`),
  slippers: bothFeet(x => `<ellipse cx="${x}" cy="220" rx="11" ry="5" fill="#FFB3CF"/><circle cx="${x}" cy="216" r="4" fill="#fff"/>`),
  maryjanes: bothFeet(x => `<ellipse cx="${x}" cy="219" rx="10" ry="5.5" fill="#2B2B3A"/><path d="M${x - 6} 214h12" stroke="#2B2B3A" stroke-width="2"/><circle cx="${x + 3}" cy="217" r="1.5" fill="#fff" opacity=".6"/>`),
  flats: bothFeet(x => `<ellipse cx="${x}" cy="219" rx="10" ry="5" fill="#E2455F"/><path d="M${x} 216l-4-3v6zM${x} 216l4-3v6z" fill="#fff"/>`),
  rainboots: bothFeet(x => `<rect x="${x - 9}" y="196" width="18" height="24" rx="5" fill="#FFD84D"/><ellipse cx="${x}" cy="219" rx="11" ry="5" fill="#FFD84D"/><path d="M${x - 9} 202h18" stroke="#E0A800" stroke-width="2"/>`),
  boots: bothFeet(x => `<rect x="${x - 9}" y="198" width="18" height="22" rx="5" fill="#8A5A3B"/><ellipse cx="${x}" cy="219" rx="11" ry="5" fill="#8A5A3B"/>`),
  hightop: bothFeet(x => `<rect x="${x - 9}" y="206" width="18" height="14" rx="5" fill="#9B6BE0"/><ellipse cx="${x}" cy="220" rx="11" ry="4.5" fill="#fff"/><path d="M${x - 5} 210h10M${x - 5} 214h10" stroke="#fff" stroke-width="1.4"/>`),
  bunnyslippers: bothFeet(x => `<ellipse cx="${x}" cy="219" rx="11" ry="6" fill="#fff" stroke="#EADDE5"/><ellipse cx="${x - 4}" cy="210" rx="2.5" ry="6" fill="#fff" stroke="#EADDE5"/><ellipse cx="${x + 4}" cy="210" rx="2.5" ry="6" fill="#fff" stroke="#EADDE5"/><circle cx="${x - 3}" cy="218" r="1" fill="${INK}"/><circle cx="${x + 3}" cy="218" r="1" fill="${INK}"/>`),
  skates: bothFeet(x => `<rect x="${x - 9}" y="200" width="18" height="18" rx="5" fill="#fff" stroke="#E0D6DE"/><rect x="${x - 11}" y="216" width="22" height="4" rx="2" fill="#FF8FB1"/><circle cx="${x - 6}" cy="224" r="3" fill="#7CC7F0"/><circle cx="${x + 6}" cy="224" r="3" fill="#7CC7F0"/>`),
};

// ── 액세서리 (그리는 층별로) ──
const ACC_BACK = {
  angelwings: `<g fill="#fff" stroke="#E5E0EA"><path d="M80 146C50 120 26 130 30 150C40 150 46 160 60 160C54 168 66 176 80 166Z"/><path d="M120 146C150 120 174 130 170 150C160 150 154 160 140 160C146 168 134 176 120 166Z"/></g>`,
  butterflywings: `<g opacity=".9"><path d="M84 150C56 110 22 126 40 156C30 176 64 186 84 164Z" fill="#C79BF0"/><path d="M116 150C144 110 178 126 160 156C170 176 136 186 116 164Z" fill="#FF9EC7"/></g><circle cx="52" cy="146" r="5" fill="#fff" opacity=".7"/><circle cx="148" cy="146" r="5" fill="#fff" opacity=".7"/>`,
};
const ACC_BODY = {
  scarf: `<rect x="80" y="122" width="40" height="12" rx="6" fill="#E2455F"/><rect x="104" y="128" width="9" height="26" rx="4" fill="#E2455F"/><path d="M106 152v4M110 152v4" stroke="#fff"/>`,
  necklace: `<path d="M87 130q13 14 26 0" stroke="#E0A800" stroke-width="1.5" fill="none"/>` + heart(100, 144, 3.5, '#FF6F91'),
  bag: `<path d="M84 130L124 172" stroke="#8A5A3B" stroke-width="2.5"/><rect x="114" y="166" width="22" height="18" rx="5" fill="#FF8FB1"/><path d="M114 172h22" stroke="#F5739B" stroke-width="2"/><circle cx="125" cy="176" r="2" fill="#fff"/>`,
  mic: `<g transform="rotate(-20 142 170)"><rect x="139" y="152" width="6" height="26" rx="3" fill="#4A4458"/><circle cx="142" cy="150" r="7" fill="#9AA0B5"/><path d="M137 147h10M137 151h10" stroke="#7D8399" stroke-width="1"/></g>`,
  lightstick: `<g transform="rotate(-18 142 172)"><rect x="139" y="146" width="6" height="32" rx="3" fill="#fff" stroke="#D8CFE0"/><circle cx="142" cy="140" r="10" fill="#FFB3D9" opacity=".5"/>${heart(142, 140, 7, '#FF6FB0')}</g>`,
  wand: `<g transform="rotate(-18 142 172)"><rect x="140" y="140" width="4" height="40" rx="2" fill="#FFD66B"/>${star(142, 136, 10, '#FFE066', 'stroke="#E0A800" stroke-width="1"')}</g><circle cx="160" cy="128" r="1.5" fill="#FFE066"/><circle cx="154" cy="118" r="1" fill="#FFE066"/>`,
  flower: `<path d="M58 178l-4-28" stroke="#3DAA6B" stroke-width="2.5"/>${flower(53, 146, 5, '#FF8FB1')}`,
  icecream: `<path d="M50 166l8 18 8-18z" fill="#E8B06B"/><circle cx="58" cy="162" r="8" fill="#FFC6DA"/><circle cx="58" cy="153" r="6" fill="#B9F0D8"/><circle cx="60" cy="148" r="2" fill="#E2455F"/>`,
  bubbletea: `<path d="M48 158h20l-3 26h-14z" fill="#E9D6C0" opacity=".95"/><path d="M48 158h20" stroke="#fff" stroke-width="2"/><path d="M60 158l6-14" stroke="#FF6F91" stroke-width="2.5"/><circle cx="53" cy="180" r="2" fill="#3A2630"/><circle cx="58" cy="181" r="2" fill="#3A2630"/><circle cx="63" cy="180" r="2" fill="#3A2630"/>`,
  balloon: `<path d="M58 176q-8-40-16-74" stroke="#9AA0B5" stroke-width="1"/>` + heart(40, 92, 16, '#FF5C8A') + `<path d="M34 84q2-6 8-6" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
  phone: `<rect x="46" y="156" width="16" height="26" rx="4" fill="#FF9EC0"/><rect x="48.5" y="159" width="11" height="20" rx="2" fill="#2E2E36"/>${heart(54, 168, 3, '#FF6FB0')}<circle cx="49" cy="159" r="1.4" fill="#fff"/>`,
  teddy: `<circle cx="44" cy="186" r="11" fill="#C9925D"/><circle cx="44" cy="170" r="9" fill="#C9925D"/><circle cx="37" cy="163" r="3.5" fill="#C9925D"/><circle cx="51" cy="163" r="3.5" fill="#C9925D"/><ellipse cx="44" cy="173" rx="4" ry="3" fill="#F2D2A9"/><circle cx="41" cy="168" r="1.2" fill="${INK}"/><circle cx="47" cy="168" r="1.2" fill="${INK}"/><circle cx="44" cy="172" r="1" fill="${INK}"/>`,
};
const ACC_HEAD = {
  headphones: `<path d="M54 88C50 18 150 18 146 88" stroke="#5B2A6B" stroke-width="6" fill="none"/><rect x="44" y="76" width="14" height="24" rx="6" fill="#FF6F91"/><rect x="142" y="76" width="14" height="24" rx="6" fill="#FF6F91"/>`,
  starpin: star(68, 56, 7, '#FFE066', 'stroke="#E0A800" stroke-width="1"'),
  butterflyclip: `<path d="M66 60l-10-8v14zM66 60l10-8v14z" fill="#B79BF0"/><path d="M66 60l-8 6v-2zM66 60l8 6" fill="#8E5BD8"/>`,
  ribbon: `<g fill="#FF6F91"><path d="M134 44L118 34L120 54Z"/><path d="M134 44L150 34L148 54Z"/><circle cx="134" cy="44" r="5"/></g>`,
  crown: `<path d="M80 34L84 14L94 26L100 10L106 26L116 14L120 34Z" fill="#FFC93C" stroke="#E0A800" stroke-width="1.5"/><circle cx="100" cy="28" r="3" fill="#FF6F91"/><circle cx="88" cy="30" r="2" fill="#7CC7F0"/><circle cx="112" cy="30" r="2" fill="#7CC7F0"/>`,
};
const ACC_FACE = {
  glasses: `<g stroke="${INK}" stroke-width="2.2" fill="#fff" fill-opacity=".15"><circle cx="83" cy="92" r="11"/><circle cx="117" cy="92" r="11"/></g><path d="M94 91q6-3 12 0" stroke="${INK}" stroke-width="2" fill="none"/>`,
  sunglasses: heart(83, 92, 11, '#FF5C8A', 'opacity=".9"') + heart(117, 92, 11, '#FF5C8A', 'opacity=".9"') + `<path d="M93 89q7-3 14 0" stroke="${INK}" stroke-width="2" fill="none"/><path d="M78 86q3-2 6 0M112 86q3-2 6 0" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/>`,
};

// 착용 정보 → SVG 문자열. view: 'full'(전신) | 'head'(얼굴 확대)
export function renderAvatar(eqIn, { view = 'full', className = '' } = {}) {
  const eq = { ...DEFAULT_EQUIPPED, ...eqIn };
  const skin = SKIN[eq.skin] || SKIN.light;
  const [rx, ry] = FACE[eq.face] || FACE.round;
  const headT = `translate(100 82) scale(${(rx / 44).toFixed(3)} ${(ry / 44).toFixed(3)}) translate(-100 -82)`;
  let defs = '', hairFill = HAIR[eq.hairColor] || HAIR.brown, browC = hairFill;
  if (HAIR_GRAD[eq.hairColor]) {
    const [a, b] = HAIR_GRAD[eq.hairColor], id = `hg${++uid}`;
    defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
    hairFill = `url(#${id})`; browC = a;
  }
  const hair = hairLayers(eq.hair, hairFill);
  const acc = new Set(eq.acc || []);
  const pick = map => Object.keys(map).filter(k => acc.has(k)).map(k => map[k]).join('');
  const full = FULL_BODY.has(eq.top);

  const svg = [
    defs,
    BG[eq.bg] || BG.pastel,
    pick(ACC_BACK),
    `<g transform="${headT}">${hair.back}</g>`,
    // 몸
    `<g fill="${skin}"><rect x="81" y="172" width="15" height="48" rx="7"/><rect x="104" y="172" width="15" height="48" rx="7"/>` +
    `<rect x="60" y="134" width="14" height="44" rx="7" transform="rotate(12 67 136)"/><rect x="126" y="134" width="14" height="44" rx="7" transform="rotate(-12 133 136)"/>` +
    `<rect x="74" y="130" width="52" height="50" rx="14"/><rect x="93" y="116" width="14" height="18"/>` +
    `<ellipse cx="88" cy="219" rx="9" ry="5"/><ellipse cx="112" cy="219" rx="9" ry="5"/></g>`,
    // 속옷 (기본)
    `<rect x="82" y="129" width="5" height="10" rx="2" fill="#fff"/><rect x="113" y="129" width="5" height="10" rx="2" fill="#fff"/>` +
    `<rect x="76" y="136" width="48" height="32" rx="8" fill="#fff" stroke="#EADDE5"/>` +
    `<rect x="76" y="165" width="48" height="21" rx="7" fill="#FFC6D8"/><circle cx="100" cy="169" r="2.2" fill="#FF6F91"/>`,
    !full && eq.bottom ? BOTTOM[eq.bottom] || '' : '',
    eq.top && TOP[eq.top] ? TOP[eq.top]() : '',
    eq.shoes ? SHOES[eq.shoes] || '' : '',
    pick(ACC_BODY),
    // 얼굴
    `<g fill="${skin}"><ellipse cx="${100 - rx}" cy="88" rx="7" ry="9"/><ellipse cx="${100 + rx}" cy="88" rx="7" ry="9"/><ellipse cx="100" cy="82" rx="${rx}" ry="${ry}"/></g>`,
    acc.has('earrings') ? heart(100 - rx, 100, 3.5, '#FF6F91') + heart(100 + rx, 100, 3.5, '#FF6F91') : '',
    (CHEEK[eq.cheek] || CHEEK.blush)(),
    eyesSvg(eq.eyes),
    (BROWS[eq.brows] || BROWS.none)(browC),
    NOSE[eq.nose] || NOSE.dot,
    MOUTH[eq.mouth] || MOUTH.smile,
    `<g transform="${headT}">${hair.front}${eq.hat ? HAT[eq.hat] || '' : ''}${pick(ACC_HEAD)}</g>`,
    pick(ACC_FACE),
    eq.pet ? PET[eq.pet] || '' : '',
  ].join('');
  const vb = view === 'head' ? '34 -4 132 144' : '0 0 200 240';
  return `<svg class="${className}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="내 캐릭터">${svg}</svg>`;
}

// ── 저장/구매 ──
// 산 적 없는 유료 아이템이 착용 정보에 들어 있으면 기본값으로 되돌린다.
export function sanitize(eqIn, owned) {
  const eq = { ...DEFAULT_EQUIPPED, ...eqIn };
  const ok = (slot, key) => { const it = itemById(`${slot}:${key}`); return it && (it.price === 0 || owned.has(it.id)); };
  for (const c of CATEGORIES) {
    if (c.multi) eq[c.slot] = (Array.isArray(eq[c.slot]) ? eq[c.slot] : []).filter(k => ok(c.slot, k));
    else if (eq[c.slot] == null) { if (!c.optional) eq[c.slot] = DEFAULT_EQUIPPED[c.slot]; }
    else if (!ok(c.slot, eq[c.slot])) eq[c.slot] = DEFAULT_EQUIPPED[c.slot];
  }
  return eq;
}

// 액세서리 켜고 끄기. 같은 그룹(한 손, 날개, 안경)은 하나만 남긴다.
export function toggleAcc(list, key) {
  if (list.includes(key)) return list.filter(k => k !== key);
  const group = itemById(`acc:${key}`)?.group;
  const kept = group ? list.filter(k => itemById(`acc:${k}`)?.group !== group) : list;
  return [...kept, key];
}

export async function loadAvatar() {
  const session = await getSession();
  if (!session) return { equipped: { ...DEFAULT_EQUIPPED }, owned: new Set(), spent: 0 };
  const uidStr = session.user.id;
  const [st, pu] = await Promise.all([
    supabase.from('avatar_state').select('equipped').eq('user_id', uidStr).maybeSingle(),
    supabase.from('avatar_purchases').select('item_id, price').eq('user_id', uidStr),
  ]);
  if (st.error) throw st.error;
  if (pu.error) throw pu.error;
  const owned = new Set(pu.data.map(r => r.item_id));
  const spent = pu.data.reduce((s, r) => s + Number(r.price), 0);
  return { equipped: sanitize(st.data?.equipped || {}, owned), owned, spent };
}

export async function saveEquipped(equipped) {
  const session = await getSession();
  if (!session) return;
  const { error } = await supabase.from('avatar_state').upsert({
    user_id: session.user.id, equipped, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

// 쓸 수 있는 점수를 서버 데이터로 다시 계산한 뒤 산다 (다른 기기에서 쓴 점수도 반영).
export async function buyItem(itemId) {
  const item = itemById(itemId);
  if (!item) throw new Error('없는 아이템이에요.');
  const [{ total }, { owned, spent }] = await Promise.all([getPointsSummary(), loadAvatar()]);
  if (owned.has(itemId)) return { balance: total - spent };
  if (total - spent < item.price) throw new Error('점수가 부족해요.');
  const session = await getSession();
  const { error } = await supabase.from('avatar_purchases').insert({ user_id: session.user.id, item_id: itemId, price: item.price });
  if (error) throw error;
  return { balance: total - spent - item.price };
}

// 홈·유닛 화면에 내 캐릭터를 그려 넣는다. 실패해도 기본 캐릭터는 보인다.
export async function mountAvatar(el, opts) {
  el.innerHTML = renderAvatar(DEFAULT_EQUIPPED, opts);
  try {
    const { equipped } = await loadAvatar();
    el.innerHTML = renderAvatar(equipped, opts);
  } catch (e) { console.error('avatar load failed', e); }
}
