
(function(){
  const root = document.documentElement;
  function $(id){ return document.getElementById(id); }

  function setMode(m){
    const btn = $('mode');
    if(m === 'auto'){ root.removeAttribute('data-theme'); if(btn) btn.textContent = 'Modo: auto'; }
    else{ root.dataset.theme = m; if(btn) btn.textContent = 'Modo: ' + (m==='light'?'claro':'oscuro'); }
  }
  function initTheme(){
    const btn = $('mode');
    const saved = localStorage.getItem('theme-mode') || 'auto';
    setMode(saved);
    if(btn){
      btn.addEventListener('click', () => {
        const next = (root.dataset.theme === 'light' ? 'dark' : (root.dataset.theme === 'dark' ? 'auto' : 'light'));
        setMode(next); localStorage.setItem('theme-mode', next);
      });
    }
  }

  async function loadData(){
    const local = new URL('data.json', document.baseURI).href;
    const pages = 'https://pfranciscojmugica-ui.github.io/Directorios/data.json';
    const raw   = 'https://raw.githubusercontent.com/pfranciscojmugica-ui/Directorios/main/data.json';
  
    const cand = [local, pages, raw];
    for (const url of cand){
      try {
        const res = await fetch(url, { cache:'no-store', headers:{ 'Accept':'application/json' } });
        if (res.ok) return await res.json();
        console.warn('[data.json] intento fallido:', url, res.status);
      } catch (e) {
        console.warn('[data.json] error al intentar:', url, e);
      }
    }
    throw new Error('No se pudo cargar data.json desde ninguna ruta.');
  }
  
  function catClass(c){
    if (!c) return 'lineas';
    if (c.indexOf('24/7')>-1) return 'lineas';
    if (c.indexOf('Justicia')>-1) return 'justicia';
    if (c.indexOf('Hospital')>-1) return 'hosp';
    if (c.indexOf('(CJM)')>-1) return 'cjm';
    if (c.indexOf('UNEME/CISAME')>-1 || c.indexOf('CAPA')>-1) return 'uneme';
    return 'lineas';
  }

  function match(d, s){
    if(!s) return true;
    s = s.toLowerCase();
    return [d.institucion,d.estado,d.localidad,d.telefono,d.correo,d.direccion,d.categoria,d.nota]
      .filter(Boolean).some(x => String(x).toLowerCase().includes(s));
  }

  function sorters(key){
    if(key==='institucion') return (a,b)=>a.institucion.localeCompare(b.institucion,'es');
    return (a,b)=>{
      const pri = v=> (v && String(v).startsWith('Ciudad de México')? 'AAA': (v||'ZZZ'));
      return ( pri(a.estado).localeCompare(pri(b.estado),'es') ||
               (a.localidad||'').localeCompare(b.localidad||'', 'es') ||
               a.categoria.localeCompare(b.categoria,'es') ||
               a.institucion.localeCompare(b.institucion,'es') );
    };
  }

  function populateEstados(data){
    const estados = [...new Set(data.map(d => d.estado).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,'es'));
    const fEstado = $('fEstado');
    if(!fEstado) return;
    estados.forEach(e=>{ const o=document.createElement('option'); o.textContent=e; o.value=e; fEstado.appendChild(o); });
  }

  function populateCategorias(data){
    const cats = [...new Set(data.map(d => d.categoria).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,'es'));
    const fCategoria = $('fCategoria');
    if(!fCategoria) return;
    while (fCategoria.options.length > 1) fCategoria.remove(1);
    cats.forEach(c=>{ const o=document.createElement('option'); o.textContent=c; o.value=c; fCategoria.appendChild(o); });
  }

  function render(data){
    const q = $('q'), fEstado=$('fEstado'), fCategoria=$('fCategoria'), orden=$('orden');
    const sorter = sorters(orden && orden.value || 'estado');
    const search = q && q.value ? q.value.trim() : '';
    const fe = fEstado && fEstado.value || '';
    const fc = fCategoria && fCategoria.value || '';

    const filtered = data.filter(d =>
      match(d,search) && (!fe || d.estado===fe) && (!fc || d.categoria===fc)
    ).sort(sorter);

    const cdmx = filtered.filter(d => (d.estado||'').startsWith('Ciudad de México'));
    const otros = filtered.filter(d => !(d.estado||'').startsWith('Ciudad de México'));

    function renderGrid(arr, elId){
      const el = $(elId);
      if(!el) return;
      el.innerHTML = "";
      let lastCat = null;
      arr.forEach(d=>{
        if(d.categoria !== lastCat){
          const cat = document.createElement('div');
          cat.className = 'cat mini';
          cat.textContent = d.categoria || '';
          el.appendChild(cat);
          lastCat = d.categoria;
        }
        const cc = catClass(d.categoria);
        const card = document.createElement('div');
        card.className = 'card';

        const emails = (d.correo||'').split(',').map(x=>x.trim()).filter(Boolean);
        const emailsHtml = emails.length ? emails.map(x=>`<a href="mailto:${x}">${x}</a>`).join(', ') : '';

        card.innerHTML = ''
          + `<h3>${d.institucion||''} <span class="tag ${cc}">${d.categoria||''}</span></h3>`
          + '<div class="meta">'
          + (d.telefono? `<div class="kv"><b>Teléfono(s):</b> <span>${d.telefono}</span></div>` : '')
          + (emailsHtml? `<div class="kv"><b>Correo(s):</b> <span>${emailsHtml}</span></div>` : '')
          + (d.web? `<div class="kv"><b>Sitio web:</b> <span><a href="${d.web}" target="_blank" rel="noopener">${d.web}</a></span></div>` : '')
          + (d.direccion? `<div class="kv"><b>Dirección:</b> <span>${d.direccion}</span></div>` : '')
          + (d.localidad? `<div class="kv"><b>Localidad:</b> <span>${d.localidad}</span></div>` : '')
          + `<div class="kv"><b>Estado:</b> <span>${d.estado||''}</span></div>`
          + (d.nota? `<div class="kv"><b>Nota:</b> <span>${d.nota}</span></div>` : '')
          + '</div>';
        el.appendChild(card);
      });
    }

    renderGrid(cdmx, 'gridCDMX');
    renderGrid(otros, 'gridEstados');
  }

  async function main(){
    initTheme();
    const data = await loadData();
    populateEstados(data);
    populateCategorias(data);

    const rerender = ()=>render(data);
    ['q','fEstado','fCategoria','orden'].forEach(id=>{
      const el = $(id); if(!el) return;
      el.addEventListener('input', rerender);
      el.addEventListener('change', rerender);
    });
    const limpiar = $('limpiar');
    if (limpiar){
      limpiar.addEventListener('click', ()=>{
        if ($('q')) $('q').value='';
        if ($('fEstado')) $('fEstado').value='';
        if ($('fCategoria')) $('fCategoria').value='';
        if ($('orden')) $('orden').value='estado';
        render(data);
      });
    }
    render(data);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
