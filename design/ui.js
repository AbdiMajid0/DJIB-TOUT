/* ══════════════════════════════════════════════════════════════
   DJIB TOUT — maquette : chrome partagé + panneau de revue
   Ce fichier n'existe que pour la maquette. À l'intégration
   Next.js, l'en-tête et le pied de page deviennent des composants
   et le panneau disparaît.
   ══════════════════════════════════════════════════════════════ */
(function () {
  const PAGES = [
    { file: 'home.html',     label: 'Accueil' },
    { file: 'product.html',  label: 'Fiche produit' },
    { file: 'category.html', label: 'Liste catégorie' },
    { file: 'cart.html',     label: 'Panier' },
  ];
  const PALETTES = [
    { id: 'corail', name: 'Corail ✓', colors: ['#f2563a', '#fb7a5b', '#f0b429'] },
    { id: 'lagon',  name: 'Lagon',    colors: ['#17b0b1', '#31cdcb', '#ff9f1c'] },
    { id: 'indigo', name: 'Indigo',   colors: ['#6366f1', '#818cf8', '#f59e0b'] },
    { id: 'sable',  name: 'Sable',    colors: ['#12b76a', '#32d583', '#e9a93b'] },
  ];
  const here = (location.pathname.split('/').pop() || 'home.html');
  const ico = (d) =>
    `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    heart:  '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/>',
    cart:   '<path d="M6 7h13l-1.4 9.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 7Z"/><path d="M6 7 5 3H3"/><circle cx="10" cy="21" r="1"/><circle cx="16" cy="21" r="1"/>',
    home:   '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  };

  /* ─────────── En-tête ─────────── */
  document.body.insertAdjacentHTML('afterbegin', `
<div class="topbar" data-block="topbar" data-label="Bandeau haut">
  <div class="wrap">
    <p><span class="dot"></span>Livraison offerte à Djibouti-ville dès 5 000 FDJ</p>
    <nav>
      <a href="#">Suivre ma commande</a>
      <a href="#">Devenir vendeur</a>
      <a href="#">Aide</a>
      <div class="lang"><button aria-current="true">FR</button><button>AR</button><button>EN</button></div>
    </nav>
  </div>
</div>

<header class="header">
  <div class="wrap">
    <a href="home.html" class="logo"><span class="mark"><span>DT</span></span>DJIB<em>TOUT</em></a>
    <form class="search" role="search" onsubmit="return false">
      <svg class="ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.2" stroke-linecap="round">${I.search}</svg>
      <label class="sr" for="q">Rechercher un produit</label>
      <input id="q" type="search" placeholder="Rechercher un produit, une marque, une boutique…">
      <button class="go" type="submit">Rechercher</button>
    </form>
    <nav class="actions">
      <a href="#" class="act">${ico(I.user)}<span>Mon compte</span></a>
      <a href="#" class="act">${ico(I.heart)}<span>Favoris</span><em class="badge">3</em></a>
      <a href="cart.html" class="act">${ico(I.cart)}<span>Panier</span><em class="badge">3</em></a>
    </nav>
  </div>
</header>

<nav class="catnav" data-block="catnav" data-label="Nav catégories">
  <div class="wrap">
    <a href="#" class="hot">🔥 Ventes flash</a>
    <a href="category.html">Électronique</a>
    <a href="category.html">Mode</a>
    <a href="category.html">Maison &amp; Cuisine</a>
    <a href="category.html">Beauté</a>
    <a href="category.html">Téléphones</a>
    <a href="category.html">Alimentation</a>
    <a href="category.html">Sport</a>
    <a href="category.html">Enfants</a>
    <a href="category.html">Boutiques locales</a>
  </div>
</nav>`);

  /* ─────────── Pied de page ─────────── */
  document.body.insertAdjacentHTML('beforeend', `
<footer>
  <div class="wrap">
    <div class="fgrid">
      <div>
        <a href="home.html" class="logo"><span class="mark"><span>DT</span></span>DJIB<em>TOUT</em></a>
        <p class="about">La marketplace de Djibouti : achetez local, payez en FDJ, faites-vous livrer partout dans le pays.</p>
        <div class="pay"><span>Waafi</span><span>D-Money</span><span>Espèces</span><span>Carte</span></div>
      </div>
      <div><h4>Acheter</h4><ul>
        <li><a href="category.html">Toutes les catégories</a></li>
        <li><a href="#">Ventes flash</a></li>
        <li><a href="#">Meilleures ventes</a></li>
        <li><a href="#">Boutiques locales</a></li></ul></div>
      <div><h4>Mon compte</h4><ul>
        <li><a href="#">Se connecter</a></li>
        <li><a href="#">Mes commandes</a></li>
        <li><a href="#">Mes favoris</a></li>
        <li><a href="#">Retours et remboursements</a></li></ul></div>
      <div><h4>Aide</h4><ul>
        <li><a href="#">Centre d'aide</a></li>
        <li><a href="#">Livraison</a></li>
        <li><a href="#">Devenir vendeur</a></li>
        <li><a href="#">Nous contacter</a></li></ul></div>
    </div>
    <div class="fbottom">
      <span>© 2026 DJIB TOUT — Tous droits réservés.</span>
      <span>Conditions générales · Confidentialité · Cookies</span>
    </div>
  </div>
</footer>

<nav class="mobilebar">
  <a href="home.html"${here === 'home.html' ? ' class="on"' : ''}>${ico(I.home)}Accueil</a>
  <a href="category.html"${here === 'category.html' ? ' class="on"' : ''}>${ico(I.search)}Rechercher</a>
  <a href="cart.html"${here === 'cart.html' ? ' class="on"' : ''}>${ico(I.cart)}Panier</a>
  <a href="#">${ico(I.user)}Compte</a>
</nav>`);

  /* ─────────── Panneau de revue ─────────── */
  const blocks = [...document.querySelectorAll('[data-block]')];
  const hidden = new Set(JSON.parse(localStorage.getItem('dt.hidden') || '[]'));
  const palette = localStorage.getItem('dt.palette') || 'corail';
  document.documentElement.dataset.palette = palette;

  const apply = () =>
    blocks.forEach((b) => { b.style.display = hidden.has(b.dataset.block) ? 'none' : ''; });
  apply();

  const panel = document.createElement('div');
  panel.id = 'dsk';
  panel.innerHTML = `
<div class="panel">
  <h5>Palette de couleurs</h5>
  <div class="pals">${PALETTES.map((p) => `
    <button class="pal" data-pal="${p.id}" aria-current="${p.id === palette}">
      <i>${p.colors.map((c) => `<b style="background:${c}"></b>`).join('')}</i>
      <span>${p.name}</span>
    </button>`).join('')}
  </div>
  ${blocks.length ? `<h5>Blocs de la page</h5><div class="blocks">${blocks.map((b) => `
    <label><input type="checkbox" data-blk="${b.dataset.block}"
      ${hidden.has(b.dataset.block) ? '' : 'checked'}> ${b.dataset.label}</label>`).join('')}
  </div>` : ''}
  <h5>Pages de la maquette</h5>
  <div class="pages">${PAGES.map((p) => `
    <a href="${p.file}"${p.file === here ? ' class="on"' : ''}>${p.label}</a>`).join('')}
  </div>
</div>
<button class="fab" title="Panneau de maquette" aria-label="Ouvrir le panneau de maquette">🎨</button>`;
  document.body.appendChild(panel);

  panel.querySelector('.fab').onclick = () => panel.classList.toggle('open');
  panel.querySelectorAll('.pal').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.pal;
      document.documentElement.dataset.palette = id;
      localStorage.setItem('dt.palette', id);
      panel.querySelectorAll('.pal').forEach((b) => b.setAttribute('aria-current', b === btn));
    };
  });
  panel.querySelectorAll('[data-blk]').forEach((cb) => {
    cb.onchange = () => {
      cb.checked ? hidden.delete(cb.dataset.blk) : hidden.add(cb.dataset.blk);
      localStorage.setItem('dt.hidden', JSON.stringify([...hidden]));
      apply();
    };
  });

  /* ─────────── Interactions de démonstration ─────────── */
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-group] button');
    if (g && !g.disabled) {
      g.closest('[data-group]').querySelectorAll('button')
        .forEach((b) => b.setAttribute('aria-current', b === g));
    }
    const tab = e.target.closest('.tabs button');
    if (tab) {
      tab.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', b === tab));
      document.querySelectorAll('.tabpanel')
        .forEach((p) => p.dataset.open = String(p.dataset.tab === tab.dataset.tab));
    }
    const step = e.target.closest('.qty button');
    if (step) {
      const out = step.parentElement.querySelector('span');
      const next = Math.max(1, (+out.textContent || 1) + (+step.dataset.step));
      out.textContent = next;
    }
  });
})();
