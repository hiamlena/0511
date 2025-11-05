// router.js — Yandex MultiRoute
import { log } from './core.js';

export class YandexRouter {
  static async geocode(q) {
    if (!q?.trim()) throw new Error('Пустой адрес');
    return new Promise((resolve, reject) => {
      ymaps.geocode(q, { results: 1 }).then(res => {
        const obj = res.geoObjects.get(0);
        if (!obj) reject('Адрес не найден');
        else resolve(obj.geometry.getCoordinates());
      }).catch(reject);
    });
  }

  static async build(points, opts = {}) {
    if (!Array.isArray(points) || points.length < 2) {
      throw new Error('Минимум 2 точки');
    }

    const params = {
      results: opts.alternatives ?? 3,
      routingMode: opts.mode ?? 'truck',
      avoidTrafficJams: true
    };

    if (opts.weight || opts.axleCount || opts.dimensions) {
      params.truck = {};
      if (opts.weight) params.truck.weight = Number(opts.weight);
      if (opts.axleCount) params.truck.axleCount = Number(opts.axleCount);
      if (opts.dimensions) {
        const { height, width, length } = opts.dimensions;
        if (height) params.truck.height = Number(height);
        if (width)  params.truck.width  = Number(width);
        if (length) params.truck.length = Number(length);
      }
    }

    return new Promise((resolve, reject) => {
      const mr = new ymaps.multiRouter.MultiRoute(
        { referencePoints: points, params },
        {
          wayPointStartIconFillColor: '#22c55e',
          wayPointFinishIconFillColor: '#ef4444',
          viaPointIconFillColor: '#60a5fa',
          boundsAutoApply: true
        }
      );
      mr.model.events.once('requestsuccess', () => {
        const routes = mr.getRoutes();
        if (!routes || routes.getLength() === 0) reject('Маршрут не найден');
        else resolve({ multiRoute: mr, routes });
      });
      mr.model.events.once('requestfail', (e) => reject(e || 'Ошибка маршрутизации'));
    });
  }
}