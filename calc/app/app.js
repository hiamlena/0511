// ===== Helpers =====
function $(id){ return document.getElementById(id); }
function getTractorSelects(){
  const primary=$("tractorSelect");
  const fallback=$("truck");
  const set=[];
  if(primary) set.push(primary);
  if(fallback && fallback!==primary) set.push(fallback);
  return set;
}
function getTrailerSelects(){
  const primary=$("trailerSelect");
  const fallback=$("trailer");
  const set=[];
  if(primary) set.push(primary);
  if(fallback && fallback!==primary) set.push(fallback);
  return set;
}
function fillSelectOptions(selectEl, items, selectedValue){
  if(!selectEl) return;
  const prev=selectEl.value;
  selectEl.innerHTML='';
  if(!items.length){
    const opt=document.createElement('option');
    opt.value='';
    opt.textContent='—';
    selectEl.appendChild(opt);
    selectEl.value='';
    selectEl.disabled=true;
    return;
  }
  selectEl.disabled=false;
  items.forEach(item=>{
    const opt=document.createElement('option');
    opt.value=item.value;
    opt.textContent=item.label;
    selectEl.appendChild(opt);
  });
  let target=selectedValue;
  const hasTarget=items.some(item=>item.value===target);
  if(!hasTarget){
    if(items.some(item=>item.value===prev)) target=prev;
    else target=items[0]?.value||'';
  }
  if(typeof target==='string') selectEl.value=target;
}
function num(v,def=0){ const n=parseFloat(v); return isFinite(n)?n:def; }
function fmtL(n){ return isFinite(n)? Math.round(n).toLocaleString('ru-RU')+' л':'—'; }
function fmtKg(n){ return isFinite(n)? Math.round(n).toLocaleString('ru-RU')+' кг':'—'; }
function fmtT(n){
  if(!isFinite(n)) return '—';
  const val=Number(n.toFixed(3));
  return val.toLocaleString('ru-RU', { minimumFractionDigits:3, maximumFractionDigits:3 })+' т';
}
function fmtM3(n){
  if(!isFinite(n)) return '—';
  const val=Number(n.toFixed(3));
  return val.toLocaleString('ru-RU', { minimumFractionDigits:3, maximumFractionDigits:3 })+' м³';
}
function fmtT2(n){
  if(!isFinite(n)) return '—';
  const val=Number(n.toFixed(2));
  return val.toLocaleString('ru-RU', { minimumFractionDigits:2, maximumFractionDigits:2 })+' т';
}
function fmtM3_3(n){
  if(!isFinite(n)) return '—';
  const val=Number(n.toFixed(3));
  return val.toLocaleString('ru-RU', { minimumFractionDigits:3, maximumFractionDigits:3 })+' м³';
}
function roundTo(n,dec=3){
  if(!isFinite(n)) return NaN;
  const factor=Math.pow(10,dec);
  return Math.round(n*factor)/factor;
}
function setInputValue(input,value,dec=3){
  if(!input) return;
  if(!isFinite(value)) input.value='';
  else input.value=String(dec>=0?roundTo(value,dec):value);
}

function getGlobalTypeSelect(){ return $('cargoType') || $('cargoTypeCommon'); }
function getGlobalRhoInput(){ return $('cargoRho') || $('rhoCommon'); }
function getProductModalElement(){ return $('modalProduct') || $('productModal'); }
function getProductForm(){ return $('mp_form'); }
function getProductNameInput(){ return $('mp_name') || $('prod_name'); }
function getProductRhoInput(){ return $('mp_rho') || $('prod_rho'); }
function getProductCancelButton(){ return $('mp_cancel') || $('prod_cancel'); }
function getProductSaveButton(){ return $('prod_save'); }

let toastTimer=null;
function showToast(message, type='ok'){
  const el=$('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.remove('warn','error');
  if(type==='warn') el.classList.add('warn');
  else if(type==='error') el.classList.add('error');
  el.classList.add('show');
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ el.classList.remove('show'); }, 2500);
}

let productModalKeyHandler=null;

function setupCargoLayout(){
  const addBtn=$('btnAddProduct');
  if(addBtn){
    addBtn.textContent='+';
    addBtn.setAttribute('aria-label','Добавить груз');
    addBtn.setAttribute('title','Добавить груз');
  }
}

function updateTankSectionVisibility(){
  const section=$('tankSection');
  const isTanker=app.trailerState?.type==='tanker';
  if(!section) return;
  section.style.display=isTanker?'block':'none';
  const table=section.querySelector('table');
  if(table) table.style.display=app.singleCargo?'none':'table';
}

// ===== Data =====
const defaultProducts=[
  { key: "diesel", label: "Дизельное топливо (ДТ)", rho: 0.84 },
  { key: "gas92", label: "Бензин АИ-92", rho: 0.74 },
  { key: "gas95", label: "Бензин АИ-95", rho: 0.75 },
  { key: "molasses", label: "Патока", rho: 1.40 },
  { key: "syrup", label: "Сироп сахарный", rho: 1.30 },
  { key: "wine", label: "Вино", rho: 0.99 },
  { key: "ethanol96", label: "Спирт этиловый (96%)", rho: 0.789 },
  { key: "methanol", label: "Метанол", rho: 0.792 },
  { key: "vinyl_acetate", label: "Винилацетат мономер (VAM)", rho: 0.934 },
  { key: "butyl_acetate", label: "Бутилацетат", rho: 0.882 },
  { key: "methyl_acetate", label: "Метилацетат", rho: 0.932 },
  { key: "ethyl_acetate", label: "Этил ацетат", rho: 0.902 },
  { key: "n_butanol", label: "н-Бутанол", rho: 0.810 },
  { key: "acetic_acid_glacial", label: "Уксусная кислота (ледяная)", rho: 1.049 },
  { key: "sulfuric_acid_96", label: "Серная кислота (96–98%)", rho: 1.830 },
  { key: "heavy_oil", label: "Тяжёлые масла", rho: 0.93 },
  { key: "formalin37", label: "Формалин 37%", rho: 1.09 }
];
const defaultTrucks=[
  "В 010 СЕ 123","М 020 АМ 123","Е 030 ВК 123","Е 040 ВК 123","Т 050 ВТ 93","Н 060 ВТ 123","С 070 УА 93",
  "Р 100 СА 93","Н 200 НУ 23","У 300 ХА 93","Х 400 СХ 93",
  "О 600 РВ 93",
  "В 800 ТУ 93","В 900 ТУ 93","С 101 ОХ 123","Е 202 УО 93","А 303 ЕР 123","Т 404 РС 123","Р 505 МВ 123","У 606 МВ 123","О 707 СУ 123","У 808 РУ 123","У 909 СН 123","Е 111 КС 123","Р 212 СН 23","Т 313 РУ 93","Н 414 РВ 93","Х 515 ТМ 93","У 616 СН 123","Х 717 РН 93","Р 919 ВК 93","У 616 СН 123",
  "С 999 РХ 123","А 444 АУ 23","О 555 КК 123",
  "Т 777 АК 123","Н 888 РС 123"
];
const defaultTrailers=[
  { id: "ER8977_23", name: "ЕР 8977 23", type: "platform", axles: 3, tareKg: 5900, positions: 4 },
  { id: "EU2938_23", name: "ЕУ 2938 23", type: "tanker", axles: 3, tareKg: 7300, compartmentsLiters: [12000, 6500, 12500] },
  { id: "MM8442_23", name: "ММ 8442 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [29340] },
  { id: "MM8041_23", name: "ММ 8041 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [29310] },
  { id: "MO7958_23", name: "МО 7958 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [13000, 7000, 13000] },
  { id: "MA2567_23", name: "МА 2567 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 8000, 10000] },
  { id: "MN9545_23", name: "МН 9545 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 8000, 10000] },
  { id: "MK6187_23", name: "МК 6187 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [11000, 6000, 13000] },
  { id: "MO0310_23", name: "МО 0310 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [7500, 11000, 7500, 6000] },
  { id: "MO1891_23", name: "МО 1891 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 8000, 13000] },
  { id: "MM8413_23", name: "ММ 8413 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [29340] },
  { id: "EU9285_23", name: "ЕУ 9285 23", type: "tanker", axles: 3, tareKg: 7300, compartmentsLiters: [3000, 13850, 11750] },
  { id: "EU2937_23", name: "ЕУ 2937 23", type: "tanker", axles: 3, tareKg: 7300, compartmentsLiters: [3000, 13850, 11750] },
  { id: "MR3376_23", name: "МР 3376 23", type: "tanker", axles: 3, tareKg: 7300, compartmentsLiters: [3000, 13850, 11750] },
  { id: "MA8877_23", name: "МА 8877 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 5000, 12000] },
  { id: "MN6880_23", name: "МН 6880 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [29130] },
  { id: "EU8672_23", name: "ЕУ 8672 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [12500, 7500, 7500, 12500] },
  { id: "MM8488_23", name: "ММ 8488 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [29130] },
  { id: "MM4239_23", name: "ММ 4239 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 4000, 6000, 11000] },
  { id: "MA8880_23", name: "МА 8880 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 4000, 6000, 11000] },
  { id: "MK6180_23", name: "МК 6180 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [13500, 7500, 7500, 9350] },
  { id: "EU5123_23", name: "ЕУ 5123 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [11000, 7500, 10000] },
  { id: "MK5737_23", name: "МК 5737 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [30000] },
  { id: "ET0683_23", name: "ЕТ 0683 23", type: "tanker", axles: 3, tareKg: 7300, compartmentsLiters: [22000] },
  { id: "MO0882_23", name: "МО 0882 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [10365, 6925, 10450] },
  { id: "MA2562_23", name: "МА 2562 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 8000, 9000] },
  { id: "MU5054_23", name: "МУ 5054 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [11422, 4556, 12653] },
  { id: "MK5702_23", name: "МК 5702 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9750, 7500, 7500, 7500] },
  { id: "EU5224_23", name: "ЕУ 5224 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [11000, 5500, 4500, 11000] },
  { id: "MM6410_23", name: "ММ 6410 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [10000, 7000, 5000, 10000] },
  { id: "ET3627_23", name: "ЕТ 3627 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [10500, 5000, 6500, 10000] },
  { id: "MA3650_23", name: "МА 3650 23", type: "tanker", axles: 4, tareKg: 7800, compartmentsLiters: [9000, 8000, 12000] }
];

const {
  BASE_PRODUCTS = defaultProducts,
  BASE_TRUCKS = defaultTrucks,
  BASE_TRAILERS = defaultTrailers
} = window.vigardData || {};

const LS_KEYS = {
  custom: 'vigard_custom_trailers_v1',
  products: 'vigard_custom_products_v1',
  trucks: 'vigard_custom_trucks_v1',
  truckAxlesMap: 'vigard_truck_axles_map_v1',
  state:  'vigard_state_v7',
  legacyStates: ['vigard_state_v6', 'vigard_state_v5', 'vigard_state_v4']
};

// === Products
function sanitizeProduct(item){
  if(!item) return null;
  const key=(typeof item.key==='string' && item.key.trim())?item.key.trim():null;
  const label=(typeof item.label==='string' && item.label.trim())?item.label.trim():null;
  const rhoVal=num(item.rho, NaN);
  if(!key || !label || !Number.isFinite(rhoVal) || rhoVal<=0) return null;
  return { key, label, rho: Number(rhoVal.toFixed(3)) };
}
function getAllProducts(){
  let custom=[];
  try{ const raw=JSON.parse(localStorage.getItem(LS_KEYS.products)||'[]'); if(Array.isArray(raw)) custom=raw; }catch(e){}
  const baseList=Array.isArray(BASE_PRODUCTS)?BASE_PRODUCTS:[];
  const sanitized=new Map();
  baseList.map(sanitizeProduct).filter(Boolean).forEach(item=>{ sanitized.set(item.key, item); });
  custom.map(sanitizeProduct).filter(Boolean).forEach(item=>{ sanitized.set(item.key, item); });
  return [...sanitized.values()];
}
function addCustomProduct(label, rho){
  const key=('custom_'+label).toLowerCase().replace(/\s+/g,'_').replace(/[^\wа-яё_-]/gi,'');
  const list=(()=>{ try{ const raw=JSON.parse(localStorage.getItem(LS_KEYS.products)||'[]'); return Array.isArray(raw)?raw:[]; }catch(e){ return []; }})();
  const existingIndex=list.findIndex(item=>item.key===key);
  if(existingIndex>=0) list.splice(existingIndex,1);
  const normalized={ key, label, rho:Number(rho.toFixed(3)) };
  list.push(normalized);
  try{ localStorage.setItem(LS_KEYS.products, JSON.stringify(list)); }catch(e){}
  return key;
}

// === Trucks
function getAllTrucks(){
  const custom = JSON.parse(localStorage.getItem(LS_KEYS.trucks)||'[]');
  return [...BASE_TRUCKS, ...custom];
}
function getTruckAxles(plate){
  try{ const map = JSON.parse(localStorage.getItem(LS_KEYS.truckAxlesMap)||'{}'); return map[plate]||null; }catch(e){ return null; }
}
function setTruckAxles(plate, axles){
  if(!plate) return;
  let map={}; try{ map = JSON.parse(localStorage.getItem(LS_KEYS.truckAxlesMap)||'{}'); }catch(e){}
  map[plate]=axles; localStorage.setItem(LS_KEYS.truckAxlesMap, JSON.stringify(map));
}

// === Trailers
function getAllTrailers(){
  const custom = JSON.parse(localStorage.getItem(LS_KEYS.custom)||'[]');
  return [...BASE_TRAILERS, ...custom];
}
function renderTrailerSelect(selectedId){
  const selects=getTrailerSelects();
  if(!selects.length) return;
  const trailers=getAllTrailers();
  const options=trailers.map(t=>({ value:t.id, label:t.name }));
  let effective=selectedId;
  if(!effective || !trailers.some(t=>t.id===effective)){
    effective=trailers[0]?.id||'';
  }
  selects.forEach(sel=>fillSelectOptions(sel, options, effective));
  if(!trailers.length){
    app.selectedTrailerId=null;
  } else {
    app.selectedTrailerId = effective || null;
  }
}
function renderTractorSelect(selected){
  const selects=getTractorSelects();
  if(!selects.length) return;
  const trucks=getAllTrucks();
  const options=trucks.map(num=>({ value:num, label:num }));
  let effective=selected;
  if(!effective || !trucks.includes(effective)){
    effective=trucks[0]||'';
  }
  selects.forEach(sel=>fillSelectOptions(sel, options, effective));
  if(!trucks.length){ app.tractorPlate=''; }
  else app.tractorPlate = effective || '';
}
function setTrailerInfo(t){
  const info=$('trailerInfo'); if(!info) return;
  if(!t){ info.textContent=''; return; }
  if(t.type==='tanker') info.innerHTML=`Тип: цистерна · Оси: ${t.axles} · Тара: ${t.tareKg||'—'} кг · Отсеки: ${t.compartmentsLiters.join(' / ')} л (∑ ${t.compartmentsLiters.reduce((a,b)=>a+b,0)} л)`;
  else info.innerHTML=`Тип: площадка · Оси: ${t.axles} · Тара: ${t.tareKg||'—'} кг · Позиции: ${t.positions||4}`;
}

// === Tanker table
function densityOptionsHtml(selectedKey){
  const list=getAllProducts();
  if(!list.length) return '<option value="">—</option>';
  return list.map(d=>`<option value="${d.key}" ${d.key===selectedKey?'selected':''}>${d.label}</option>`).join('');
}
function buildTankRows(state){
  const tb=$('tankBody'); if(!tb) return;
  tb.innerHTML='';
  const thead=$('tankHeadRow');
  const single=!!app.singleCargo;
  if(thead){
    if(single) thead.innerHTML='<th>Отсек</th><th>Литры</th><th>Тонны</th><th>м³</th>';
    else thead.innerHTML='<th>Отсек</th><th>Тип груза</th><th>ρ (кг/л)</th><th>Литры</th><th>Тонны</th><th>м³</th>';
  }
  const caps=state.caps||[];
  state.rows.forEach((row,idx)=>{
    const tr=document.createElement('tr');
    const capText=caps[idx]??'—';
    if(single){
      const liters=isFinite(row.liters)?row.liters:0;
      const tons=isFinite(row.tons)?row.tons:0;
      const m3=isFinite(liters)?liters/1000:0;
      tr.innerHTML=`
        <td><span class="pill">#${idx+1}</span><div class="cap">лимит ${capText} л</div></td>
        <td><input class="inpL" type="number" step="0.001" value="${liters??0}"></td>
        <td><input class="inpT" type="number" step="0.001" value="${tons??0}"></td>
        <td><span class="outM3">${isFinite(m3)?m3.toFixed(3):'0.000'}</span></td>`;
    } else {
      const liters=isFinite(row.liters)?row.liters:0;
      const tons=isFinite(row.tons)?row.tons:0;
      const m3=isFinite(liters)?liters/1000:0;
      tr.innerHTML=`
        <td><span class="pill">#${idx+1}</span><div class="cap">лимит ${capText} л</div></td>
        <td><select class="selType">${densityOptionsHtml(row.typeKey||'diesel')}</select></td>
        <td><input class="inpRho" type="number" step="0.001" value="${row.rho??0.84}"></td>
        <td><input class="inpL" type="number" step="0.001" value="${liters??0}"></td>
        <td><input class="inpT" type="number" step="0.001" value="${tons??0}"></td>
        <td><span class="outM3">${isFinite(m3)?m3.toFixed(3):'0.000'}</span></td>`;
    }
    tb.appendChild(tr);
    if(!single){
      const selType=tr.querySelector('.selType');
      if(selType) selType.value=row.typeKey||'diesel';
    }
  });
}
function ensureRowsMatchCaps(state){
  if(!Array.isArray(state.caps)) state.caps=[];
  const need=state.caps.length;
  while(state.rows.length<need) state.rows.push({typeKey:'diesel', rho:0.84, liters:0, tons:0});
  while(state.rows.length>need) state.rows.pop();
}
function tankerFromPreset(compartments){
  const caps=Array.isArray(compartments)?compartments:[0];
  return { caps:[...caps], rows: caps.map(()=>({typeKey:'diesel', rho:0.84, liters:0, tons:0})) };
}
function applyGlobalCargoToRows(){
  if(!app.trailerState || app.trailerState.type!=='tanker') return;
  const rows=app.trailerState.rows||[];
  rows.forEach(row=>{
    row.typeKey=app.singleCargoTypeKey||row.typeKey||'diesel';
    const rhoVal=num(app.singleCargoRho, row.rho||0);
    row.rho=(Number.isFinite(rhoVal) && rhoVal>0)?rhoVal:row.rho||0.84;
  });
}
function renderSingleCargoControls(){
  setupCargoLayout();
  const products=getAllProducts();
  const hasTanker=app.trailerState?.type==='tanker';
  const panel=$('globalCargoPanel');
  if(panel) panel.style.display=hasTanker?'block':'none';
  const mode=$('chkAllSame');
  if(mode){
    mode.checked=!!app.singleCargo;
    mode.disabled=!hasTanker;
  }
  const typeSelect=getGlobalTypeSelect();
  if(typeSelect){
    if(products.length){
      typeSelect.innerHTML=products.map(p=>`<option value="${p.key}">${p.label}</option>`).join('');
      if(!products.some(p=>p.key===app.singleCargoTypeKey)) app.singleCargoTypeKey=products[0]?.key||'';
      if(app.singleCargoTypeKey) typeSelect.value=app.singleCargoTypeKey;
    } else {
      typeSelect.innerHTML='<option value="">—</option>';
      typeSelect.value='';
      app.singleCargoTypeKey='';
    }
    typeSelect.disabled=!hasTanker || !products.length;
  }
  const product=products.find(p=>p.key===app.singleCargoTypeKey);
  if(product && (!Number.isFinite(app.singleCargoRho) || app.singleCargoRho<=0)){
    app.singleCargoRho=product.rho;
  }
  if(!product && (!Number.isFinite(app.singleCargoRho) || app.singleCargoRho<=0)){
    app.singleCargoRho=NaN;
  }
  const rhoInput=getGlobalRhoInput();
  if(rhoInput){
    if(!rhoInput.matches(':focus')){
      rhoInput.value=(Number.isFinite(app.singleCargoRho) && app.singleCargoRho>0)?String(app.singleCargoRho):'';
    }
    rhoInput.disabled=!hasTanker;
  }
  const addBtn=$('btnAddProduct');
  if(addBtn){
    addBtn.disabled=!hasTanker;
    addBtn.textContent='+';
    addBtn.setAttribute('aria-label','Добавить груз');
    addBtn.setAttribute('title','Добавить груз');
  }
  const massInput=$('totalMassT');
  if(massInput && massInput!==document.activeElement){
    massInput.value=(app.totalMassT!==undefined && app.totalMassT!==null)?app.totalMassT:'';
  }
  const volInput=$('totalVolM3');
  if(volInput && volInput!==document.activeElement){
    volInput.value=(app.totalVolM3!==undefined && app.totalVolM3!==null)?app.totalVolM3:'';
  }
  updateTankSectionVisibility();
}

// === Platform table
function buildPlatRows(state){
  const tb=$('platBody'); if(!tb) return;
  tb.innerHTML='';
  const n=state.positions||4; for(let i=0;i<n;i++){
    const tr=document.createElement('tr');
    const kgVal=num(state.masses?.[i], NaN);
    const tonsVal=Number.isFinite(kgVal)?roundTo(kgVal/1000,3):NaN;
    const valueStr=Number.isFinite(tonsVal)?String(tonsVal):'';
    tr.innerHTML=`<td><span class="pill">#${i+1}</span></td><td><input class="inpMass" type="number" step="0.001" value="${valueStr}"></td>`;
    tb.appendChild(tr);
  }
}

// ===== State =====
let app={
  tractorAxles:2,
  tractorPlate:null,
  selectedTrailerId:null,
  trailerState:null,
  distanceMode:'manual',   // 'manual' | 'maps'
  provider:'google',       // 'google' | 'yandex'
  distanceKm:0,
  ratePerKm:0,
  trips:1,
  routeFrom:'',
  routeTo:'',
  avoidTolls:false,
  truckMode:true,
  avoidScales:false,
  singleCargo:true,
  singleCargoTypeKey:'diesel',
  singleCargoRho:0.84,
  lastLoadRequest:null,
  totalMassT:'',
  totalVolM3:'',
  pendingOverflowToast:false,
  lastOverflowLiters:0
};
if (app.distanceMode === 'gmaps') app.distanceMode = 'maps'; // миграция со старого имени

function loadState(){
  try{
    let raw=localStorage.getItem(LS_KEYS.state);
    if(!raw && Array.isArray(LS_KEYS.legacyStates)){
      for(const key of LS_KEYS.legacyStates){
        if(!key) continue;
        raw=localStorage.getItem(key);
        if(raw){ break; }
      }
    }
    if(raw){
      const s=JSON.parse(raw);
      if(s){ app={...app, ...normalizeLoadedState(s)}; }
    }
  }catch(e){}
}
function saveState(){
  try{ localStorage.setItem(LS_KEYS.state, JSON.stringify(app)); }catch(e){}
  if(Array.isArray(LS_KEYS.legacyStates)){
    LS_KEYS.legacyStates.forEach(key=>{ try{ localStorage.removeItem(key); }catch(e){} });
  }
}

// CODEx: normalize persisted state across versions
function normalizeLoadedState(raw){
  const normalized={...raw};
  normalized.singleCargo = raw.singleCargo!==false;
  const typeKey = (typeof raw.singleCargoTypeKey==='string' && raw.singleCargoTypeKey.trim()) ? raw.singleCargoTypeKey.trim() : 'diesel';
  normalized.singleCargoTypeKey = typeKey;
  const rhoNum = Number(raw.singleCargoRho);
  normalized.singleCargoRho = (Number.isFinite(rhoNum) && rhoNum>0) ? rhoNum : 0.84;
  delete normalized.singleCargoAdr;

  const modeRaw = raw.distanceMode === 'gmaps' ? 'maps' : raw.distanceMode;
  normalized.distanceMode = modeRaw === 'maps' ? 'maps' : 'manual';
  normalized.provider = raw.provider === 'yandex' ? 'yandex' : 'google';
  normalized.avoidTolls = !!raw.avoidTolls;
  normalized.truckMode = raw.truckMode !== false;
  normalized.avoidScales = !!raw.avoidScales;

  const massVal = raw.totalMassT;
  normalized.totalMassT = (massVal!==undefined && massVal!==null) ? String(massVal) : '';
  const volVal = raw.totalVolM3;
  normalized.totalVolM3 = (volVal!==undefined && volVal!==null) ? String(volVal) : '';

  const leftoverLiters = num(raw.lastOverflowLiters, NaN);
  normalized.lastOverflowLiters = Number.isFinite(leftoverLiters) && leftoverLiters>0 ? leftoverLiters : 0;
  normalized.pendingOverflowToast=false;

  const reqRaw = raw.lastLoadRequest;
  if(reqRaw && typeof reqRaw==='object'){
    const rawLiters = (reqRaw.liters===null || reqRaw.liters===undefined) ? NaN : reqRaw.liters;
    const rawKg = (reqRaw.kg===null || reqRaw.kg===undefined) ? (reqRaw.massKg===null || reqRaw.massKg===undefined ? NaN : reqRaw.massKg) : reqRaw.kg;
    const rawTons = (reqRaw.tons===null || reqRaw.tons===undefined) ? NaN : reqRaw.tons;
    const rawM3 = (reqRaw.m3===null || reqRaw.m3===undefined) ? NaN : reqRaw.m3;
    const rawRho = (reqRaw.rho===null || reqRaw.rho===undefined) ? NaN : reqRaw.rho;
    const liters = num(rawLiters, NaN);
    const kg = num(rawKg, NaN);
    const tons = num(rawTons, NaN);
    const m3 = num(rawM3, NaN);
    const rhoVal = num(rawRho, NaN);
    normalized.lastLoadRequest = {
      source: reqRaw.source || reqRaw.kind || '',
      liters: Number.isFinite(liters) ? liters : (Number.isFinite(m3) ? m3*1000 : (Number.isFinite(kg) && Number.isFinite(rhoVal) && rhoVal>0 ? kg/rhoVal : NaN)),
      kg: Number.isFinite(kg) ? kg : (Number.isFinite(tons) ? tons*1000 : (Number.isFinite(liters) && Number.isFinite(rhoVal) && rhoVal>0 ? liters*rhoVal : NaN)),
      tons: Number.isFinite(tons) ? tons : (Number.isFinite(kg) ? kg/1000 : NaN),
      m3: Number.isFinite(m3) ? m3 : (Number.isFinite(liters) ? liters/1000 : NaN),
      rho: Number.isFinite(rhoVal) && rhoVal>0 ? rhoVal : NaN
    };
  } else {
    normalized.lastLoadRequest=null;
  }

  if(raw.trailerState && raw.trailerState.type==='tanker'){
    const caps=Array.isArray(raw.trailerState.caps)? raw.trailerState.caps.map(c=>num(c,0)) : [];
    const rows=Array.isArray(raw.trailerState.rows)? raw.trailerState.rows.map(row=>{
      const typeKey=(typeof row?.typeKey==='string' && row.typeKey.trim()) ? row.typeKey.trim() : 'diesel';
      const rhoVal=num(row?.rho, NaN);
      const litersVal=Math.max(0, num(row?.liters, 0));
      const tonsRaw=num(row?.tons, NaN);
      const kgRaw=num(row?.kg, NaN);
      const tonsVal=Number.isFinite(tonsRaw) ? tonsRaw : (Number.isFinite(kgRaw) ? kgRaw/1000 : 0);
      return {
        typeKey,
        rho: (Number.isFinite(rhoVal) && rhoVal>0) ? rhoVal : 0.84,
        liters: litersVal,
        tons: Math.max(0, tonsVal)
      };
    }) : [];
    normalized.trailerState = { ...raw.trailerState, type:'tanker', caps, rows };
  } else if(raw.trailerState && raw.trailerState.type==='platform'){
    const masses=Array.isArray(raw.trailerState.masses)? raw.trailerState.masses.map(m=>Math.max(0, num(m,0))) : [];
    normalized.trailerState = { ...raw.trailerState, type:'platform', positions: raw.trailerState.positions||4, masses };
  }

  return normalized;
}

// ===== Bulk distribute helpers =====
function getTankRows(){
  const tb=$('tankBody');
  return tb ? [...tb.querySelectorAll('tr')] : [];
}
function distributeByVolumeLiters(totalLiters, opts={}){
  if(!app.trailerState || app.trailerState.type!=='tanker') return;
  const rawValue=typeof totalLiters==='number'?totalLiters:parseFloat(totalLiters);
  if(!Number.isFinite(rawValue)){
    showToast('Введите валидное значение', 'warn');
    return;
  }
  if(rawValue<0){
    showToast('Отрицательные значения запрещены', 'warn');
    return;
  }
  const litersRequested=Math.max(0, rawValue);
  if(litersRequested===0){
    app.lastLoadRequest=null;
    recalc();
    return;
  }
  const { source='volume_liters', recordRequest=true } = opts;
  const rows=getTankRows();
  if(!rows.length){ app.pendingOverflowToast=false; return; }
  const single=!!app.singleCargo;
  const globalRho=num(app.singleCargoRho, NaN);
  if(single && (!Number.isFinite(globalRho) || globalRho<=0)){
    app.pendingOverflowToast=false;
    showToast('Введите валидную ρ', 'warn');
    return;
  }

  if(single){
    rows.forEach(tr=>{
      const litersInput=tr.querySelector('.inpL');
      const tonsInput=tr.querySelector('.inpT');
      if(litersInput) setInputValue(litersInput, 0, 3);
      if(tonsInput) setInputValue(tonsInput, 0, 3);
    });
  }

  let remainingLiters=litersRequested;
  let allocatedLiters=0;
  let allocatedKg=0;

  rows.forEach((tr,idx)=>{
    if(remainingLiters<=0) return;
    const litersInput=tr.querySelector('.inpL');
    const tonsInput=tr.querySelector('.inpT');
    const rho = single ? globalRho : num(tr.querySelector('.inpRho')?.value, NaN);
    const capRaw=num(app.trailerState.caps[idx],0);
    const cap=isFinite(capRaw)?Math.max(0,capRaw):0;
    const currentLiters=single?0:Math.max(0, num(litersInput?.value,0));
    const freeLiters=Math.max(0, cap-currentLiters);
    if(freeLiters<=0) return;
    const addLiters=Math.min(remainingLiters, freeLiters);
    const newLiters=currentLiters+addLiters;
    setInputValue(litersInput, newLiters, 3);
    if(Number.isFinite(rho) && rho>0 && tonsInput){
      setInputValue(tonsInput, newLiters*rho/1000, 3);
      allocatedKg+=addLiters*rho;
    } else if(Number.isFinite(rho) && rho>0){
      allocatedKg+=addLiters*rho;
    }
    allocatedLiters+=addLiters;
    remainingLiters-=addLiters;
  });

  if(recordRequest){
    const avgRho = allocatedLiters>0 && allocatedKg>0 ? allocatedKg/allocatedLiters : (single?globalRho:NaN);
    const rhoForRequest = Number.isFinite(avgRho) && avgRho>0 ? avgRho : (single?globalRho:NaN);
    const requestKg = Number.isFinite(rhoForRequest) ? litersRequested*rhoForRequest : NaN;
    const requestTons = Number.isFinite(requestKg) ? requestKg/1000 : NaN;
    app.lastLoadRequest={ source, liters: litersRequested, kg: requestKg, tons: requestTons, m3: litersRequested/1000, rho: rhoForRequest };
  }

  app.pendingOverflowToast=true;
  recalc();
}
function distributeByMassTons(totalTons){
  if(!app.trailerState || app.trailerState.type!=='tanker') return;
  const rawValue=typeof totalTons==='number'?totalTons:parseFloat(totalTons);
  if(!Number.isFinite(rawValue)){
    showToast('Введите валидное значение', 'warn');
    return;
  }
  if(rawValue<0){
    showToast('Отрицательные значения запрещены', 'warn');
    return;
  }
  const tonsRequested=Math.max(0, rawValue);
  const kgRequested=tonsRequested*1000;
  if(kgRequested<=0){ app.lastLoadRequest=null; recalc(); return; }
  const rows=getTankRows();
  if(!rows.length){ app.pendingOverflowToast=false; return; }
  const single=!!app.singleCargo;
  const globalRho=num(app.singleCargoRho, NaN);
  if(single && (!Number.isFinite(globalRho) || globalRho<=0)){
    app.pendingOverflowToast=false;
    showToast('Введите валидную ρ', 'warn');
    return;
  }

  if(single){
    rows.forEach(tr=>{
      const litersInput=tr.querySelector('.inpL');
      const tonsInput=tr.querySelector('.inpT');
      if(litersInput) setInputValue(litersInput, 0, 3);
      if(tonsInput) setInputValue(tonsInput, 0, 3);
    });
  }

  let remainingKg=kgRequested;
  let allocatedKg=0;
  let allocatedLiters=0;

  rows.forEach((tr,idx)=>{
    if(remainingKg<=0) return;
    const litersInput=tr.querySelector('.inpL');
    const tonsInput=tr.querySelector('.inpT');
    const rho = single ? globalRho : num(tr.querySelector('.inpRho')?.value, NaN);
    if(!Number.isFinite(rho) || rho<=0) return;
    const capRaw=num(app.trailerState.caps[idx],0);
    const cap=isFinite(capRaw)?Math.max(0,capRaw):0;
    const currentLiters=single?0:Math.max(0, num(litersInput?.value,0));
    const freeLiters=Math.max(0, cap-currentLiters);
    if(freeLiters<=0) return;
    const freeKg=freeLiters*rho;
    if(freeKg<=0) return;
    const addKg=Math.min(remainingKg, freeKg);
    const addLiters=addKg/rho;
    const newLiters=currentLiters+addLiters;
    setInputValue(litersInput, newLiters, 3);
    if(tonsInput) setInputValue(tonsInput, newLiters*rho/1000, 3);
    allocatedKg+=addKg;
    allocatedLiters+=addLiters;
    remainingKg-=addKg;
  });

  const avgRho = allocatedLiters>0 && allocatedKg>0 ? allocatedKg/allocatedLiters : (single?globalRho:NaN);
  const rhoForRequest = Number.isFinite(avgRho) && avgRho>0 ? avgRho : (single?globalRho:NaN);
  let requestLiters = Number.isFinite(rhoForRequest) && rhoForRequest>0 ? kgRequested/rhoForRequest : allocatedLiters;
  if(!Number.isFinite(requestLiters) || requestLiters<0) requestLiters = allocatedLiters;
  app.lastLoadRequest={ source:'mass_tons', liters: requestLiters, kg: kgRequested, tons: tonsRequested, m3: requestLiters/1000, rho: rhoForRequest };
  app.pendingOverflowToast=true;
  recalc();
}

function fillCompartmentMax(){
  if(!app.trailerState || app.trailerState.type!=='tanker') return;
  const rows=getTankRows();
  if(!rows.length) return;
  const single=!!app.singleCargo;
  const globalRho=num(app.singleCargoRho, NaN);
  if(single && (!Number.isFinite(globalRho) || globalRho<=0)){
    app.pendingOverflowToast=false;
    showToast('Введите валидную ρ', 'warn');
    return;
  }

  let totalLiters=0;
  let totalKg=0;

  rows.forEach((tr,idx)=>{
    const litersInput=tr.querySelector('.inpL');
    const tonsInput=tr.querySelector('.inpT');
    const rho = single ? globalRho : num(tr.querySelector('.inpRho')?.value, NaN);
    const capRaw=num(app.trailerState.caps[idx],0);
    const cap=isFinite(capRaw)?Math.max(0,capRaw):0;
    setInputValue(litersInput, cap, 3);
    if(Number.isFinite(rho) && rho>0){
      const tonsVal=cap*rho/1000;
      if(tonsInput) setInputValue(tonsInput, tonsVal, 3);
      totalKg+=cap*rho;
    } else if(tonsInput){
      setInputValue(tonsInput, NaN);
    }
    totalLiters+=cap;
  });

  const avgRho = totalLiters>0 && totalKg>0 ? totalKg/totalLiters : (single?globalRho:NaN);
  const rhoForRequest = Number.isFinite(avgRho) && avgRho>0 ? avgRho : (single?globalRho:NaN);
  const kgVal = Number.isFinite(rhoForRequest) ? totalLiters*rhoForRequest : NaN;
  app.lastLoadRequest={ source:'fill_max', liters: totalLiters, kg: kgVal, tons: Number.isFinite(kgVal)?kgVal/1000:NaN, m3: totalLiters/1000, rho: rhoForRequest };
  app.pendingOverflowToast=true;
  recalc();
}

function clearCompartments(){
  if(!app.trailerState || app.trailerState.type!=='tanker') return;
  app.lastLoadRequest=null;
  app.pendingOverflowToast=false;
  getTankRows().forEach(tr=>{
    const l=tr.querySelector('.inpL');
    const t=tr.querySelector('.inpT');
    if(l) l.value='';
    if(t) t.value='';
  });
  if(Array.isArray(app.trailerState.rows)){
    app.trailerState.rows.forEach(row=>{ row.liters=0; row.tons=0; });
  }
  recalc();
}

// ===== Init / Render =====
function selectTrailer(id){
  const all=getAllTrailers();
  if(!all.length){
    app.selectedTrailerId=null;
    app.trailerState=null;
    app.lastLoadRequest=null;
    renderCurrent();
    saveState();
    return;
  }
  const t=all.find(x=>x.id===id) || all[0];
  app.selectedTrailerId=t.id;
  app.lastLoadRequest=null;
  if(t.type==='tanker'){ app.trailerState={type:'tanker', ...tankerFromPreset(t.compartmentsLiters)}; }
  else { app.trailerState={type:'platform', positions:t.positions||4, masses:Array(t.positions||4).fill(0)}; }
  renderCurrent(); saveState();
}
function renderCurrent(){
  setupCargoLayout();
  const trailers=getAllTrailers();
  const t=trailers.find(x=>x.id===app.selectedTrailerId) || trailers[0] || null;
  if(t){ app.selectedTrailerId=t.id; }
  setTrailerInfo(t);
  renderTrailerSelect(app.selectedTrailerId);

  const trucks=getAllTrucks();
  if(!app.tractorPlate || !trucks.includes(app.tractorPlate)){
    app.tractorPlate=trucks[0]||'';
  }
  renderTractorSelect(app.tractorPlate);
  const storedAx=getTruckAxles(app.tractorPlate);
  app.tractorAxles=storedAx||app.tractorAxles||2;
  if($('tractorAxles')) $('tractorAxles').value=String(app.tractorAxles||2);

  const provEl = $('provider'); if (provEl) provEl.value = app.provider||'google';

  const isMaps = (app.distanceMode === 'maps' || app.distanceMode === 'gmaps');
  if($('distanceMode')) $('distanceMode').value = isMaps ? 'maps' : 'manual';

  if($('distanceKm')) $('distanceKm').value = Number.isFinite(app.distanceKm) ? String(app.distanceKm) : '';
  if($('ratePerKm'))  $('ratePerKm').value  = Number.isFinite(app.ratePerKm) ? String(app.ratePerKm) : '';
  if($('trips'))      $('trips').value      = Number.isFinite(app.trips) ? String(app.trips) : '1';

  if($('routeFrom'))  $('routeFrom').value  = app.routeFrom || '';
  if($('routeTo'))    $('routeTo').value    = app.routeTo   || '';

  if($('avoidTolls')) $('avoidTolls').checked = !!app.avoidTolls;
  if($('truckMode')) $('truckMode').checked = !!app.truckMode;
  if($('avoidScales')) $('avoidScales').checked = !!app.avoidScales;

  if($('gmapsRow'))  $('gmapsRow').style.display  = isMaps ? 'grid'  : 'none';
  if($('gmapsNote')) $('gmapsNote').style.display = isMaps ? 'block' : 'none';
  if($('mapsNote')) $('mapsNote').style.display = isMaps ? 'block' : 'none';

  const platformSection=$('platformSection');
  if(platformSection) platformSection.style.display='none';

  if(app.trailerState?.type==='tanker'){
    ensureRowsMatchCaps(app.trailerState);
    if(app.singleCargo) applyGlobalCargoToRows();
    buildTankRows(app.trailerState);
  }
  else if(app.trailerState?.type==='platform'){
    if(platformSection) platformSection.style.display='block';
    buildPlatRows(app.trailerState);
  }
  else {
    if($('fitSummary')) $('fitSummary').textContent='';
  }

  updateTankSectionVisibility();
  renderSingleCargoControls();

  recalc();
}

// ===== Recalc =====
function recalc(){
  if(!app.trailerState){ return; }
  const tstate=app.trailerState;
  const warns=[];
  let totalLiters=0;
  let totalKg=0;
  let showLiters=false;
  let distanceValid=false;
  let rateValid=false;
  let tripsValid=false;
  let costValid=false;
  let distanceText='';
  let rateText='';
  let tripsText='';
  let costText='';
  let cost=0;

  const tractorSelects=getTractorSelects();
  if(tractorSelects.length){
    const active=document.activeElement;
    let value='';
    if(active && tractorSelects.includes(active)){
      value=active.value;
    }
    if(!value) value=tractorSelects[0].value;
    if(value) app.tractorPlate=value;
    tractorSelects.forEach(sel=>{ if(sel.value!==app.tractorPlate) sel.value=app.tractorPlate; });
  }

  if(tstate.type==='tanker'){
    showLiters=true;
    const tb=$('tankBody');
    const rows=tb?[...tb.querySelectorAll('tr')]:[];
    const active=document.activeElement;
    const single=!!app.singleCargo;
    const products=getAllProducts();
    const capsList=Array.isArray(tstate.caps)?tstate.caps:[];
    const capacityTotal=capsList.reduce((acc, cap)=>{
      const val=num(cap, NaN);
      return acc + (Number.isFinite(val)?Math.max(0, val):0);
    }, 0);

    if(single && (!Number.isFinite(app.singleCargoRho) || app.singleCargoRho<=0)){
      warns.push('Укажите корректную плотность для общего груза (>0)');
    }

    rows.forEach((tr,i)=>{
      const row=tstate.rows[i]||{};
      const litersInput=tr.querySelector('.inpL');
      const tonsInput=tr.querySelector('.inpT');
      const m3Cell=tr.querySelector('.outM3');
      const typeSelect=tr.querySelector('.selType');

      let typeKey=single?(app.singleCargoTypeKey||row.typeKey||'diesel'):(typeSelect?.value||row.typeKey||'diesel');
      if(!products.some(p=>p.key===typeKey)){
        typeKey=products[0]?.key||typeKey;
      }
      if(!single && typeSelect && typeSelect.value!==typeKey){
        typeSelect.value=typeKey;
      }

      let rho=single?num(app.singleCargoRho, row.rho||0.84):num(tr.querySelector('.inpRho')?.value, row.rho||0.84);
      if((!Number.isFinite(rho) || rho<=0) && !single){
        const dict=products.find(d=>d.key===typeKey);
        if(dict){
          rho=dict.rho;
          const rhoInput=tr.querySelector('.inpRho');
          if(rhoInput) setInputValue(rhoInput, rho, 3);
        }
      }
      if(!Number.isFinite(rho) || rho<=0){
        warns.push(`Отсек #${i+1}: укажите плотность (>0)`);
      }

      let liters=num(litersInput?.value, NaN);
      let tons=num(tonsInput?.value, NaN);
      if(!Number.isFinite(liters)) liters=0;
      if(!Number.isFinite(tons)) tons=0;
      if(liters<0){ warns.push(`Отсек #${i+1}: отрицательные литры`); liters=0; }
      if(tons<0){ warns.push(`Отсек #${i+1}: отрицательная масса`); tons=0; }

      if(Number.isFinite(rho) && rho>0){
        if(active===tonsInput){
          liters=Math.max(0, tons*1000/rho);
        } else if(active===litersInput){
          tons=Math.max(0, liters*rho/1000);
        } else {
          tons=Math.max(0, liters*rho/1000);
        }
        setInputValue(litersInput, liters, 3);
        setInputValue(tonsInput, tons, 3);
      } else {
        setInputValue(litersInput, liters, 3);
        setInputValue(tonsInput, tons, 3);
      }

      const m3=liters/1000;
      if(m3Cell) m3Cell.textContent = Number.isFinite(m3)?roundTo(m3,3).toFixed(3):'0.000';

      const capRaw=num(tstate.caps[i], NaN);
      if(Number.isFinite(capRaw)){
        const capLimit=Math.max(0, capRaw);
        if(liters>capLimit){
          const litersRounded=Math.round(liters).toLocaleString('ru-RU');
          const capRounded=Math.round(capLimit).toLocaleString('ru-RU');
          warns.push(`Переполнение отсека #${i+1}: ${litersRounded} л > лимита ${capRounded} л`);
        }
      }

      tstate.rows[i]={ typeKey, rho: Number.isFinite(rho)&&rho>0?rho:0, liters, tons };
      totalLiters+=liters;
      totalKg+=tons*1000;
    });

    const totalM3=totalLiters/1000;
    const totalTons=totalKg/1000;

    const req=app.lastLoadRequest;
    let leftoverLiters=0;
    let leftoverKg=0;
    let leftoverTons=0;
    let leftoverM3=0;

    const avgRhoTotal=(totalLiters>0 && totalKg>0)?(totalKg/totalLiters):(single?num(app.singleCargoRho, NaN):NaN);

    if(req && Number.isFinite(req.liters)){
      leftoverLiters=Math.max(0, req.liters-totalLiters);
      if(Number.isFinite(req.kg)) leftoverKg=Math.max(0, req.kg-totalKg);
      if((!Number.isFinite(leftoverKg) || leftoverKg<=0) && Number.isFinite(req.rho) && req.rho>0){
        leftoverKg=Math.max(0, leftoverLiters*req.rho);
      }
      if(Number.isFinite(req.tons)){
        leftoverTons=Math.max(0, req.tons-totalTons);
      } else {
        leftoverTons=leftoverKg/1000;
      }
      if(Number.isFinite(req.m3)){
        leftoverM3=Math.max(0, req.m3-totalM3);
      } else {
        leftoverM3=leftoverLiters/1000;
      }
      if(req.liters>capacityTotal){
        const reqText=Math.round(req.liters).toLocaleString('ru-RU');
        const capText=Math.round(capacityTotal).toLocaleString('ru-RU');
        warns.push(`Общий объём превышает лимит цистерны: ${reqText} л > ${capText} л`);
      }
    }

    const actualOverflow=Math.max(0, totalLiters-capacityTotal);
    if(actualOverflow>0){
      if(actualOverflow>leftoverLiters){
        leftoverLiters=actualOverflow;
        if(Number.isFinite(avgRhoTotal) && avgRhoTotal>0){
          leftoverKg=leftoverLiters*avgRhoTotal;
          leftoverTons=leftoverKg/1000;
        }
        leftoverM3=leftoverLiters/1000;
      }
      if(!(req && Number.isFinite(req.liters) && req.liters>capacityTotal)){
        const totalText=Math.round(totalLiters).toLocaleString('ru-RU');
        const capText=Math.round(capacityTotal).toLocaleString('ru-RU');
        warns.push(`Общий объём превышает лимит цистерны: ${totalText} л > ${capText} л`);
      }
    }

    if(!Number.isFinite(leftoverKg) || leftoverKg<0) leftoverKg=0;
    if(!Number.isFinite(leftoverTons) || leftoverTons<0) leftoverTons=leftoverKg/1000;
    if(!Number.isFinite(leftoverM3) || leftoverM3<0) leftoverM3=leftoverLiters/1000;

    const fitBox=$('fitSummary');
    if(fitBox){
      const leftoverText=`Не поместилось: ${fmtL(leftoverLiters)} / ${fmtKg(leftoverKg)} / ${fmtT2(leftoverTons)} / ${fmtM3_3(leftoverM3)}`;
      fitBox.textContent=`Всего: ${fmtL(totalLiters)} / ${fmtKg(totalKg)} / ${fmtT2(totalTons)} / ${fmtM3_3(totalM3)} · ${leftoverText}`;
    }

    if((leftoverLiters>0 || warns.some(w=>w.includes('Переполнение'))) && app.pendingOverflowToast){
      showToast('Переполнение: часть груза не поместилась', 'warn');
    }
    app.lastOverflowLiters=leftoverLiters;
    app.pendingOverflowToast=false;

  } else {
    const tb=$('platBody');
    const rows=tb?[...tb.querySelectorAll('tr')]:[];
    const masses=[];
    rows.forEach((tr,i)=>{
      const input=tr.querySelector('.inpMass');
      let tonsVal=parseFloat(input?.value||'');
      if(!Number.isFinite(tonsVal)) tonsVal=0;
      if(tonsVal<0){ warns.push(`Позиция #${i+1}: отрицательная масса`); tonsVal=0; }
      if(input) setInputValue(input, tonsVal, 3);
      const kg=tonsVal*1000;
      masses[i]=kg;
      totalKg+=kg;
    });
    tstate.masses=masses;
    const fitBox=$('fitSummary');
    if(fitBox) fitBox.textContent='';
    app.lastOverflowLiters=0;
    app.pendingOverflowToast=false;
  }

  if($('sumL')) $('sumL').textContent = showLiters ? fmtL(totalLiters) : '—';
  if($('sumKg')) $('sumKg').textContent = fmtKg(totalKg);

  const providerEl=$('provider');
  if(providerEl){
    const val=(providerEl.value||'').toLowerCase();
    app.provider = val==='yandex' ? 'yandex' : 'google';
  } else if(app.provider!=='yandex'){ app.provider='google'; }

  const distanceModeEl=$('distanceMode');
  if(distanceModeEl){
    app.distanceMode = distanceModeEl.value==='maps' ? 'maps' : 'manual';
  } else if(app.distanceMode==='gmaps'){ app.distanceMode='maps'; }

  const avoidTollsEl=$('avoidTolls');
  app.avoidTolls = avoidTollsEl ? !!avoidTollsEl.checked : false;
  const truckModeEl=$('truckMode');
  app.truckMode = truckModeEl ? !!truckModeEl.checked : false;
  const avoidScalesEl=$('avoidScales');
  app.avoidScales = avoidScalesEl ? !!avoidScalesEl.checked : false;

  const routeFromEl=$('routeFrom'); if(routeFromEl) app.routeFrom = routeFromEl.value||'';
  const routeToEl=$('routeTo'); if(routeToEl) app.routeTo = routeToEl.value||'';

  const distanceEl=$('distanceKm');
  const rateEl=$('ratePerKm');
  const tripsEl=$('trips');
  if(distanceEl){
    const parsed=num(distanceEl.value, NaN);
    app.distanceKm = Number.isFinite(parsed) ? parsed : 0;
  } else if(!Number.isFinite(app.distanceKm)) app.distanceKm=0;
  if(rateEl){
    const parsed=num(rateEl.value, NaN);
    app.ratePerKm = Number.isFinite(parsed) ? parsed : 0;
  } else if(!Number.isFinite(app.ratePerKm)) app.ratePerKm=0;
  if(tripsEl){
    const parsed=parseInt(tripsEl.value,10);
    app.trips = Number.isFinite(parsed) ? parsed : 0;
  } else if(!Number.isFinite(app.trips)) app.trips=0;

  cost = app.distanceKm * app.ratePerKm * app.trips;
  distanceValid = Number.isFinite(app.distanceKm) && app.distanceKm>0;
  rateValid = Number.isFinite(app.ratePerKm) && app.ratePerKm>0;
  tripsValid = Number.isFinite(app.trips) && app.trips>0;
  costValid = distanceValid && rateValid && tripsValid;
  if(distanceValid) distanceText = Math.round(app.distanceKm).toLocaleString('ru-RU'); else distanceText='';
  if(rateValid) rateText = app.ratePerKm.toLocaleString('ru-RU'); else rateText='';
  if(tripsValid) tripsText = app.trips.toLocaleString('ru-RU'); else tripsText='';
  if(costValid) costText = cost.toLocaleString('ru-RU'); else costText='';

  const fromTrim=(app.routeFrom||'').trim();
  const toTrim=(app.routeTo||'').trim();
  if(app.distanceMode==='maps'){
    const key=(typeof mapsApiKey==='function')?mapsApiKey():'';
    if(!key || !fromTrim || !toTrim){
      const msg='Маршрут по картам: нет API-ключа и/или адресов — используйте ручной ввод расстояния';
      if(!warns.includes(msg)) warns.push(msg);
    }
  }
  if(!distanceValid){
    const msg='Расстояние не задано или некорректно';
    if(!warns.includes(msg)) warns.push(msg);
  }
  if(!rateValid){
    const msg='Ставка не задана или некорректна';
    if(!warns.includes(msg)) warns.push(msg);
  }
  if(!tripsValid){
    const msg='Количество рейсов должно быть ≥ 1';
    if(!warns.includes(msg)) warns.push(msg);
  }

  const ul=$('warnList');
  if(ul){
    ul.innerHTML='';
    if(warns.length===0){
      const li=document.createElement('li');
      li.textContent='Ошибок не обнаружено.';
      ul.appendChild(li);
    } else {
      warns.forEach(w=>{
        const li=document.createElement('li');
        li.innerHTML=`<span class="warn">⚠</span> ${w}`;
        ul.appendChild(li);
      });
    }
  }

  if($('kpiDistance')) $('kpiDistance').textContent = distanceValid ? `${distanceText} км` : '—';
  if($('kpiRate')) $('kpiRate').textContent = rateValid ? `${rateText} ₽/км` : '—';
  if($('kpiTrips')) $('kpiTrips').textContent = tripsValid ? tripsText : '—';
  if($('kpiCost')) $('kpiCost').textContent = costValid ? `${costText} ₽` : '—';

  const tagsRaw=[];
  if(app.truckMode) tagsRaw.push('грузовой режим');
  if(app.avoidTolls) tagsRaw.push('без платных');
  if(app.avoidScales) tagsRaw.push('объезд весовых');
  const providerLabel=app.provider==='yandex'?'yandex':'google';
  const modeLabel=app.distanceMode==='maps'?'карты':'вручную';
  const tagsSummary = tagsRaw.length ? tagsRaw.map(t=>`[${t}]`).join(' ') : '—';
  const tagsBrief = tagsRaw.length ? tagsRaw.map(t=>`[${t}]`).join('') : '';
  const routeSegment = (fromTrim && toTrim) ? `${fromTrim} → ${toTrim}` : '—';

  const summaryBox=$('routeCostSummary');
  if(summaryBox){
    summaryBox.innerHTML='';
    const title=document.createElement('div');
    title.textContent='Маршрут и стоимость';
    title.style.fontWeight='600';
    title.style.marginBottom='4px';
    summaryBox.appendChild(title);
    const routeLine=document.createElement('div');
    routeLine.textContent=`Маршрут: ${routeSegment} · Провайдер: ${providerLabel} · Режим: ${modeLabel} · Теги: ${tagsSummary}`;
    summaryBox.appendChild(routeLine);
    const calcLine=document.createElement('div');
    calcLine.textContent = costValid ? `Расчёт: ${distanceText} км × ${rateText} ₽/км × ${tripsText} рейс(ов) = Итого: ${costText} ₽` : 'Расчёт: —';
    summaryBox.appendChild(calcLine);
  }

  const t=getAllTrailers().find(x=>x.id===app.selectedTrailerId);
  const products=getAllProducts();
  const lines=[
    `Прицеп: ${t?.name||''} (${t?.type==='tanker'?'цистерна':'площадка'})`,
    `Тягач: ${app.tractorPlate||'—'} (${app.tractorAxles} оси)`,
    `Итоги: ${showLiters?Math.round(totalLiters)+' л':'—'} / ${(totalKg/1000).toFixed(3)} т / ${showLiters?(totalLiters/1000).toFixed(3)+' м³':'—'}`
  ];
  if(tstate.type==='tanker'){
    if(app.singleCargo){
      const prod=products.find(p=>p.key===app.singleCargoTypeKey);
      lines.push(`Груз: ${(prod?.label)||app.singleCargoTypeKey} · ρ ${Number.isFinite(app.singleCargoRho)?app.singleCargoRho.toFixed(3):'—'} кг/л`);
    }
    tstate.rows.forEach((r,i)=>{
      const prod=products.find(p=>p.key===r.typeKey);
      const rhoText=Number.isFinite(r.rho)&&r.rho>0 ? r.rho.toFixed(3) : '—';
      const litersText = Number.isFinite(r.liters) ? Math.round(r.liters).toLocaleString('ru-RU') : '—';
      const tonsText = fmtT2(r.tons||0);
      lines.push(`#${i+1}: ${(prod?.label)||r.typeKey} · ρ ${rhoText} кг/л · ${litersText} л (≈ ${tonsText})`);
    });
  } else {
    (tstate.masses||[]).forEach((kg,i)=>{
      lines.push(`#${i+1}: ${fmtT2((kg||0)/1000)}`);
    });
  }
  const routeLineBrief=`Маршрут: ${routeSegment} · Провайдер: ${providerLabel} · Режим: ${modeLabel}${tagsBrief?` ${tagsBrief}`:''}`;
  const costLineBrief = costValid ? `Стоимость: ${costText} ₽ (${distanceText} км × ${rateText} ₽/км × ${tripsText} рейс.)` : 'Стоимость: —';
  lines.push(routeLineBrief);
  lines.push(costLineBrief);
  if($('brief')) $('brief').value = lines.join('\n');

  saveState();
}

// ===== Events =====
function bind(){
  getTrailerSelects().forEach(sel=>{
    sel.addEventListener('change', e=>{
      selectTrailer(e.target.value);
      getTrailerSelects().forEach(other=>{ if(other!==sel) other.value=e.target.value; });
    });
  });
  getTractorSelects().forEach(sel=>{
    sel.addEventListener('change', e=>{
      app.tractorPlate=e.target.value;
      const ax=getTruckAxles(app.tractorPlate)||2;
      app.tractorAxles=ax;
      if($('tractorAxles')) $('tractorAxles').value=String(ax);
      saveState();
      renderTractorSelect(app.tractorPlate);
      recalc();
    });
  });
  if($('tractorAxles')) $('tractorAxles').addEventListener('change', e=>{ const ax=parseInt(e.target.value)||2; app.tractorAxles=ax; setTruckAxles(app.tractorPlate, ax); saveState(); recalc(); });

  const provEl = $('provider');
  if (provEl) provEl.addEventListener('change', e=>{
    const val=(e.target.value||'').toLowerCase();
    app.provider = val==='yandex' ? 'yandex' : 'google';
    saveState();
    recalc();
    maybeInitMaps();
  });

  const dmEl = $('distanceMode');
  if (dmEl) dmEl.addEventListener('change', e=>{
    app.distanceMode=e.target.value==='maps'?'maps':'manual';
    const isMaps = app.distanceMode==='maps';
    if($('gmapsRow')) $('gmapsRow').style.display=isMaps?'grid':'none';
    if($('gmapsNote')) $('gmapsNote').style.display=isMaps?'block':'none';
    if($('mapsNote')) $('mapsNote').style.display=isMaps?'block':'none';
    saveState();
    recalc();
    maybeInitMaps();
  });

  const avoidTollsEl=$('avoidTolls');
  if(avoidTollsEl) avoidTollsEl.addEventListener('change', e=>{ app.avoidTolls=!!e.target.checked; saveState(); recalc(); });
  const truckModeEl=$('truckMode');
  if(truckModeEl) truckModeEl.addEventListener('change', e=>{ app.truckMode=!!e.target.checked; saveState(); recalc(); });
  const avoidScalesEl=$('avoidScales');
  if(avoidScalesEl) avoidScalesEl.addEventListener('change', e=>{ app.avoidScales=!!e.target.checked; saveState(); recalc(); });

  if($('resetPreset')) $('resetPreset').addEventListener('click', ()=>selectTrailer(app.selectedTrailerId));
  if($('copyBrief')) $('copyBrief').addEventListener('click', ()=>navigator.clipboard.writeText($('brief').value));
  if($('addTrailer')) $('addTrailer').addEventListener('click', openModal);
  if($('addTruck')) $('addTruck').addEventListener('click', openTruckModal);

  ['distanceKm','ratePerKm','trips','routeFrom','routeTo'].forEach(id=>{
    const el=$(id);
    if(el) el.addEventListener('input', ()=>{
      const distVal=num($('distanceKm')?.value, NaN);
      app.distanceKm=Number.isFinite(distVal)?distVal:0;
      const rateVal=num($('ratePerKm')?.value, NaN);
      app.ratePerKm=Number.isFinite(rateVal)?rateVal:0;
      const tripsVal=parseInt($('trips')?.value,10);
      app.trips=Number.isFinite(tripsVal)?tripsVal:0;
      app.routeFrom=$('routeFrom')?.value||'';
      app.routeTo=$('routeTo')?.value||'';
      saveState(); recalc();
    });
  });

  // таблицы
  const tankBodyEl = $('tankBody');
  if (tankBodyEl){
    tankBodyEl.addEventListener('input', ()=>{ app.lastLoadRequest=null; recalc(); });
    tankBodyEl.addEventListener('change', (e)=>{
      app.lastLoadRequest=null;
      const tr = e.target.closest('tr');
      if(!tr) return;
      if(e.target.classList.contains('selType')){
        const typeKey = e.target.value;
        const d = getAllProducts().find(x=>x.key===typeKey);
        if(d){
          const rhoInp = tr.querySelector('.inpRho');
          if(rhoInp){
            rhoInp.value = String(d.rho);
          }
        }
        recalc();
      }
    });
  }
  const platBodyEl=$('platBody');
  if(platBodyEl) platBodyEl.addEventListener('input', recalc);

  // модалка прицепа
  if($('m_type')) $('m_type').addEventListener('change', e=>{ const isPlat=e.target.value==='platform'; if($('m_positions_wrap')) $('m_positions_wrap').style.display=isPlat?'block':'none'; if($('m_caps_wrap')) $('m_caps_wrap').style.display=isPlat?'none':'block'; });
  if($('m_cancel')) $('m_cancel').addEventListener('click', closeModal);
  if($('m_save')) $('m_save').addEventListener('click', saveModalTrailer);

  // модалка тягача
  if($('mt_cancel')) $('mt_cancel').addEventListener('click', closeTruckModal);
  if($('mt_save')) $('mt_save').addEventListener('click', saveTruck);

  // продукты
  if($('btnAddProduct')) $('btnAddProduct').addEventListener('click', openProductModal);

  // карты
  if($('btnRoute')) $('btnRoute').addEventListener('click', buildRoute);
  if($('btnGmaps')) $('btnGmaps').addEventListener('click', buildRoute);
  if($('mapsKey')) $('mapsKey').addEventListener('input', ()=>{ maybeInitMaps(); recalc(); });
  if($('gmapsKey')) $('gmapsKey').addEventListener('input', ()=>{ maybeInitMaps(); recalc(); });

  // пакетное распределение
  const totalMassInput=$('totalMassT');
  if(totalMassInput){
    totalMassInput.addEventListener('input', e=>{
      app.totalMassT=e.target.value;
      saveState();
      recalc();
    });
  }
  const totalVolInput=$('totalVolM3');
  if(totalVolInput){
    totalVolInput.addEventListener('input', e=>{
      app.totalVolM3=e.target.value;
      saveState();
      recalc();
    });
  }
  if($('btnDistributeMass')) $('btnDistributeMass').addEventListener('click', ()=>{
    const raw=$('totalMassT').value;
    const parsed=parseFloat(raw);
    if(!Number.isFinite(parsed)){ showToast('Введите валидное значение', 'warn'); return; }
    if(parsed<0){ showToast('Отрицательные значения запрещены', 'warn'); return; }
    if(parsed===0){ showToast('Ничего не распределено: нет литров/тонн/м³ или ρ', 'warn'); return; }
    app.totalMassT=String(raw||'');
    app.pendingOverflowToast=true;
    distributeByMassTons(parsed);
  });
  if($('btnDistributeM3')) $('btnDistributeM3').addEventListener('click', ()=>{
    const raw=$('totalVolM3').value;
    const parsed=parseFloat(raw);
    if(!Number.isFinite(parsed)){ showToast('Введите валидное значение', 'warn'); return; }
    if(parsed<0){ showToast('Отрицательные значения запрещены', 'warn'); return; }
    if(parsed===0){ showToast('Ничего не распределено: нет литров/тонн/м³ или ρ', 'warn'); return; }
    app.totalVolM3=String(raw||'');
    app.pendingOverflowToast=true;
    distributeByVolumeLiters(parsed*1000, { source:'volume_m3' });
  });

  if($('fillMax')) $('fillMax').addEventListener('click', fillCompartmentMax);
  if($('clearAll')) $('clearAll').addEventListener('click', clearCompartments);

  const singleMode=$('chkAllSame');
  if(singleMode) singleMode.addEventListener('change', e=>{
    app.singleCargo=!!e.target.checked;
    if(!app.singleCargo) app.lastLoadRequest=null;
    if(app.trailerState?.type==='tanker'){
      if(app.singleCargo) applyGlobalCargoToRows();
      buildTankRows(app.trailerState);
    }
    updateTankSectionVisibility();
    renderSingleCargoControls();
    recalc();
  });
  const cargoType=getGlobalTypeSelect();
  if(cargoType) cargoType.addEventListener('change', e=>{
    app.singleCargoTypeKey=e.target.value;
    app.lastLoadRequest=null;
    const prod=getAllProducts().find(p=>p.key===app.singleCargoTypeKey);
    if(prod){
      app.singleCargoRho=prod.rho;
    }
    if(app.singleCargo){
      applyGlobalCargoToRows();
      buildTankRows(app.trailerState);
    }
    renderSingleCargoControls();
    recalc();
  });
  const cargoRho=getGlobalRhoInput();
  if(cargoRho){
    cargoRho.addEventListener('input', e=>{
      const val=parseFloat(e.target.value);
      app.singleCargoRho=Number.isFinite(val)?val:NaN;
      app.lastLoadRequest=null;
      if(app.singleCargo){
        applyGlobalCargoToRows();
        recalc();
      }
    });
    cargoRho.addEventListener('blur', e=>{
      const val=parseFloat(e.target.value);
      if(!(Number.isFinite(val) && val>0)){
        showToast('Введите валидную ρ', 'warn');
      }
    });
  }

  const prodCancel=getProductCancelButton();
  if(prodCancel) prodCancel.addEventListener('click', closeProductModal);
  const prodForm=getProductForm();
  if(prodForm) prodForm.addEventListener('submit', saveProductFromModal);
  const prodSave=getProductSaveButton();
  if(prodSave) prodSave.addEventListener('click', saveProductFromModal);

  // тесты
  if($('runTests')) $('runTests').addEventListener('click', runTests);
}

// ===== Modal logic (trailers)
function openModal(){ if($('modal')) $('modal').classList.add('open'); }
function closeModal(){ if($('modal')) $('modal').classList.remove('open'); }
function genId(name){ return name.replace(/\s+/g,'_'); }
function saveModalTrailer(){
  const name=$('m_name')?.value?.trim(); if(!name){ alert('Укажи номер прицепа'); return; }
  const type=$('m_type')?.value; const axles=parseInt($('m_axles')?.value)||4; const tare=num($('m_tare')?.value, type==='platform'?5900:(axles===3?7300:7800));
  let obj;
  if(type==='platform'){
    const positions=parseInt($('m_positions')?.value)||4;
    obj={ id: genId(name), name, type, axles, tareKg: tare, positions };
  } else {
    const capsStr=$('m_caps')?.value?.trim(); const caps=capsStr? capsStr.split('/').map(s=>parseInt(s.replace(/\s+/g,''))||0) : [10000,8000,9000];
    obj={ id: genId(name), name, type, axles, tareKg: tare, compartmentsLiters: caps };
  }
  const custom=JSON.parse(localStorage.getItem(LS_KEYS.custom)||'[]');
  if(BASE_TRAILERS.find(x=>x.id===obj.id)){ obj.id = obj.id+'_custom'; }
  custom.push(obj); localStorage.setItem(LS_KEYS.custom, JSON.stringify(custom));
  renderTrailerSelect(app.selectedTrailerId); closeModal(); recalc();
}

// ===== Modal logic (trucks)
function openTruckModal(){ if($('modalTruck')) $('modalTruck').classList.add('open'); }
function closeTruckModal(){ if($('modalTruck')) $('modalTruck').classList.remove('open'); }
function saveTruck(){
  const plate=$('mt_plate')?.value?.trim(); if(!plate){ alert('Введи госномер'); return; }
  const axles=parseInt($('mt_axles')?.value)||2;
  const list = JSON.parse(localStorage.getItem(LS_KEYS.trucks)||'[]');
  if(!list.includes(plate)) list.push(plate);
  localStorage.setItem(LS_KEYS.trucks, JSON.stringify(list));
  setTruckAxles(plate, axles);
  renderTractorSelect(plate);
  getTractorSelects().forEach(sel=>{ sel.value=plate; });
  if($('tractorAxles')) $('tractorAxles').value=String(axles);
  app.tractorPlate=plate; app.tractorAxles=axles; saveState();
  closeTruckModal();
}

// ===== Modal logic (products)
function openProductModal(){
  const modal=getProductModalElement();
  if(!modal) return;
  const form=getProductForm();
  if(form) form.reset();
  else {
    const nameInput=getProductNameInput();
    const rhoInput=getProductRhoInput();
    if(nameInput) nameInput.value='';
    if(rhoInput) rhoInput.value='';
  }
  if(productModalKeyHandler){
    document.removeEventListener('keydown', productModalKeyHandler);
    productModalKeyHandler=null;
  }
  productModalKeyHandler=(e)=>{
    if(e.key==='Escape'){
      e.preventDefault();
      closeProductModal();
    }
  };
  document.addEventListener('keydown', productModalKeyHandler);
  modal.classList.add('open');
  setTimeout(()=>{ try{ getProductNameInput()?.focus(); }catch(_){} }, 0);
}
function closeProductModal(){
  const modal=getProductModalElement();
  if(modal) modal.classList.remove('open');
  if(productModalKeyHandler){
    document.removeEventListener('keydown', productModalKeyHandler);
    productModalKeyHandler=null;
  }
}
function saveProductFromModal(event){
  if(event && typeof event.preventDefault==='function') event.preventDefault();
  const nameInput=getProductNameInput();
  let name=(nameInput?.value||'').trim();
  if(!name){ showToast('Укажите название груза', 'warn'); nameInput?.focus(); return; }
  const normalizedName=name.replace(/\s+/g,' ');
  if(normalizedName.length>80){ showToast('Название не должно превышать 80 символов', 'warn'); nameInput?.focus(); return; }
  const rhoInput=getProductRhoInput();
  const rhoStr=(rhoInput?.value||'').trim();
  const rho=parseFloat(rhoStr);
  if(!Number.isFinite(rho) || rho<=0){ showToast('Плотность должна быть >0 кг/л', 'warn'); rhoInput?.focus(); return; }
  const rhoRounded=Number(rho.toFixed(3));
  const key=addCustomProduct(normalizedName, rhoRounded);
  app.singleCargoTypeKey=key;
  app.singleCargoRho=rhoRounded;
  closeProductModal();
  applyProductSelectionAfterSave({ key, rho: rhoRounded });
  showToast('Груз сохранён');
}
function applyProductSelectionAfterSave(product){
  if(!product) return;
  app.lastLoadRequest=null;
  const key=product.key;
  const rhoVal=Number(product.rho);
  if(app.trailerState?.type==='tanker'){
    if(app.singleCargo){
      if(Number.isFinite(rhoVal) && rhoVal>0) app.singleCargoRho=rhoVal;
      applyGlobalCargoToRows();
      buildTankRows(app.trailerState);
    } else {
      const firstRow=app.trailerState.rows?.[0];
      if(firstRow){
        firstRow.typeKey=key;
        firstRow.rho=Number.isFinite(rhoVal)?rhoVal:firstRow.rho;
      }
      buildTankRows(app.trailerState);
    }
  }
  renderSingleCargoControls();
  recalc();
}

// ===== Axle calc
function syncAxleParamsFromTrailer(){
  const t = getAllTrailers().find(x=>x.id===app.selectedTrailerId);
  if(!t) return;
  if($('axTl_ax')) $('axTl_ax').value = t.axles || 3;
  if($('mp_ax'))   $('mp_ax').value   = t.tareKg || (t.axles===3?7300:7800);
  if($('LA_ax')) $('LA_ax').value = t.axles===3 ? 11800 : 12000;
  if($('LB_ax')) $('LB_ax').value = t.axles===3 ? 7400  : 7600;
  if($('LC_ax')) $('LC_ax').value = 4400;
  if($('NTpp_ax')) $('NTpp_ax').value = 2000;
}
function collectMassesAndPositions(){
  const LA = num($('LA_ax')?.value,12000);
  const tstate = app.trailerState; let kg=[], xs=[];
  if(!tstate) return {kg:[],xs:[]};
  if(tstate.type==='tanker'){
    const n=tstate.rows.length; for(let i=0;i<n;i++){ const row=tstate.rows[i]; const W=num((row.tons||0)*1000,0); const x=LA*(i+1)/(n+1); kg.push(W); xs.push(x); }
  } else {
    const n=tstate.masses.length; for(let i=0;i<n;i++){ const W=num(tstate.masses[i],0); const x=LA*(i+1)/(n+1); kg.push(W); xs.push(x); }
  }
  return {kg,xs};
}
function calcAxles(){
  const axTr=parseInt($('axTr_axle')?.value)||2; const axTl=parseInt($('axTl_ax')?.value)||3; const mT=8200;
  const LT=num($('LT_ax')?.value,3800), l2=num($('l2_ax')?.value,350), NT10=num($('NT10_ax')?.value,4200), NT20=num($('NT20_ax')?.value,4000);
  const mp=num($('mp_ax')?.value,7300), LA=num($('LA_ax')?.value,12000), LB=Math.max(1,num($('LB_ax')?.value,7600)), LC=num($('LC_ax')?.value,4400), NTpp=num($('NTpp_ax')?.value,2000);
  const {kg,xs}=collectMassesAndPositions();
  let Rk_sum=NTpp, Rb_sum=Math.max(0, mp-NTpp);
  for(let i=0;i<kg.length;i++){ const W=kg[i], x=xs[i]; const Rb=W*(x/LB); const Rk=W-Rb; Rk_sum+=Rk; Rb_sum+=Rb; }
  const R_front_from_pin=Rk_sum*(l2/LT), R_rear_from_pin=Rk_sum-R_front_from_pin;
  const Ax1=NT10+R_front_from_pin, Ax2_group=NT20+R_rear_from_pin;
  const perTrailerAxle=Rb_sum/axTl, perTractorRear=(axTr===3)?(Ax2_group/2):Ax2_group;
  const cargoSum=kg.reduce((a,b)=>a+b,0), G_total=mT+mp+cargoSum;
  if($('G_total_ax')) $('G_total_ax').textContent=(G_total/1000).toFixed(2)+' т';
  if($('Ax1_ax')) $('Ax1_ax').textContent=Math.round(Ax1).toLocaleString('ru-RU')+' кг';
  if($('Ax2_ax')) $('Ax2_ax').textContent=(axTr===3? `${Math.round(perTractorRear).toLocaleString('ru-RU')} кг × 2` : Math.round(Ax2_group).toLocaleString('ru-RU')+' кг');
  if($('AxTl_ax')) $('AxTl_ax').textContent=`${Math.round(Rb_sum).toLocaleString('ru-RU')} кг (≈ ${Math.round(perTrailerAxle).toLocaleString('ru-RU')} кг × ${axTl})`;
  const warn=[];
  if(Ax1>7500) warn.push('Передняя ось > 7.5 т');
  if(axTr===2 && Ax2_group>11500) warn.push('Задняя ось тягача > 11.5 т');
  if(axTr===3 && perTractorRear>11500) warn.push('Ось задней группы тягача > 11.5 т');
  if(perTrailerAxle>10000) warn.push('Ось тележки прицепа > 10 т');
  const w=$('axWarn_ax'); if(w){ if(warn.length){ w.style.display='block'; w.textContent='Проверь нормативы: '+warn.join('; ');} else { w.style.display='none'; } }
}
(function(){
  const ids=['LT_ax','l2_ax','NT10_ax','NT20_ax','mp_ax','LA_ax','LB_ax','LC_ax','NTpp_ax','axTr_axle'];
  ids.forEach(id=>{ const el=$(id); if(el) el.addEventListener('input', calcAxles); });
  const btn=$('recalcAxles'); if(btn) btn.addEventListener('click', calcAxles);
})();
const _recalc_orig=recalc; recalc=function(){ _recalc_orig(); calcAxles(); };
const _selectTrailer_orig=selectTrailer; selectTrailer=function(id){ _selectTrailer_orig(id); syncAxleParamsFromTrailer(); calcAxles(); };

// ===== Maps (Google / Yandex) =====
let _gmapsLoading=false, _gmapsLoaded=false, _ymapsLoading=false, _ymapsLoaded=false, _acFrom=null, _acTo=null, _fromPlaceId=null, _toPlaceId=null, _yaSuggestFrom=null, _yaSuggestTo=null;

function mapsApiKey(){
  return ($('mapsKey')?.value?.trim() || $('gmapsKey')?.value?.trim() || '');
}

function loadGoogleMaps(key){
  return new Promise((resolve,reject)=>{
    if(_gmapsLoaded){ resolve(); return; }
    if(_gmapsLoading){ const iv=setInterval(()=>{ if(_gmapsLoaded){ clearInterval(iv); resolve(); } }, 200); return; }
    if(!key) return reject(new Error('Укажите API key'));
    _gmapsLoading=true; const s=document.createElement('script'); s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`; s.async=true; s.defer=true; s.onload=()=>{ _gmapsLoaded=true; resolve(); }; s.onerror=()=>{ _gmapsLoading=false; reject(new Error('Не удалось загрузить Google Maps JS API')); }; document.head.appendChild(s);
  });
}
function ensureAutocompleteGoogle(){
  if(!_gmapsLoaded) return;
  if(!_acFrom){ _acFrom=new google.maps.places.Autocomplete($('routeFrom'), { types:['(cities)'] }); _acFrom.addListener('place_changed', ()=>{ const p=_acFrom.getPlace(); _fromPlaceId=p?.place_id||null; }); }
  if(!_acTo){ _acTo=new google.maps.places.Autocomplete($('routeTo'), { types:['(cities)'] }); _acTo.addListener('place_changed', ()=>{ const p=_acTo.getPlace(); _toPlaceId=p?.place_id||null; }); }
}
function routeGoogle(key, fromStr, toStr, avoidTolls, truckMode){
  return loadGoogleMaps(key).then(()=>{
    ensureAutocompleteGoogle();
    return new Promise((resolve,reject)=>{
      const svc=new google.maps.DirectionsService();
      const origin=_fromPlaceId? {placeId:_fromPlaceId} : fromStr;
      const destination=_toPlaceId? {placeId:_toPlaceId} : toStr;
      svc.route({ origin, destination, travelMode:google.maps.TravelMode.DRIVING, provideRouteAlternatives:false, avoidFerries:true, avoidTolls, avoidHighways:false }, (res,status)=>{
        if(status!=='OK') { reject(new Error('Directions error: '+status)); return; }
        try{
          const meters=res.routes[0].legs.reduce((s,leg)=>s+(leg.distance?.value||0),0); let km=meters/1000;
          if(truckMode) km *= 1.12; // поправка на грузовые ограничения (приблизительно)
          resolve(Math.round(km));
        }catch(e){ reject(new Error('Ошибка обработки маршрута')); }
      });
    });
  });
}

function loadYandexMaps(key){
  return new Promise((resolve,reject)=>{
    if(_ymapsLoaded){ resolve(); return; }
    if(_ymapsLoading){ const iv=setInterval(()=>{ if(_ymapsLoaded){ clearInterval(iv); resolve(); } }, 200); return; }
    if(!key) return reject(new Error('Укажите API key'));
    _ymapsLoading=true;
    const s=document.createElement('script');
    s.src=`https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
    s.onload=()=>{ ymaps.ready(()=>{ _ymapsLoaded=true; resolve(); }); };
    s.onerror=()=>{ _ymapsLoading=false; reject(new Error('Не удалось загрузить Яндекс.Карты JS API')); };
    document.head.appendChild(s);
  });
}
function ensureSuggestYandex(){
  if(!_ymapsLoaded) return;
  if(!_yaSuggestFrom) _yaSuggestFrom = new ymaps.SuggestView('routeFrom');
  if(!_yaSuggestTo) _yaSuggestTo = new ymaps.SuggestView('routeTo');
}
function routeYandex(key, fromStr, toStr, avoidTolls, truckMode){
  return loadYandexMaps(key).then(()=>{
    ensureSuggestYandex();
    return ymaps.route([fromStr, toStr], { avoidTrafficJams: false }).then(route=>{
      const len = route.getLength(); let km = len/1000;
      if(truckMode) km *= 1.12; // приблизительная поправка
      return Math.round(km);
    });
  });
}

function maybeInitMaps(){
  const isMaps = (app.distanceMode==='gmaps' || app.distanceMode==='maps');
  if(!isMaps) return;
  const key = mapsApiKey(); if(!key) return;
  const provider=$('provider')?.value || app.provider;
  if(provider==='google') loadGoogleMaps(key).then(ensureAutocompleteGoogle).catch(()=>{});
  else loadYandexMaps(key).then(ensureSuggestYandex).catch(()=>{});
}

function buildRoute(){
  const key=mapsApiKey();
  const fromStr=$('routeFrom')?.value?.trim();
  const toStr=$('routeTo')?.value?.trim();
  const avoidTolls=$('avoidTolls')?.checked;
  const truckMode=$('truckMode')?.checked;
  if(!fromStr||!toStr){ alert('Заполните поля Откуда и Куда'); return; }
  const provider=$('provider')?.value || app.provider || 'google';
  const runner = provider==='google' ? routeGoogle : routeYandex;
  runner(key, fromStr, toStr, avoidTolls, truckMode)
    .then(km=>{ if($('distanceKm')) $('distanceKm').value=String(km); app.distanceKm=km; saveState(); recalc(); })
    .catch(err=>alert(err.message||String(err)));
}

// ===== Tests (subset) =====
function runTests(){
  const out=$('testResults'); const results=[]; const approx=(a,b,e=2)=>Math.abs(a-b)<=e; const pass=n=>results.push(`<div class='pass'>✔ ${n}</div>`); const fail=(n,m='')=>results.push(`<div class='fail'>✘ ${n}${m?': '+m:''}</div>`);
  const backup=JSON.stringify(app);
  try{
    selectTrailer('MO0882_23');
    app.singleCargo=false;
    renderCurrent();
    let tb=$('tankBody'); let first=tb.querySelector('tr');
    first.querySelector('.selType').value='diesel'; first.querySelector('.inpRho').value='0.84';
    first.querySelector('.inpL').value='1000'; first.querySelector('.inpT').value=''; recalc();
    let tons=parseFloat(first.querySelector('.inpT').value); if(approx(tons,0.84,0.01)) pass('ρ: 1000 л ДТ → 0.84 т'); else fail('ρ прямой', `получили ${tons}`);
    first.querySelector('.inpT').value='1.2'; first.querySelector('.inpL').value=''; recalc();
    let l=parseInt(first.querySelector('.inpL').value); if(approx(l,1429,2)) pass('ρ: 1.2 т ДТ → ~1429 л'); else fail('ρ обратный', `получили ${l}`);

    selectTrailer('ER8977_23');
    if($('platformSection').style.display==='block' && $('tankSection').style.display==='none') pass('Площадка рендерится'); else fail('Площадка рендер');

    if($('distanceKm')) $('distanceKm').value='100';
    if($('ratePerKm')) $('ratePerKm').value='50';
    if($('trips')) $('trips').value='2'; 
    recalc();
    const costText=$('kpiCost')?.textContent?.replace(/\D+/g,''); if(parseInt(costText)===10000) pass('Стоимость вручную считается'); else fail('Стоимость вручную', $('kpiCost')?.textContent||'');
  }catch(e){ fail('Исключение тестов', e.message); }
  finally{ try{ app=JSON.parse(backup); renderCurrent(); }catch(_){} }
  if(out) out.innerHTML=results.join('');
}

// ===== Boot =====
function boot(){
  loadState();
  if (app.distanceMode === 'gmaps') app.distanceMode = 'maps';

  const trailers=getAllTrailers();
  if(trailers.length){
    if(!app.selectedTrailerId || !trailers.some(t=>t.id===app.selectedTrailerId)){
      app.selectedTrailerId=trailers[0].id;
    }
  }

  const trucks=getAllTrucks();
  if(trucks.length){
    if(!app.tractorPlate || !trucks.includes(app.tractorPlate)){
      app.tractorPlate=trucks[0];
    }
  }

  selectTrailer(app.selectedTrailerId);
  bind();
  maybeInitMaps();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
