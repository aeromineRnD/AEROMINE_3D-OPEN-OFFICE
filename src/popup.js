export class Popup {
  constructor() {
    this._panel = this._build();
    document.body.appendChild(this._panel);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this._open && !this._panel.contains(e.target)) {
        this.hide();
      }
    });
  }

  _build() {
    const panel = document.createElement('div');
    panel.className = 'info-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title-group">
          <span class="panel-icon"></span>
          <span class="panel-name"></span>
          <span class="panel-category"></span>
        </div>
        <button class="panel-close" aria-label="Close">✕</button>
      </div>
      <div class="panel-body">
        <img class="panel-photo" alt="" />
        <p class="panel-description"></p>
        <hr class="panel-divider" />
        <div class="panel-detail-row location-row">
          <span class="detail-label">Location</span>
          <span class="location-val"></span>
        </div>
        <div class="panel-detail-row contact-row">
          <span class="detail-label">Contact</span>
          <span class="contact-val"></span>
        </div>
      </div>
    `;

    panel.querySelector('.panel-close').addEventListener('click', () => this.hide());

    return panel;
  }

  show(obj) {
    document.body.classList.add('panel-open');
    const p = this._panel;

    p.querySelector('.panel-icon').textContent     = obj.icon;
    p.querySelector('.panel-name').textContent     = obj.name;
    p.querySelector('.panel-category').textContent = obj.category;
    p.querySelector('.panel-description').textContent = obj.description;

    const photo = p.querySelector('.panel-photo');
    if (obj.photo) {
      photo.src = obj.photo;
      photo.style.display = 'block';
    } else {
      photo.style.display = 'none';
    }

    const locationRow = p.querySelector('.location-row');
    if (obj.location) {
      p.querySelector('.location-val').textContent = obj.location;
      locationRow.style.display = 'flex';
    } else {
      locationRow.style.display = 'none';
    }

    const contactRow = p.querySelector('.contact-row');
    if (obj.contact) {
      p.querySelector('.contact-val').textContent = obj.contact;
      contactRow.style.display = 'flex';
    } else {
      contactRow.style.display = 'none';
    }

    p.classList.add('open');
    this._open = true;
  }

  hide() {
    this._panel.classList.remove('open');
    document.body.classList.remove('panel-open');
    this._open = false;
  }
}
