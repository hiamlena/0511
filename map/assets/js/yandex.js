import { $, $$, toast, fmtDist, fmtTime, escapeHtml } from './core.js';
import { YandexRouter } from './router.js';

let map, multiRoute, viaPoints = [], objectManager;

export function init() {
  const cfg = window.TRANSTIME_CONFIG?.yandex;
  if (!cfg?.apiKey) return toast('Ошибка конфигурации: нет API ключа');

  // Защитимся от повторной инициализации
  if (window.__TT_YA_LOADING__) return;
  window.__TT_YA_LOADING__ = true;

  const script = document.createElement('script');
  script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(cfg.apiKey)}&lang=${encodeURIComponent(cfg.lang || 'ru_RU')}&load=package.standard,package.search,package.multiRouter,package.geoObjects`;
  script.onload = () => (window.ymaps ? ymaps.ready(setup) : toast('Yandex API не инициализировался'));
  script.onerror = () => toast('Не удалось загрузить Yandex Maps');
  document.head.appendChild(script);
}

function setup() {
  const cfg = window.TRANSTIME_CONFIG;
  const center = cfg?.map?.center || [55.751244, 37.618423];
  const zoom = cfg?.map?.zoom || 8;

  map = new ymaps.Map('map', { center, zoom, controls: ['zoomControl', 'typeSelector'] }, { suppressMapOpenBlock: true });

  // UI
  const from = $('#from');
  const to = $('#to');
  const buildBtn = $('#buildBtn');
  const clearVia = $('#clearVia');
  const vehRadios = $$('input[name=veh]');

  // Добавление via-точек кликом
  map.events.add('click', (e) => {
    viaPoints.push(e.get('coords'));
    toast(`Добавлена via-точка (${viaPoints.length})`, 2000);
  });

  if (buildBtn) buildBtn.addEventListener('click', onBuild);
  if (clearVia) clearVia.addEventListener('click', () => { viaPoints = []; toast('Via-точки очищены', 1500); });

  // Подгружаем рамки (тихо, без падения страницы)
  loadFrames().catch(()=>{});

  async function onBuild() {
    try {
      const mode = (document.querySelector('input[name=veh]:checked')?.value || 'truck40');
      const opts = { mode: 'truck' };
      if (mode === 'car') opts.mode = 'auto';
      if (mode === 'truck40') opts.weight = 40000;
      if (mode === 'truckHeavy') opts.weight = 55000;

      const fromVal = from?.value?.trim();
      const toVal = to?.value?.trim();
      if (!fromVal || !toVal) throw new Error('Укажи адреса Откуда и Куда');

      const A = await YandexRouter.geocode(fromVal);
      const B = await YandexRouter.geocode(toVal);
      const points = [A, ...viaPoints, B];

      const { multiRoute: mr } = await YandexRouter.build(points, opts);
      if (multiRoute) map.geoObjects.remove(multiRoute);
      multiRoute = mr;
      map.geoObjects.add(multiRoute);
      toast('Маршрут построен', 2000);
    } catch (e) {
      toast(typeof e === 'string' ? e : (e.message || 'Ошибка маршрута'));
    }
  }
}

async function loadFrames() {
  try {
    const r = await fetch('../data/frames_ready.geojson?v=' + Date.now());
    if (!r.ok) throw new Error('HTTP '+r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.features)) throw new Error('Некорректный GeoJSON');

    objectManager = new ymaps.ObjectManager({ clusterize: false });
    objectManager.objects.options.set({ preset: 'islands#blueCircleDotIcon' });

    data.features.forEach(f => {
      const p = f.properties || {};
      f.properties = {
        hintContent: p.name || 'Рамка',
        balloonContent: `<b>${escapeHtml(p.name || 'Весовая рамка')}</b>` +
          (p.comment ? `<div class="mt6">${escapeHtml(p.comment)}</div>` : '') +
          (p.date ? `<div class="small mt6">Дата: ${escapeHtml(p.date)}</div>` : '')
      };
    });

    objectManager.add(data);
    map.geoObjects.add(objectManager);
  } catch (e) {
    toast('Рамки не загружены');
  }
}
