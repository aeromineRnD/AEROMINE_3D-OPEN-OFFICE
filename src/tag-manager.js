import { Box3, Vector3 }  from 'three';
import { CSS2DObject }    from 'three/addons/renderers/CSS2DRenderer.js';
import { OBJECTS }        from './site-data.js';

// How far above an object's highest point the tag floats (world units)
const TAG_Y_OFFSET = 0.3;

export class TagManager {
  constructor(viewer, popup) {
    this.viewer            = viewer;
    this.popup             = popup;
    this._tags             = [];
    this._query            = '';
    this._hiddenCategories = new Set();
  }

  /**
   * Call once after viewer.load() resolves.
   * Traverses the scene, matches nodes by name, and places a CSS2DObject tag
   * above each object.
   */
  buildTags() {
    const root = this.viewer.content;
    if (!root) {
      console.warn('[TagManager] No content loaded.');
      return;
    }

    const objectMap = new Map(OBJECTS.map(o => [o.meshName, o]));

    root.traverse((node) => {
      const obj = objectMap.get(node.name);
      if (!obj) return;

      node.updateWorldMatrix(true, true);

      const anchor = this._computeAnchor(node);
      const tagObj = this._createTag(obj, node, anchor);

      // Add to scene root so positions are in world space
      this.viewer.scene.add(tagObj);
      this._tags.push({ obj, object3d: tagObj });

      console.log(`[TagManager] Tag placed for "${node.name}" at`, anchor);
    });

    if (this._tags.length === 0) {
      console.warn('[TagManager] No nodes matched. Check meshName values in site-data.js match GLTF node names exactly.');
    }
  }

  _computeAnchor(node) {
    const box = new Box3().setFromObject(node);
    return new Vector3(
      (box.min.x + box.max.x) / 2,
      box.max.y + TAG_Y_OFFSET,
      (box.min.z + box.max.z) / 2
    );
  }

  _createTag(obj, node, anchorPosition) {
    const categoryClass = {
      'Fire Safety':     'pin--fire',
      'First Aid':       'pin--aid',
      'Emergency Alert': 'pin--emergency',
      'Emergency Egress':'pin--emergency',
      'Meeting Room':    'pin--meeting',
    }[obj.category] || '';

    const el = document.createElement('div');
    el.className = `building-tag ${categoryClass}`;
    el.dataset.tooltip = obj.name;
    el.innerHTML = `
      <span class="tag-icon">${obj.icon}</span>
      <span class="tag-name">${obj.name}</span>
    `;
    el.style.pointerEvents = 'auto';

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewer.focusOn(node, obj.camDir);
      this.popup.show(obj);
    });

    const tagObj = new CSS2DObject(el);
    tagObj.position.copy(anchorPosition);
    tagObj.center.set(0.5, 1.0);

    return tagObj;
  }

  filter(query) {
    this._query = query.trim().toLowerCase();
    this._applyFilter();
  }

  toggleCategory(category) {
    if (this._hiddenCategories.has(category)) {
      this._hiddenCategories.delete(category);
    } else {
      this._hiddenCategories.add(category);
    }
    this._applyFilter();
  }

  _applyFilter() {
    this._tags.forEach(({ obj, object3d }) => {
      const el = object3d.element;

      // Resolve the broad group label used in the legend
      const group = obj.category === 'Emergency Alert' || obj.category === 'Emergency Egress'
        ? 'Emergency' : obj.category;

      const categoryVisible = !this._hiddenCategories.has(group);
      const searchMatch = !this._query ||
        obj.name.toLowerCase().includes(this._query) ||
        obj.category.toLowerCase().includes(this._query);

      const visible = categoryVisible && searchMatch;
      el.style.opacity       = visible ? '1' : '0.15';
      el.style.pointerEvents = visible ? 'auto' : 'none';
    });
  }

  dispose() {
    this._tags.forEach(({ object3d }) => {
      if (object3d.parent) object3d.parent.remove(object3d);
    });
    this._tags = [];
  }
}
