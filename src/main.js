import { Viewer }     from './viewer.js';
import { TagManager } from './tag-manager.js';
import { Popup }      from './popup.js';

async function init() {
  const appEl     = document.getElementById('app');
  const spinnerEl = document.getElementById('spinner');

  const viewer     = new Viewer(appEl);
  const popup      = new Popup();
  const tagManager = new TagManager(viewer, popup);

  spinnerEl.style.display = '';

  try {
    await viewer.load();
    tagManager.buildTags();
  } catch (err) {
    console.error('[Aeromine] Failed to load model:', err);
    spinnerEl.style.display = 'none';
    appEl.innerHTML = `
      <div class="load-error">
        <div>
          <strong>Could not load 3D scene.</strong><br>
          Make sure <code>public/models/openOffice.gltf</code> and <code>openOffice.bin</code> exist.<br>
          <small>${err.message}</small>
        </div>
      </div>
    `;
    return;
  }

  spinnerEl.style.display = 'none';

  document.getElementById('btn-reset').addEventListener('click', () => viewer.resetCamera());
  document.getElementById('search').addEventListener('input', e => tagManager.filter(e.target.value));

  document.querySelectorAll('.legend-item').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      tagManager.toggleCategory(btn.dataset.category);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
