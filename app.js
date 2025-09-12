
const root = document.documentElement;
const modeBtn = document.getElementById('mode');

function setMode(m){
  if(m === 'auto'){ root.removeAttribute('data-theme'); modeBtn.textContent = 'Modo: auto'; }
  else{ root.dataset.theme = m; modeBtn.textContent = 'Modo: ' + (m==='light'?'claro':'oscuro'); }
}
function initTheme(){
  const saved = localStorage.getItem('theme-mode') || 'auto';
  setMode(saved);
  modeBtn.addEventListener('click', () => {
    const next = (root.dataset.theme === 'light' ? 'dark' : (root.dataset.theme === 'dark' ? 'auto' : 'light'));
    setMode(next); localStorage.setItem('theme-mode', next);
  });
}

function catClass(c){
  if (c.includes('24/7')) return 'lineas';
  if (c.includes('Justicia')) return 'justicia';
  if (c.includes('Hospital')) return 'hosp';
  if (c.includes('(CJM)')) return 'cjm';
  if (c.includes('UNEME/CISAME') || c.includes('CAPA')) return 'uneme';
  return 'lineas';
}

function match(d, s){
  if(!s) return true;
  s = s.toLowerCase();
  return [d.institucion,d.estado,d.localidad,d.telefono,d.correo,d.direccion,d.categoria,d.nota]
    .filter(Boolean).some(x=>x.toLowerCase().includes(s));
}

function sorters(key){
  if(key==='institucion') return (a,b)=>a.institucion.localeCompare(b.institucion,'es');
  return (a,b)=>{
    const pri = v=> (v && v.startsWith('Ciudad de México')? 'AAA': (v||'ZZZ'));
    return (pri(a.estado).localeCompare(pri(b.estado),'es') ||
            (a.localidad||'').localeCompare(b.localidad||'', 'es') ||
            a.categoria.localeCompare(b.categoria,'es') ||
            a.institucion.localeCompare(b.institucion,'es'));
  };
}

function populateEstados(data){
  const estados = [...new Set(data.map(d => d.estado).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const fEstado = document.getElementById('fEstado');
  estados.forEach(e=>{ const o=document.createElement('option'); o.textContent=e; fEstado.appendChild(o); });
}

function render(data){
  const q = document.getElementById('q');
  const fEstado = document.getElementById('fEstado');
  const fCategoria = document.getElementById('fCategoria');
  const orden = document.getElementById('orden');
  const sorter = sorters(orden.value);
  const filtered = data.filter(d =>
    match(d,q.value.trim()) &&
    (!fEstado.value || d.estado===fEstado.value) &&
    (!fCategoria.value || d.categoria===fCategoria.value)
  ).sort(sorter);

  const cdmx = filtered.filter(d=>d.estado.startsWith('Ciudad de México'));
  const otros = filtered.filter(d=>!d.estado.startsWith('Ciudad de México'));

  const renderGrid = (arr, el) => {
    el.innerHTML = "";
    let lastCat = null;
    arr.forEach(d=>{
      if(d.categoria !== lastCat){
        const cat = document.createElement('div');
        cat.className = 'cat mini';
        cat.textContent = d.categoria;
        el.appendChild(cat);
        lastCat = d.categoria;
      }
      const cc = catClass(d.categoria);
      const c = document.createElement('div');
      c.className = `card`;
      const emails = d.correo? d.correo.split(',').map(x=>x.trim()).filter(Boolean):[];
      c.innerHTML = `
        <h3>${d.institucion} <span class="tag ${cc}">${d.categoria}</span></h3>
        <div class="meta">
          ${d.telefono?`<div class="kv"><b>Teléfono(s):</b> <span>${d.telefono}</span></div>`:''}
          ${emails.length?`<div class="kv"><b>Correo(s):</b> <span>${emails.map(x=>`<a href="mailto:${x}">${x}</a>`).join(', ')}</span></div>`:''}
          ${d.web?`<div class="kv"><b>Sitio web:</b> <span><a href="${d.web}" target="_blank" rel="noopener">${d.web}</a></span></div>`:''}
          ${d.direccion?`<div class="kv"><b>Dirección:</b> <span>${d.direccion}</span></div>`:''}
          ${d.localidad?`<div class="kv"><b>Localidad:</b> <span>${d.localidad}</span></div>`:''}
          <div class="kv"><b>Estado:</b> <span>${d.estado}</span></div>
          ${d.nota?`<div class="kv"><b>Nota:</b> <span>${d.nota}</span></div>`:''}
        </div>
      `;
      el.appendChild(c);
    });
  };

  renderGrid(cdmx, document.getElementById('gridCDMX'));
  renderGrid(otros, document.getElementById('gridEstados'));
}

async function main(){
  initTheme();
  const res = await fetch('data.json', {cache:'no-store'});
  const data = await res.json();
  populateEstados(data);

  const rerender = ()=>render(data);
  document.getElementById('limpiar').onclick = ()=>{
    document.getElementById('q').value='';
    document.getElementById('fEstado').value='';
    document.getElementById('fCategoria').value='';
    document.getElementById('orden').value='estado';
    render(data);
  };
  ['q','fEstado','fCategoria','orden'].forEach(id=>{
    document.getElementById(id).addEventListener('input', rerender);
    document.getElementById(id).addEventListener('change', rerender);
  });
  render(data);
}

document.addEventListener('DOMContentLoaded', main);
