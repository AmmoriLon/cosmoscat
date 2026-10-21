import type { CameraId, ContractTemplate, MemoryId, OrbitId, PPI, SystemId, WorkshopDraft } from "./types";

export const GAME_TITLE = "КБ «Мята»";
export const SAVE_KEY = "kb-myata-v1";

export const CAT_PORTRAITS: Record<string, string> = {
  "Кот-президент": "/game/cat-president.jpg",
  Пыжик: "/game/cat-pyzhik.jpg",
  Мурка: "/game/cat-murka.jpg",
  Барсик: "/game/cat-barsik.jpg",
  Кефир: "/game/cat-kefir.jpg",
  Снежок: "/game/cat-snezhok.jpg",
  Василий: "/game/cat-vasiliy.jpg",
  Рыська: "/game/cat-ryska.jpg",
  Клык: "/game/cat-klyk.jpg",
  Сахарок: "/game/cat-sakharok.jpg",
};

export const EARTH_R = 2;
export const SAT_ALT = 0.28;
export const SAT_R = EARTH_R + SAT_ALT;
export const INC_RAD = (97.4 * Math.PI) / 180;
export const RAAN_RAD = (28 * Math.PI) / 180;
export const ORBIT_PERIOD_S = 36;
export const EARTH_DAY_S = 36 * 15;
export const DAY_SEC = 48;
export const BUS_COST = 700;
export const LAUNCH_END_S = 13.8;
export const IMAGE_WINDOW_DEG = 42;
export const APPROACH_DEG = 58;
export const PPI_WINDOW_DEG = 46;
export const TAP_REPAIR = 12;
export const ENGINEER_REPAIR_PER_S = 3.6;
export const DOWNLINK_S = 2.6;
export const PROCESS_BASE_S = 6.2;
export const GSD_BY_OPTICS = [8.6, 5.4, 3.1];

export const PPIS: PPI[] = [
  { id: "north", name: "ППИ «Ус-Север»", short: "Север", lat: 68.97, lon: 33.08 },
  { id: "steppe", name: "ППИ «Степной»", short: "Степь", lat: 47.85, lon: 67.55 },
  { id: "east", name: "ППИ «Тихий»", short: "Тихий", lat: 52.97, lon: 158.65 },
];

export const SYSTEMS: Record<
  SystemId,
  { name: string; code: string; blurb: string; chips: string[]; image: string }
> = {
  rocket: {
    name: "Носитель «Камыш-2»",
    code: "РН-Л",
    blurb: "Старая лёгкая ракета. Поднимет кубсат и разгонный блок на низкую орбиту.",
    chips: ["Двигатель", "Баки", "Управление", "Обтекатель"],
    image: "/game/hardware-rocket-cat.jpg",
  },
  booster: {
    name: "Разгонный блок «Ласточка-Б»",
    code: "РБ",
    blurb: "Доталкивает спутник с низкой орбиты на рабочую, 535 км.",
    chips: ["Двигатель", "Ориентация", "Компьютер", "Стыковка"],
    image: "/game/hardware-booster-cat.jpg",
  },
  sat: {
    name: "Кубсат «Лапка-1»",
    code: "3U / ОПТ",
    blurb: "Маленький аппарат с камерой. Снимает Землю и сбрасывает кадр на ППИ.",
    chips: ["Корпус", "Батареи", "Камера", "Радио"],
    image: "/game/hardware-sat-cat.jpg",
  },
};

export const PHOTO_IMG = {
  port: "/game/photo-port.jpg",
  fields: "/game/photo-fields.jpg",
  storm: "/game/photo-storm.jpg",
  ice: "/game/photo-ice.jpg",
  city: "/game/photo-city.jpg",
  coast: "/game/photo-coast.jpg",
  mine: "/game/photo-mine.jpg",
  desert: "/game/photo-desert.jpg",
  volcano: "/game/photo-volcano.jpg",
  forest: "/game/photo-forest.jpg",
  aurora: "/game/photo-aurora.jpg",
} as const;

export const ORBITS: Record<
  OrbitId,
  {
    name: string;
    kind: string;
    blurb: string;
    inc: number;
    raan: number;
    alt: number;
    ecc: number;
    period: number;
    maxLat: number;
    cost: number;
    lifeDays: number;
  }
> = {
  sso535: {
    name: "ССО 535 км",
    kind: "круговая",
    blurb: "Солнечно-синхронная, 97.4°. Ходит над всей Землёй, как «Лапка-1».",
    inc: 97.4,
    raan: 28,
    alt: 0.28,
    ecc: 0,
    period: 36,
    maxLat: 90,
    cost: 1400,
    lifeDays: 10,
  },
  eq400: {
    name: "Экваториальная 400 км",
    kind: "круговая",
    blurb: "Дешевле и ниже. Не берёт высокие широты, сгорает раньше.",
    inc: 8,
    raan: 0,
    alt: 0.18,
    ecc: 0,
    period: 28,
    maxLat: 22,
    cost: 900,
    lifeDays: 6,
  },
  polar800: {
    name: "Полярная 800 км",
    kind: "круговая",
    blurb: "Выше и дольше живёт. Полюса каждый виток, период длиннее.",
    inc: 90,
    raan: 12,
    alt: 0.42,
    ecc: 0,
    period: 48,
    maxLat: 90,
    cost: 2400,
    lifeDays: 16,
  },
  ellip: {
    name: "Эллиптическая 300×1200",
    kind: "эллиптическая",
    blurb: "Перигей низкий, апогей высокий. Долго висит над севером, горит неравномерно.",
    inc: 63.4,
    raan: 40,
    alt: 0.34,
    ecc: 0.32,
    period: 44,
    maxLat: 82,
    cost: 3000,
    lifeDays: 11,
  },
};

export const CAMERAS: Record<CameraId, { name: string; short: string; blurb: string; cost: number }> = {
  opt: { name: "Оптика", short: "ОПТ", blurb: "Видимый диапазон. База почти любого КА.", cost: 0 },
  ir: { name: "Инфракрас", short: "ИК", blurb: "Ночь, тепло, сияние. Нужен для ночных заявок.", cost: 1500 },
  ms: { name: "Мультиспектр", short: "МС", blurb: "Цветность полей и леса. Агрономы платят больше.", cost: 1700 },
};

export const MEMORIES: Record<MemoryId, { name: string; slots: number; blurb: string; cost: number }> = {
  bzu1: { name: "БЗУ 1 кадр", slots: 1, blurb: "Как на «Лапке-1». Снял — жди сброс.", cost: 0 },
  bzu4: { name: "БЗУ 4 кадра", slots: 4, blurb: "Можно держать пачку до зоны ППИ.", cost: 850 },
  bzu16: { name: "БЗУ 16 кадров", slots: 16, blurb: "Почти как у аппарата побольше.", cost: 2100 },
};

export function buildCost(draft: WorkshopDraft) {
  const cams = draft.cameras.reduce((sum, id) => sum + CAMERAS[id].cost, 0);
  return BUS_COST + ORBITS[draft.orbit].cost + cams + MEMORIES[draft.memory].cost;
}

export function craftLifeSec(orbit: OrbitId) {
  return ORBITS[orbit].lifeDays * DAY_SEC;
}

export function emptyWorkshop(name = "Лапка-2"): WorkshopDraft {
  return { name, orbit: "sso535", cameras: ["opt"], memory: "bzu1" };
}

export const INTRO = [
  {
    speaker: "Кот-президент",
    role: "резиденция",
    fur: "#f3d2b3",
    text: "Назначаю тебя генеральным конструктором КБ «Мята».",
  },
  {
    speaker: "Кот-президент",
    role: "резиденция",
    fur: "#f3d2b3",
    text: "В мире людей мы нашли кое-что потрясающее. Их космические аппараты — и то, как их можно использовать.",
  },
  {
    speaker: "Пыжик",
    role: "главный инженер",
    fur: "#e07a3d",
    text: "В ангаре собрали небольшую команду и прототип: носитель «Камыш-2», разгонный блок «Ласточка-Б» и кубсат «Лапка-1» с камерой. Инженеры уже на месте. Надо довести железо.",
  },
  {
    speaker: "Кот-президент",
    role: "резиденция",
    fur: "#f3d2b3",
    text: "Начнём с кубсатов и оптической съёмки. Получим первые деньги со снимков — и построим что-то покруче.",
  },
];

export const LAUNCH_BEATS = [
  { t: 0.2, title: "Готовность", detail: "Расчёт: опорная 200 км → ССО 535 км. Полезная нагрузка законсервирована." },
  { t: 1.6, title: "Зажигание", detail: "ТНА вышел на режим. Давление в камере в допуске. Держим." },
  { t: 3.0, title: "Отрыв", detail: "«Камыш-2» ушёл со стола. Телеметрия есть. Крен в норме." },
  { t: 5.0, title: "Отделение ступени", detail: "Первая отработала. Разгонный блок живой, БЦВМ отвечает." },
  { t: 6.6, title: "Сброс обтекателя", detail: "ПН видит небо. Створки ушли чисто." },
  { t: 8.2, title: "Довыведение", detail: "«Ласточка-Б» жжёт до рабочего витка. Наклонение 97.4°." },
  { t: 10.0, title: "Отделение КА", detail: "«Лапка-1» в автономке. СБ раскрылись, радиолиния на ППИ «Степной»." },
];

export const CONTRACTS: ContractTemplate[] = [
  {
    id: "port",
    client: "Мурка",
    role: "картограф",
    title: "Порт «Рыбный»",
    brief: "Нужна свежая оптика причалов. Люди так снимают порты с 3U — проверим, хватит ли нашей полосы.",
    lat: 59.94,
    lon: 30.31,
    biome: "port",
    payout: 1180,
    fur: "#d7b08c",
    camera: "opt",
  },
  {
    id: "fields",
    client: "Барсик",
    role: "агроном",
    title: "Поля улесья",
    brief: "Оценить всходы. Цветность важнее метров: даже 8 м ГСД покажет, где полосы выгорели.",
    lat: 51.67,
    lon: 39.21,
    biome: "fields",
    payout: 960,
    fur: "#c9864a",
    camera: "opt",
  },
  {
    id: "storm",
    client: "Кефир",
    role: "метеослужба",
    title: "Циклон над водой",
    brief: "Глаз бури для сводки. Оптика слепнет в сплошной облачности — если кадр молочный, цена упадёт.",
    lat: 16.4,
    lon: 136.2,
    biome: "storm",
    payout: 1340,
    fur: "#7f8b99",
    camera: "opt",
  },
  {
    id: "ice",
    client: "Снежок",
    role: "гляциолог",
    title: "Кромка шельфа",
    brief: "Наука. Нужна кромка льда, не открытая вода. На ССО мы проходим полюс каждый виток — не прозевай.",
    lat: -75.1,
    lon: -102.4,
    biome: "ice",
    payout: 1410,
    fur: "#efe6dc",
    camera: "opt",
  },
  {
    id: "city",
    client: "Василий",
    role: "мэр",
    title: "Столица ночью",
    brief: "Свет улиц и новая кольцевая. Съёмка в надир, без смаза. Потом продадим управе как «актуальный слой».",
    lat: 55.75,
    lon: 37.62,
    biome: "city",
    payout: 1250,
    fur: "#b0794a",
    camera: "opt",
  },
  {
    id: "coast",
    client: "Рыська",
    role: "рыбнадзор",
    title: "Кромка льда и косяк",
    brief: "Где вода вскрылась — туда пойдут суда. Оптика с кубсата для этого как раз.",
    lat: 70.3,
    lon: 57.8,
    biome: "coast",
    payout: 1080,
    fur: "#d8a36a",
    camera: "opt",
  },
  {
    id: "mine",
    client: "Клык",
    role: "геолог",
    title: "Карьер «Рыжий»",
    brief: "Контур отвала и свежие терриконы. Позже такие вещи лучше делает радар, но его ещё нет.",
    lat: -22.6,
    lon: 17.1,
    biome: "mine",
    payout: 1290,
    fur: "#a65b32",
    camera: "opt",
  },
  {
    id: "desert",
    client: "Сахарок",
    role: "караван-карта",
    title: "Дюны и след дороги",
    brief: "Нужен коридор через барханы. Контраст хороший, облаков мало — оптика должна отработать чисто.",
    lat: 24.5,
    lon: 13.2,
    biome: "desert",
    payout: 1020,
    fur: "#e6c27a",
    camera: "opt",
  },
  {
    id: "volcano",
    client: "Клык",
    role: "геолог",
    title: "Кальдера «Дымка»",
    brief: "Свежая оптика жерла и пепла. Если будет ИК — потом снимем тепло, пока только контур.",
    lat: -8.4,
    lon: 115.5,
    biome: "volcano",
    payout: 1380,
    fur: "#a65b32",
    camera: "opt",
  },
  {
    id: "forest",
    client: "Барсик",
    role: "агроном",
    title: "Тайга у кряжа",
    brief: "Нужен мультиспектр: зелень и вырубки. Обычная оптика тут почти слепая — цветности мало.",
    lat: 61.8,
    lon: 96.1,
    biome: "forest",
    payout: 1520,
    fur: "#c9864a",
    camera: "ms",
  },
  {
    id: "aurora",
    client: "Снежок",
    role: "гляциолог",
    title: "Сияние над кромкой",
    brief: "Ночной проход. Оптика не вытянет — нужен ИК-канал и полярная или ССО.",
    lat: 69.3,
    lon: 88.2,
    biome: "aurora",
    payout: 1680,
    fur: "#efe6dc",
    camera: "ir",
  },
];

export const UPGRADES = {
  optics: [
    { level: 1, cost: 3200, title: "Юстировка 90 мм", detail: "ГСД ~5.4 м. Заказчики платят больше за резкость." },
    { level: 2, cost: 7200, title: "Новый ПЗС и фильтр", detail: "ГСД ~3.1 м. Почти как у аппаратов «побольше»." },
  ],
  operators: [
    { level: 1, cost: 2400, title: "Вторая смена ППИ", detail: "Дешифровка сырого потока почти вдвое быстрее." },
    { level: 2, cost: 5400, title: "Автоматический L1", detail: "Радиометрия и привязка без очереди у планшета." },
  ],
};

export const ROADMAP = [
  {
    id: "cubesat",
    title: "Кубсат «Лапка-1»",
    status: "active" as const,
    text: "Оптика, один кадр на борту, сброс на ППИ. То, с чего начинают все.",
  },
  {
    id: "bigger",
    title: "КА «Рысь»",
    status: "soon" as const,
    text: "Аппарат побольше: геолокация точнее, научный канал, память на пачку кадров.",
  },
  {
    id: "radar",
    title: "Радар «Ирбис»",
    status: "locked" as const,
    text: "РСА сквозь облака. Снимки дороже, но нужна антенна 3 м и носитель тяжелее «Камыша».",
  },
  {
    id: "tug",
    title: "Ядерный буксир «Топаз»",
    status: "locked" as const,
    text: "Отдельная история. Межорбитальная тяга, реактор, другие заказчики. Пока только в папке президента.",
  },
];
