import { $, toast, fmtDist, fmtTime, escapeHtml } from './core.js';
import { YandexRouter } from './router.js';

let map, multiRoute, viaPoints = [], objectManager;
const pointCache = { from: null, to: null };
let routeEventLinks = [];

export function init() {
  const cfg = window.TRANSTIME_CONFIG?.yandex;
  if (!cfg?.apiKey) return toast('Ошибка конфигурации: нет API ключа');

  // Защитимся от повторной инициализации
  if (window.__TT_YA_LOADING__) return;
  window.__TT_YA_LOADING__ = true;

  const script = document.createElement('script');
  script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(cfg.apiKey)}&lang=${encodeURIComponent(cfg.lang || 'ru_RU')}&load=package.standard,package.search,package.suggest,multiRouter.MultiRoute,package.geoObjects`;
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
  const routeList = $('#routeList');
  const suggestMap = {
    from: { input: from, box: $('#fromSuggest'), timer: 0, last: '' },
    to: { input: to, box: $('#toSuggest'), timer: 0, last: '' }
  };

  // Добавление via-точек кликом
  map.events.add('click', (e) => {
    viaPoints.push(e.get('coords'));
    toast(`Добавлена via-точка (${viaPoints.length})`, 2000);
  });

  if (buildBtn) buildBtn.addEventListener('click', onBuild);
  if (clearVia) clearVia.addEventListener('click', () => {
    viaPoints = [];
    toast('Via-точки очищены', 1500);
  });

  setupSuggest('from');
  setupSuggest('to');

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

      const A = await resolvePoint('from', fromVal);
      const B = await resolvePoint('to', toVal);
      const points = [A, ...viaPoints, B];

      const { multiRoute: mr } = await YandexRouter.build(points, opts);
      if (multiRoute) {
        detachRouteEvents();
        map.geoObjects.remove(multiRoute);
      }
      multiRoute = mr;
      map.geoObjects.add(multiRoute);
      attachRouteEvents();
      multiRoute.editor.start({
        addWayPoints: true,
        removeWayPoints: true,
        dragUpdatePolicy: 'recalculateRoute'
      });
      toast('Маршрут построен', 2000);
    } catch (e) {
      toast(typeof e === 'string' ? e : (e.message || 'Ошибка маршрута'));
    }
  }

  function setupSuggest(key) {
    const state = suggestMap[key];
    if (!state?.input || !state.box) return;

    const { input, box } = state;

    const request = async (val) => {
      state.last = val;
      try {
        const items = await ymaps.suggest(val, { results: 6 });
        if (state.last !== val) return;
        renderSuggest(key, items);
      } catch (err) {
        console.error('suggest error', err);
      }
    };

    input.addEventListener('input', () => {
      pointCache[key] = null;
      const val = input.value.trim();
      if (!val) return hideSuggest(key);
      clearTimeout(state.timer);
      state.timer = window.setTimeout(() => request(val), 220);
    });

    input.addEventListener('focus', () => {
      const val = input.value.trim();
      if (val) request(val);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideSuggest(key);
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => hideSuggest(key), 150);
    });

    box.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.suggestItem');
      if (!btn) return;
      e.preventDefault();
      const value = btn.getAttribute('data-value');
      if (value) chooseSuggest(key, value);
    });
  }

  function renderSuggest(key, items = []) {
    const state = suggestMap[key];
    if (!state?.box || !state.input) return;

    const box = state.box;
    if (!Array.isArray(items) || !items.length) {
      hideSuggest(key);
      return;
    }

    box.innerHTML = items
      .map((item, idx) => {
        const label = escapeHtml(item.displayName || item.value || '');
        const value = escapeHtml(item.value || '');
        return `<button type="button" class="suggestItem" role="option" data-index="${idx}" data-value="${value}">${label}</button>`;
      })
      .join('');
    box.classList.add('show');
    state.input.setAttribute('aria-expanded', 'true');
  }

  function hideSuggest(key) {
    const state = suggestMap[key];
    if (!state?.box || !state.input) return;
    state.box.classList.remove('show');
    state.input.setAttribute('aria-expanded', 'false');
  }

  async function chooseSuggest(key, value) {
    const state = suggestMap[key];
    if (!state?.input) return;
    state.input.value = value;
    hideSuggest(key);
    try {
      const coords = await YandexRouter.geocode(value);
      pointCache[key] = { value, coords };
    } catch (err) {
      toast(typeof err === 'string' ? err : 'Адрес не найден');
    }
  }

  async function resolvePoint(key, value) {
    const cached = pointCache[key];
    if (cached && cached.value === value && Array.isArray(cached.coords)) return cached.coords;
    const coords = await YandexRouter.geocode(value);
    pointCache[key] = { value, coords };
    return coords;
  }

  function attachRouteEvents() {
    if (!multiRoute) return;
    const handler = () => updateRouteList();
    const handlerActive = () => updateRouteList();
    multiRoute.model.events.add('requestsuccess', handler);
    multiRoute.events.add('activeroutechange', handlerActive);
    routeEventLinks = [
      { target: multiRoute.model.events, type: 'requestsuccess', fn: handler },
      { target: multiRoute.events, type: 'activeroutechange', fn: handlerActive }
    ];
    updateRouteList();
  }

  function detachRouteEvents() {
    routeEventLinks.forEach(({ target, type, fn }) => {
      target.remove(type, fn);
    });
    routeEventLinks = [];
  }

  function updateRouteList() {
    if (!routeList) return;
    if (!multiRoute) {
      routeList.innerHTML = '';
      routeList.style.display = 'none';
      routeList.setAttribute('aria-hidden', 'true');
      return;
    }

    const routes = multiRoute.getRoutes();
    if (!routes || routes.getLength() === 0) {
      routeList.innerHTML = '';
      routeList.style.display = 'none';
      routeList.setAttribute('aria-hidden', 'true');
      return;
    }

    const wayPoints = multiRoute.getWayPoints?.();
    if (wayPoints) {
      const updated = [];
      const total = wayPoints.getLength?.() ?? 0;
      if (total >= 2) {
        wayPoints.each((wp, idx) => {
          if (idx > 0 && idx < total - 1 && wp?.geometry?.getCoordinates) {
            updated.push(wp.geometry.getCoordinates());
          }
        });
      }
      viaPoints = updated;
    }

    const active = multiRoute.getActiveRoute();
    const html = [];
    routes.each((route, index) => {
      const isActive = route === active;
      const humanLength = typeof route.getHumanLength === 'function'
        ? route.getHumanLength()
        : fmtDist(route?.properties?.get('distance')?.value || 0);
      const humanTime = typeof route.getHumanTime === 'function'
        ? route.getHumanTime()
        : fmtTime(route?.properties?.get('duration')?.value || 0);
      html.push(
        `<button type="button" class="routeItem${isActive ? ' active' : ''}" data-index="${index}" role="option" aria-selected="${isActive}">
           <div class="routeTitle">Маршрут ${index + 1}</div>
           <div class="small">${escapeHtml(humanLength)} • ${escapeHtml(humanTime)}</div>
         </button>`
      );
    });

    routeList.innerHTML = html.join('');
    routeList.style.display = 'block';
    routeList.setAttribute('aria-hidden', 'false');
    routeList.querySelectorAll('.routeItem').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const routesCollection = multiRoute.getRoutes();
        const route = routesCollection?.get(idx);
        if (route) multiRoute.setActiveRoute(route);
      });
    });
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
