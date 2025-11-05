// app.js — фикс: init() без .catch(), если не Promise
import { init } from './yandex.js';

try {
  init();
} catch (err) {
  console.error('[Trans-Time] Ошибка init:', err);
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerHTML = 'Ошибка загрузки карты: ' + (err.message || err);
    toast.style.display = 'block';
  }
}