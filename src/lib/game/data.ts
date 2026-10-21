import type { ContractTemplate, PPI, SystemId } from "./types";

export const GAME_TITLE = "КБ «Мята»";
export const SAVE_KEY = "kb-myata-v1";

export const EARTH_R = 2;
export const SAT_ALT = 0.28;
export const SAT_R = EARTH_R + SAT_ALT;
export const INC_RAD = (97.4 * Math.PI) / 180;
export const RAAN_RAD = (28 * Math.PI) / 180;
export const ORBIT_PERIOD_S = 36;
export const EARTH_DAY_S = 36 * 15;
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
} as const;

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
