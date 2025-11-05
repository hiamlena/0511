import { $, toast, escapeHtml } from './core.js';
import { YandexRouter } from './router.js';

let map, multiRoute, viaPoints = [], objectManager;
let cleanupRoute = () => {};
const selectedPoints = { from: null, to: null };
const suggestContext = {};
let routeListEl, routeItemsEl;
let globalClickBound = false;

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
  routeListEl = $('#routeList');
  routeItemsEl = $('#routeItems');

  // Добавление via-точек кликом
  map.events.add('click', (e) => {
    viaPoints.push(e.get('coords'));
    toast(`Добавлена via-точка (${viaPoints.length})`, 2000);
  });

  attachSuggest('from');
  attachSuggest('to');

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

      let A = getStoredCoords('from', fromVal);
      let B = getStoredCoords('to', toVal);
      if (!A) A = await YandexRouter.geocode(fromVal);
      if (!B) B = await YandexRouter.geocode(toVal);
      selectedPoints.from = { value: fromVal, coords: A };
      selectedPoints.to = { value: toVal, coords: B };
      const points = [A, ...viaPoints, B];

      const { multiRoute: mr, routes } = await YandexRouter.build(points, opts);
      applyMultiRoute(mr, routes);
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

function attachSuggest(id) {
  const input = document.getElementById(id);
  const box = document.querySelector(`.suggestions[data-for="${id}"]`);
  if (!input || !box || !ymaps?.suggest) return;

  suggestContext[id] = { input, box, requestId: 0 };

  input.addEventListener('input', () => {
    const ctx = suggestContext[id];
    if (!ctx) return;
    ctx.requestId += 1;
    const currentId = ctx.requestId;
    const q = input.value.trim();
    selectedPoints[id] = null;
    if (q.length < 3) return hideSuggestions(id);
    ymaps.suggest(q, { results: 5, boundedBy: map?.getBounds?.() }).then((items = []) => {
      if (currentId !== ctx.requestId) return;
      renderSuggestions(id, items);
    }).catch(() => hideSuggestions(id));
  });

  input.addEventListener('focus', () => {
    const ctx = suggestContext[id];
    if (!ctx) return;
    if (ctx.box.childElementCount) ctx.box.classList.add('show');
  });

  if (!globalClickBound) {
    document.addEventListener('click', (evt) => {
      if (!evt.target.closest('.field')) hideSuggestions();
    });
    globalClickBound = true;
  }
}

function renderSuggestions(id, items) {
  const ctx = suggestContext[id];
  if (!ctx) return;
  const { box, input } = ctx;
  box.innerHTML = '';
  if (!items.length) return hideSuggestions(id);
  items.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion';
    btn.role = 'option';
    btn.dataset.index = String(index);
    btn.textContent = item.displayName || item.value;
    btn.addEventListener('click', async () => {
      input.value = item.value;
      hideSuggestions(id);
      try {
        const coords = await YandexRouter.geocode(item.value);
        selectedPoints[id] = { value: item.value, coords };
      } catch (err) {
        console.error(err);
        toast('Не удалось определить координаты адреса');
      }
    });
    box.appendChild(btn);
  });
  box.classList.add('show');
}

function hideSuggestions(id) {
  if (id) {
    const ctx = suggestContext[id];
    if (ctx) ctx.box.classList.remove('show');
    if (ctx) ctx.box.innerHTML = '';
    return;
  }
  Object.values(suggestContext).forEach(ctx => {
    ctx.box.classList.remove('show');
    ctx.box.innerHTML = '';
  });
}

function getStoredCoords(id, value) {
  const entry = selectedPoints[id];
  if (entry && entry.value === value && Array.isArray(entry.coords)) return entry.coords;
  return null;
}

function applyMultiRoute(mr, routes) {
  if (!mr) return;
  cleanupRoute?.();
  if (multiRoute) {
    try { multiRoute.editor.stop(); } catch (e) {}
    if (map && multiRoute) map.geoObjects.remove(multiRoute);
  }
  multiRoute = mr;
  map.geoObjects.add(multiRoute);

  const onRequest = () => {
    renderRouteList();
    syncViaPointsFromRoute();
  };
  const onActiveChange = () => renderRouteList();

  mr.model.events.add('requestsuccess', onRequest);
  mr.events.add('activeroutechange', onActiveChange);
  cleanupRoute = () => {
    mr.model.events.remove('requestsuccess', onRequest);
    mr.events.remove('activeroutechange', onActiveChange);
  };

  renderRouteList(routes);
  syncViaPointsFromRoute();

  try {
    mr.editor.start({
      addWayPoints: true,
      removeWayPoints: true,
      dragUpdatePolicy: 'recalculateRoute'
    });
  } catch (e) {
    console.warn('Не удалось запустить редактор маршрута', e);
  }
}

function renderRouteList(collection) {
  if (!routeListEl || !routeItemsEl) return;
  const routes = collection || multiRoute?.getRoutes?.();
  if (!routes || routes.getLength?.() === 0) {
    routeItemsEl.innerHTML = '';
    routeListEl.classList.remove('show');
    return;
  }

  const active = multiRoute?.getActiveRoute?.();
  const items = [];
  if (typeof routes.each === 'function') {
    routes.each((route) => {
      items.push({ route, idx: items.length });
    });
  } else if (typeof routes.getLength === 'function' && typeof routes.get === 'function') {
    const len = routes.getLength();
    for (let i = 0; i < len; i += 1) {
      const route = routes.get(i);
      if (route) items.push({ route, idx: i });
    }
  } else if (Array.isArray(routes)) {
    routes.forEach((route, idx) => {
      if (route) items.push({ route, idx });
    });
  }

  if (!items.length) {
    routeItemsEl.innerHTML = '';
    routeListEl.classList.remove('show');
    return;
  }

  routeItemsEl.innerHTML = '';
  items.forEach(({ route, idx }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'routeItem';
    if (active === route) btn.classList.add('active');

    const title = document.createElement('div');
    title.className = 'routeTitle';
    title.textContent = `Вариант ${idx + 1}`;

    const meta = document.createElement('div');
    meta.className = 'routeMeta';
    const length = route.getHumanLength?.() || '';
    const time = route.getHumanTime?.() || '';
    meta.textContent = [length, time].filter(Boolean).join(' • ');

    btn.appendChild(title);
    btn.appendChild(meta);

    btn.addEventListener('click', () => {
      if (!multiRoute) return;
      try {
        multiRoute.setActiveRoute(route);
      } catch (e) {
        console.warn('Не удалось активировать маршрут', e);
      }
      renderRouteList();
    });

    routeItemsEl.appendChild(btn);
  });

  routeListEl.classList.add('show');
}

function syncViaPointsFromRoute() {
  if (!multiRoute?.model) return;
  const refs = multiRoute.model.getReferencePoints?.();
  if (!Array.isArray(refs) || refs.length < 2) return;
  const pts = refs
    .map(toCoords)
    .filter(Boolean);
  if (pts.length >= 2) {
    viaPoints = pts.slice(1, -1);
  }
}

function toCoords(point) {
  if (!point) return null;
  if (Array.isArray(point)) return point;
  if (point.coordinates && Array.isArray(point.coordinates)) return point.coordinates;
  if (point.geometry?.coordinates && Array.isArray(point.geometry.coordinates)) return point.geometry.coordinates;
  return null;
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
