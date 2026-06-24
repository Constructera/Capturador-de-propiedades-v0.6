/* ============================================================
   Capturador de propiedades — Hauser / Inmobitera
   app.js  ·  v0.6 (Capturadora Hauser — Código auto-Notion, Ambas=Venta en Notion, rentas/comisiones)
   ============================================================ */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};

/* ---------- config local ---------- */
var GAS_DEFAULT='https://script.google.com/macros/s/AKfycbwz6hm5MtyZdkaGXNpxi-AVJlCZvLntyMHGe055bsyrBubI862il09AR_CQmejfYu9p/exec';
var CFG=load('cfg',{resp:'Daniel',drive:'Hauser Propiedades',endpoint:GAS_DEFAULT});
if(!CFG.endpoint)CFG.endpoint=GAS_DEFAULT; // migrar instancias sin endpoint
function load(k,def){try{var v=localStorage.getItem('cap_'+k);return v?JSON.parse(v):def;}catch(e){return def;}}
function save(k,v){try{localStorage.setItem('cap_'+k,JSON.stringify(v));}catch(e){}}

/* zonas conocidas: semilla + las que se agreguen/usen */
var ZONAS_SEED=['Lomas de Cortés','Rancho Tetela','Nueva Francia','Domingo Diez / Gayosso','Compositores','Lomas de Atzingo','Vista Hermosa','Tabachines','Burgos','Burgos Bugambilias','Sumiya','Real de Tetela','Acapantzingo','Delicias','Palmira'];
var zonasLocal=load('zonas',[]);
function zonasAll(){
  var map={};
  ZONAS_SEED.forEach(function(z){map[z]={n:z,uses:0};});
  zonasLocal.forEach(function(z){map[z.n]=z;});
  return Object.keys(map).map(function(k){return map[k];});
}
function zonaTouch(n){
  if(!n||n==='S/I')return;
  var found=zonasLocal.filter(function(z){return z.n===n;})[0];
  if(found){found.uses=(found.uses||0)+1;found.last=Date.now();}
  else zonasLocal.push({n:n,uses:1,last:Date.now(),nueva:ZONAS_SEED.indexOf(n)===-1});
  save('zonas',zonasLocal);
}

var state={tipo:'',oper:'Venta',ofrece:'',crm:'No',modo:'A · Reventa de lote',
  madre:'No, solo individuales',driveShare:'Sí, carpeta común',
  serv:[],caract:[],caractTerr:[],lat:null,lng:null,
  people:[],editId:null,rentaMin:''};

var hoy=new Date().toISOString().slice(0,10);
$('f_fecha').value=hoy;$('f_seguimiento').value=hoy;
$('f_resp').value=CFG.resp;
$('cfg_resp').value=CFG.resp;$('cfg_drive').value=CFG.drive;$('cfg_endpoint').value=CFG.endpoint;save('cfg',CFG);

/* ===================== NAVEGACIÓN ===================== */
// Un solo listener cubre navbar, tarjetas del menú y botones "← Menú"
document.addEventListener('click',function(e){
  var b=e.target.closest('button[data-view]');if(!b)return;
  showView(b.dataset.view);
});
function showView(id){
  // mascota: reset al salir de viewResult
  if(id!=='viewResult'){var vr=$('viewResult');if(vr&&vr.classList.contains('active')){id==='viewCapture'?updateTimerUI():setMascotState('idle');}}
  document.querySelectorAll('.view').forEach(function(v){v.classList.toggle('active',v.id===id);});
  document.querySelectorAll('#navbar button').forEach(function(b){b.classList.toggle('active',b.dataset.view===id);});
  window.scrollTo(0,0);
  if(id==='viewHistory')renderHist();
  if(id==='viewConfig')renderCfgCount();
  if(id==='viewAdvisor')renderAsesorGrid();
  if(id==='viewLeaderboard')renderRanking();
  if(id==='viewContact'){renderCtHist();if(asesorActivo&&$('ct_asesor'))$('ct_asesor').value=asesorActivo.nombre||CFG.resp||'';}
}

/* ===================== MÓDULO DE ASESORES ===================== */
var ASESORES_SEED=[
  {id:'as_daniel',nombre:'Daniel'},
  {id:'as_erica',nombre:'Erica'},
  {id:'as_carlos',nombre:'Carlos'},
  {id:'as_gabriel',nombre:'Gabriel'}
];
var asesoresLocal=(function(){
  var s=load('asesores',null);if(!s){save('asesores',ASESORES_SEED);return ASESORES_SEED;}
  return s;
})();
var asesorActivo=load('asesor_activo',null);

function getAsesores(){return load('asesores',ASESORES_SEED);}
function saveAsesores(arr){asesoresLocal=arr;save('asesores',arr);}

function poblarSelectResp(){
  var lista=getAsesores();
  ['f_resp','cfg_resp'].forEach(function(sid){
    var sel=$(sid);if(!sel)return;
    var cur=sel.value;sel.innerHTML='';
    lista.forEach(function(a){
      var opt=document.createElement('option');opt.value=a.nombre;opt.textContent=a.nombre;sel.appendChild(opt);
    });
    if(cur&&Array.prototype.some.call(sel.options,function(o){return o.value===cur;}))sel.value=cur;
  });
}

function syncAsesor(){
  if(!asesorActivo)return;
  poblarSelectResp();
  $('f_resp').value=asesorActivo.nombre;
  if($('cfg_resp'))$('cfg_resp').value=asesorActivo.nombre;
  CFG.resp=asesorActivo.nombre;save('cfg',CFG);
  var badge=$('asesorBadge');
  if(badge)badge.textContent='👤 '+asesorActivo.nombre;
}

poblarSelectResp();
if(asesorActivo)syncAsesor();

function renderAsesorGrid(){
  var grid=$('asesorGrid');if(!grid)return;
  grid.innerHTML='';
  var lista=getAsesores();
  lista.forEach(function(a){
    var card=document.createElement('button');card.type='button';card.className='home-card';
    if(asesorActivo&&asesorActivo.id===a.id)card.classList.add('asesor-sel');
    var init=a.nombre.split(' ').map(function(p){return p[0];}).join('').toUpperCase().slice(0,2);
    card.innerHTML='<span class="asesor-avatar">'+init+'</span><span class="home-label">'+a.nombre+'</span>';
    card.addEventListener('click',function(){
      asesorActivo=a;save('asesor_activo',a);
      grid.querySelectorAll('.home-card').forEach(function(c){c.classList.remove('asesor-sel');});
      card.classList.add('asesor-sel');
      $('btnEmpezarCaptura').disabled=false;
      syncAsesor();
    });
    grid.appendChild(card);
  });
  $('btnEmpezarCaptura').disabled=!asesorActivo;
}
$('btnEmpezarCaptura').addEventListener('click',function(){resetTimerToReady();showView('viewCapture');});
$('btnAgregarAsesor').addEventListener('click',function(){
  var nombre=prompt('Nombre del nuevo asesor:');
  if(!nombre||!nombre.trim())return;
  nombre=nombre.trim();
  var lista=getAsesores();
  if(lista.some(function(a){return a.nombre.toLowerCase()===nombre.toLowerCase();})){
    alert('Ya existe un asesor con ese nombre.');return;
  }
  var nuevo={id:'as'+Date.now(),nombre:nombre};
  lista.push(nuevo);saveAsesores(lista);
  asesorActivo=nuevo;save('asesor_activo',nuevo);
  renderAsesorGrid();syncAsesor();
  $('btnEmpezarCaptura').disabled=false;
});

/* ===================== MÓDULO DE TEMPORIZADOR + MASCOTA ===================== */
var TIMER_C=2*Math.PI*54;           // circunferencia anillo SVG (r=54) = 339.29
var timerLimit=load('cfg_timer_limit',600);
var timerState='ready';             // 'ready'|'running'|'paused'|'expired'
var timerRemaining=timerLimit;
var timerElapsed=0;
var timerInterval=null;
var timerStartedAt=null;
var timerWasPaused=false;
var timerPauseCount=0;

function timerFmt(s){
  var m=Math.floor(s/60),sc=s%60;
  return(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;
}
function setTimerArc(rem,lim){
  var arc=$('timerArc');if(!arc)return;
  var pct=lim>0?rem/lim:0;
  arc.style.strokeDashoffset=TIMER_C*(1-Math.max(0,Math.min(1,pct)));
}
function setMascotState(st){
  var svg=$('mascotSvg');if(!svg)return;
  svg.setAttribute('class','mascot state-'+st);
}
function updateTimerUI(){
  var d=$('timerDisplay');if(d)d.textContent=timerFmt(timerRemaining);
  setTimerArc(timerRemaining,timerLimit);
  var ts;
  if(timerState==='ready'){ts='ready';}
  else if(timerState==='expired'){ts='expired';}
  else if(timerRemaining>300){ts='happy';}
  else if(timerRemaining>120){ts='focused';}
  else{ts='urgent';}
  // Sonidos en transiciones de estado del temporizador
  if(timerState==='running'){
    if(ts==='focused'&&_timerAudioTs==='happy')sndStep();
    else if(ts==='urgent'&&_timerAudioTs==='focused')sndUrgent();
  }
  if(timerState==='expired'&&_timerAudioTs!=='expired')sndTimeout();
  if(ts!=='ready')_timerAudioTs=ts;else _timerAudioTs='ready';
  var w=$('timerWidget');
  if(w){
    w.className='timer-widget'+(timerState!=='ready'?' running':'');
    if(ts!=='ready')w.classList.add('state-'+ts);
  }
  var MSGS={
    happy:'Vas bien. 💪',
    focused:'Quedan 5 min o menos. ⚡',
    urgent:'¡Últimos 2 minutos! 🔥',
    expired:'Tiempo agotado — igualmente puedes terminar.'
  };
  var msgEl=$('timerMsg');if(msgEl&&ts!=='ready')msgEl.textContent=MSGS[ts]||'';
  var MAS={ready:'idle',happy:'dancing',focused:'focused',urgent:'angry',expired:'sad'};
  setMascotState(MAS[ts]||'idle');
}
function startTimer(){
  if(timerState==='running')return;
  timerState='running';timerRemaining=timerLimit;timerElapsed=0;
  timerStartedAt=Date.now();timerWasPaused=false;timerPauseCount=0;
  _timerAudioTs='happy';sndStep();
  var rw=$('timerRingWrap');if(rw)rw.style.display='flex';
  var rc=$('timerRunningCtrl');if(rc)rc.style.display='';
  var rd=$('timerReadyCtrl');if(rd)rd.style.display='none';
  var pb=$('btnPausarTimer');if(pb)pb.textContent='⏸ Pausar';
  updateTimerUI();
  timerInterval=setInterval(function(){
    if(timerState!=='running')return;
    timerElapsed++;timerRemaining=Math.max(0,timerLimit-timerElapsed);
    updateTimerUI();
    if(timerRemaining===0){timerState='expired';clearInterval(timerInterval);timerInterval=null;}
  },1000);
}
function pauseTimer(){
  if(timerState!=='running')return;
  timerState='paused';timerWasPaused=true;timerPauseCount++;
  clearInterval(timerInterval);timerInterval=null;
  var pb=$('btnPausarTimer');if(pb)pb.textContent='▶ Reanudar';
}
function resumeTimer(){
  if(timerState!=='paused')return;
  timerState='running';
  timerInterval=setInterval(function(){
    if(timerState!=='running')return;
    timerElapsed++;timerRemaining=Math.max(0,timerLimit-timerElapsed);
    updateTimerUI();
    if(timerRemaining===0){timerState='expired';clearInterval(timerInterval);timerInterval=null;}
  },1000);
  var pb=$('btnPausarTimer');if(pb)pb.textContent='⏸ Pausar';
}
function resetTimerToReady(){
  clearInterval(timerInterval);timerInterval=null;
  timerState='ready';timerRemaining=timerLimit;timerElapsed=0;
  timerWasPaused=false;timerPauseCount=0;
  var rw=$('timerRingWrap');if(rw)rw.style.display='none';
  var rc=$('timerRunningCtrl');if(rc)rc.style.display='none';
  var rd=$('timerReadyCtrl');if(rd)rd.style.display='';
  var w=$('timerWidget');if(w)w.className='timer-widget';
  var d=$('timerDisplay');if(d)d.textContent=timerFmt(timerLimit);
  setTimerArc(1,1);
  _timerAudioTs='ready';
  setMascotState('idle');
}
// inicializar display y chip según preferencia guardada
(function(){
  var d=$('timerDisplay');if(d)d.textContent=timerFmt(timerLimit);
  var savedMin=timerLimit/60;
  var tc=$('timeChips');if(!tc)return;
  tc.querySelectorAll('.chip').forEach(function(c){
    c.classList.toggle('sel',parseInt(c.dataset.min)===savedMin);
  });
})();
$('timeChips').addEventListener('click',function(e){
  var c=e.target.closest('.chip');if(!c||!c.dataset.min)return;
  this.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');});
  c.classList.add('sel');
  timerLimit=parseInt(c.dataset.min)*60;
  save('cfg_timer_limit',timerLimit);
  if(timerState==='ready'){var d=$('timerDisplay');if(d)d.textContent=timerFmt(timerLimit);}
});
$('btnIniciarCaptura').addEventListener('click',function(){
  startTimer();
  window.scrollTo({top:0,behavior:'smooth'});
});
$('btnPausarTimer').addEventListener('click',function(){
  if(timerState==='running')pauseTimer();
  else if(timerState==='paused')resumeTimer();
});

/* ===================== MÓDULO DE SONIDOS — FASE 4 ===================== */
var sndCfg=load('cfg_sounds',{on:true,vol:0.6});
var _audioCtx=null;
var _timerAudioTs='ready';

function _getAudioCtx(){
  if(!_audioCtx){try{_audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(_audioCtx.state==='suspended')_audioCtx.resume();
  return _audioCtx;
}
function _tone(freq,dur,type,vol,at){
  var ctx=_getAudioCtx();if(!ctx)return;
  var t=at!=null?at:ctx.currentTime;
  var v=Math.max(0.001,Math.min(1,(vol!=null?vol:1)*sndCfg.vol));
  var osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(ctx.destination);
  osc.type=type||'sine';
  osc.frequency.setValueAtTime(freq,t);
  gain.gain.setValueAtTime(v,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
  osc.start(t);osc.stop(t+dur+0.02);
}
function sndClick(){if(!sndCfg.on)return;_tone(660,0.06,'sine',0.4);}
function sndChip(){if(!sndCfg.on)return;_tone(880,0.05,'sine',0.35);}
function sndStep(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;_tone(523,0.09,'sine',0.5,t);_tone(784,0.12,'sine',0.55,t+0.07);
}
function sndError(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;_tone(280,0.12,'sawtooth',0.28,t);_tone(220,0.18,'sawtooth',0.28,t+0.1);
}
function sndStar(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  [523,659,784,1047].forEach(function(f,i){_tone(f,i<3?0.07:0.15,'sine',0.6,t+i*0.065);});
}
function sndSuccess(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  [523,659,784,1047,784,1047].forEach(function(f,i){_tone(f,i<5?0.08:0.28,'sine',0.65,t+i*0.075);});
}
function sndTimeout(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  [440,330,220].forEach(function(f,i){_tone(f,i<2?0.15:0.28,'triangle',0.5,t+i*0.13);});
}
function sndUrgent(){
  if(!sndCfg.on)return;var ctx=_getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;_tone(330,0.07,'square',0.2,t);_tone(330,0.07,'square',0.2,t+0.1);
}
// Hooks globales: chip → sndChip, botones/tarjetas → sndClick
document.addEventListener('click',function(e){
  if(!sndCfg.on)return;
  if(e.target.closest('.chip')){sndChip();return;}
  var b=e.target.closest('.btn,.home-card,.btn-back,.close-x');
  if(b&&!b.disabled&&!b.hasAttribute('disabled'))sndClick();
});

/* ===================== CHIPS ===================== */
function bindChips(gid,key,cb){
  var el=$(gid);if(!el)return;
  el.addEventListener('click',function(e){
    var c=e.target.closest('.chip');if(!c)return;
    el.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');});
    c.classList.add('sel');state[key]=c.dataset.v;
    if(cb)cb(c.dataset.v);updateProgress();
  });
}
function setChip(gid,key,val,cb){
  var found=null;
  $(gid).querySelectorAll('.chip').forEach(function(x){
    x.classList.toggle('sel',x.dataset.v===val);
    if(x.dataset.v===val)found=x;
  });
  if(found){state[key]=val;if(cb)cb(val);}
}
function onTipo(v){
  var t=(v==='Terreno');
  document.querySelectorAll('[data-construccion]').forEach(function(el){el.style.display=t?'none':'';});
  $('terrenoExtra').style.display=t?'':'none';
  buildCaract();refreshUnits();refreshDrive();
}
function onOper(v){
  var venta=(v==='Venta'||v==='Venta y Renta');
  var renta=(v==='Renta'||v==='Venta y Renta');
  var soloRenta=(v==='Renta');
  $('rowPrecioVenta').style.display=venta?'':'none';
  $('rowPrecioRenta').style.display=renta?'':'none';
  $('rowRentaMin').style.display=renta?'':'none';
  $('rowComisionVenta').style.display=venta?'':'none';
  $('rowComisionRenta').style.display=renta?'':'none';
  if(soloRenta&&!naOn('f_m2t')&&!siOn('f_m2t')&&!$('f_m2t').value.trim()){setNaState('f_m2t',true);_m2tAutoNA=true;}
  else if(!soloRenta&&_m2tAutoNA){setNaState('f_m2t',false);_m2tAutoNA=false;}
  autoFillComisionRenta();
}
bindChips('tipoChips','tipo',onTipo);
bindChips('operChips','oper',onOper);
bindChips('ofreceChips','ofrece',onOfrece);
bindChips('crmChips','crm',function(v){renderCRM();});
bindChips('modoChips','modo');
bindChips('madreChips','madre');
bindChips('driveShareChips','driveShare');
bindChips('rentaMinChips','rentaMin');

/* servicios multi-select */
$('servChips').addEventListener('click',function(e){
  var c=e.target.closest('.chip');if(!c)return;
  c.classList.toggle('sel');var v=c.dataset.v;
  if(c.classList.contains('sel'))state.serv.push(v);
  else state.serv=state.serv.filter(function(x){return x!==v;});
  updateProgress();
});

/* ===================== ¿QUIÉN OFRECE? → CRM ===================== */
function onOfrece(v){
  // sembrar una persona-base según quién ofrece
  var roleMap={
    'Propietario directo':'Propietario (B)',
    'Asesor / broker':'Asesor inmobiliario',
    'Socio inmobiliario':'Socio inmobiliario',
    'Desarrollador':'Desarrollador',
    'Referido':'Referido'
  };
  // quitar la persona auto previa (marcada con auto:true y no editada)
  state.people=state.people.filter(function(p){return !(p.auto&&!p.touched);});
  if(roleMap[v]){
    state.people.unshift({id:'p'+Date.now(),nombre:'',rol:roleMap[v],tel:'',auto:true,touched:false});
  }
  renderCRM();
}

/* ===================== CRM dinámico ===================== */
var ROLES=['Cliente A (comprador)','Cliente B (propietario/vendedor)','Asesor inmobiliario','Broker','Socio inmobiliario','Desarrollador','Referido','Otro'];
function renderCRM(){
  var wrap=$('crmCards');wrap.innerHTML='';
  // si CRM = Sí y no hay comprador, sembrar uno
  if(state.crm==='Sí' && !state.people.some(function(p){return /Cliente A/.test(p.rol);})){
    state.people.push({id:'pc'+Date.now(),nombre:'',rol:'Cliente A (comprador)',tel:'',auto:true,touched:false});
  }
  state.people.forEach(function(p){
    var card=document.createElement('div');card.className='person-card';
    var dataState=(p.nombre||p.tel)?'ok':'';
    var stTxt=(p.nombre||p.tel)?'Datos capturados':'Faltan datos';
    card.innerHTML='<div class="pc-top"><div><div class="pc-name">'+(p.nombre||'(sin nombre)')+'</div>'+
      '<div class="pc-role">'+p.rol+(p.tel?(' · '+p.tel):'')+'</div></div>'+
      '<span class="pc-state '+dataState+'">'+stTxt+'</span></div>'+
      '<div class="btn-row"><button type="button" class="btn chip-sm" data-edit="'+p.id+'">Completar datos</button>'+
      '<button type="button" class="btn chip-sm btn-danger" data-del="'+p.id+'">Quitar</button></div>';
    wrap.appendChild(card);
  });
  var add=document.createElement('button');
  add.type='button';add.className='btn chip-sm';add.textContent='+ Agregar persona';
  add.style.marginTop='12px';
  add.addEventListener('click',function(){openPerson(null);});
  wrap.appendChild(add);
}
$('crmCards').addEventListener('click',function(e){
  var ed=e.target.closest('[data-edit]');var dl=e.target.closest('[data-del]');
  if(ed)openPerson(ed.dataset.edit);
  if(dl){state.people=state.people.filter(function(p){return p.id!==dl.dataset.del;});renderCRM();}
});

function openPerson(id){
  var p=id?state.people.filter(function(x){return x.id===id;})[0]:null;
  var isNew=!p;
  if(isNew)p={id:'p'+Date.now(),rol:'Otro'};
  state.editId=p.id;state._editIsNew=isNew;state._editTmp=Object.assign({},p);
  $('personTitle').textContent=p.nombre?('Datos de '+p.nombre):'Completar datos';
  var f=[
    ['nombre','Nombre completo','text'],
    ['rol','Tipo de contacto','select',ROLES],
    ['empresa','Empresa / inmobiliaria','text'],
    ['puesto','Puesto / rol','text'],
    ['tel','Teléfono','tel'],
    ['wa','WhatsApp','tel'],
    ['email','Correo','email'],
    ['fuente','Fuente del contacto','text'],
    ['relacion','Relación con la propiedad','text'],
    ['acuerdo','Acuerdo comercial','text','Ej. exclusiva 3 meses, comisión al cierre, sin exclusiva'],
    ['comision','Comisión','select',['S/I','0.5%','1%','2%','3%','4%','5%','6%','7%']],
    ['zonaOp','Zona de operación','text'],
    ['zonaInt','Zona de interés','text'],
    ['presupuesto','Presupuesto (si compra)','text'],
    ['busca','Tipo de propiedad que busca','text'],
    ['urgencia','Urgencia','select',['S/I','Baja','Media','Alta']],
    ['confianza','Nivel de confianza','select',['S/I','Bajo','Medio','Alto']],
    ['estatus','Estatus del contacto','select',['Nuevo','En seguimiento','Cliente activo','Cerrado']],
    ['notas','Notas internas','textarea'],
    ['prox','Próxima acción','text'],
    ['fechaSeg','Fecha de seguimiento','date']
  ];
  var html='';
  f.forEach(function(fl){
    var key=fl[0],lab=fl[1],typ=fl[2],opts=fl[3];
    var val=p[key]!=null?p[key]:'';
    html+='<div class="field"><div class="field-top"><label>'+lab+'</label></div>';
    if(typ==='select'){
      html+='<select data-k="'+key+'">'+opts.map(function(o){return '<option'+(o===val?' selected':'')+'>'+o+'</option>';}).join('')+'</select>';
    }else if(typ==='textarea'){
      html+='<textarea data-k="'+key+'">'+esc(val)+'</textarea>';
    }else{
      html+='<input type="'+typ+'" data-k="'+key+'" placeholder="'+esc(opts||'')+'" value="'+esc(val)+'">';
    }
    html+='</div>';
  });
  $('personBody').innerHTML=html;
  $('personOverlay').classList.add('show');
}
function esc(s){return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;');}
$('personClose').addEventListener('click',closePerson);
$('personCancel').addEventListener('click',closePerson);
function closePerson(){$('personOverlay').classList.remove('show');state.editId=null;}
$('personSave').addEventListener('click',function(){
  var p=state._editTmp;
  $('personBody').querySelectorAll('[data-k]').forEach(function(el){p[el.dataset.k]=el.value.trim();});
  p.touched=true;p.auto=false;
  if(state._editIsNew)state.people.push(p);
  else state.people=state.people.map(function(x){return x.id===p.id?p:x;});
  closePerson();renderCRM();
});

/* ===================== CARACTERÍSTICAS por tipo ===================== */
var CAR_CASA=['Alberca','Terraza','Jardín','Seguridad','Roof garden','Bodega','Cuarto de servicio','Estudio','Cocina integral','Vista','Una sola planta','En condominio','Nueva','En construcción','Para remodelar','Áreas comunes','Cisterna','Paneles solares','Amueblada','Acepta mascotas','Elevador','Clóset vestidor'];
var CAR_TERR=['Plano','Con pendiente','Con vista','Bardeado','Servicios','Agua','Luz','Drenaje','Calle pavimentada','Uso habitacional','Potencial de desarrollo','Para inversión','Escrituras','Cesión de derechos','Frente amplio','Irregular','Regular','Esquina'];
var CAR_LOCAL=['Sobre avenida','Alto flujo','Estacionamiento','Doble altura','Bodega','Baños','Seguridad','Acceso de carga','Uso comercial','Frente visible','Cortina','Área de maniobra'];
function poolFor(){
  if(state.tipo==='Terreno')return CAR_TERR;
  if(['Local comercial','Oficina','Bodega'].indexOf(state.tipo)!==-1)return CAR_LOCAL;
  return CAR_CASA;
}
var carShown=6;
function buildCaract(){carShown=6;renderCaract();}
function renderCaract(){
  // tags seleccionados
  var tags=$('caractTags');tags.innerHTML='';
  state.caract.forEach(function(c){
    var t=document.createElement('span');t.className='tag';t.appendChild(document.createTextNode(c));
    var x=document.createElement('button');x.type='button';x.textContent='✕';
    x.addEventListener('click',function(){state.caract=state.caract.filter(function(v){return v!==c;});renderCaract();});
    t.appendChild(x);tags.appendChild(t);
  });
  // chips sugeridos (los del pool no seleccionados)
  var pool=poolFor().filter(function(c){return state.caract.indexOf(c)===-1;});
  var chips=$('caractChips');chips.innerHTML='';
  pool.slice(0,carShown).forEach(function(c){
    var b=document.createElement('button');b.type='button';b.className='chip chip-sm';b.textContent=c;
    b.addEventListener('click',function(){state.caract.push(c);renderCaract();updateProgress();});
    chips.appendChild(b);
  });
}
function addCaract(c){if(c&&state.caract.indexOf(c)===-1){state.caract.push(c);renderCaract();}}
$('btnCaractMas').addEventListener('click',function(){carShown+=6;renderCaract();});
$('btnCaractRefresh').addEventListener('click',function(){carShown=6;renderCaract();});
$('f_caract_buscar').addEventListener('keydown',function(e){
  if(e.key==='Enter'){e.preventDefault();var v=this.value.trim();if(v){addCaract(v);this.value='';updateProgress();}}
});
$('f_caract_buscar').addEventListener('input',function(){
  var q=this.value.trim().toLowerCase();if(!q){renderCaract();return;}
  var pool=poolFor().filter(function(c){return state.caract.indexOf(c)===-1 && c.toLowerCase().indexOf(q)!==-1;});
  var chips=$('caractChips');chips.innerHTML='';
  pool.forEach(function(c){
    var b=document.createElement('button');b.type='button';b.className='chip chip-sm';b.textContent=c;
    b.addEventListener('click',function(){addCaract(c);$('f_caract_buscar').value='';updateProgress();});
    chips.appendChild(b);
  });
});

/* características de terreno (sección aparte) */
var carTerrShown=8;
function renderCaractTerr(){
  var tags=$('caractTerrTags');tags.innerHTML='';
  state.caractTerr.forEach(function(c){
    var t=document.createElement('span');t.className='tag';t.appendChild(document.createTextNode(c));
    var x=document.createElement('button');x.type='button';x.textContent='✕';
    x.addEventListener('click',function(){state.caractTerr=state.caractTerr.filter(function(v){return v!==c;});renderCaractTerr();});
    t.appendChild(x);tags.appendChild(t);
  });
  var pool=CAR_TERR.filter(function(c){return state.caractTerr.indexOf(c)===-1;});
  var chips=$('caractTerrChips');chips.innerHTML='';
  pool.slice(0,carTerrShown).forEach(function(c){
    var b=document.createElement('button');b.type='button';b.className='chip chip-sm';b.textContent=c;
    b.addEventListener('click',function(){state.caractTerr.push(c);renderCaractTerr();});
    chips.appendChild(b);
  });
}
$('btnCaractTerrMas').addEventListener('click',function(){carTerrShown+=8;renderCaractTerr();});
renderCaract();renderCaractTerr();renderCRM();

/* ===================== S/I + N/A ===================== */
document.querySelectorAll('.si-btn').forEach(function(b){
  b.addEventListener('click',function(){
    var inp=$(b.dataset.for);var on=!b.classList.contains('active');
    var naB=document.querySelector('.na-btn[data-for-na="'+b.dataset.for+'"]');
    if(naB&&on)naB.classList.remove('active');
    b.classList.toggle('active',on);inp.disabled=on;if(on)inp.value='';
    updateProgress();
  });
});
function siOn(id){var b=document.querySelector('.si-btn[data-for="'+id+'"]');return !!(b&&b.classList.contains('active'));}

/* Insertar botones N/A dinámicamente junto a cada S/I */
document.querySelectorAll('.si-btn').forEach(function(siBtn){
  var naBtn=document.createElement('button');
  naBtn.type='button';naBtn.className='na-btn';naBtn.dataset.forNa=siBtn.dataset.for;naBtn.textContent='N/A';
  siBtn.parentNode.insertBefore(naBtn,siBtn.nextSibling);
  naBtn.addEventListener('click',function(){
    var id=naBtn.dataset.forNa;var inp=$(id);var on=!naBtn.classList.contains('active');
    var siB=document.querySelector('.si-btn[data-for="'+id+'"]');
    if(siB&&on)siB.classList.remove('active');
    naBtn.classList.toggle('active',on);inp.disabled=on;if(on)inp.value='';
    updateProgress();
  });
});
function naOn(id){var b=document.querySelector('.na-btn[data-for-na="'+id+'"]');return !!(b&&b.classList.contains('active'));}

var _m2tAutoNA=false;
function setNaState(id,on){
  var naB=document.querySelector('.na-btn[data-for-na="'+id+'"]');
  var siB=document.querySelector('.si-btn[data-for="'+id+'"]');
  var inp=$(id);if(!naB||!inp)return;
  if(on){if(siB)siB.classList.remove('active');naB.classList.add('active');inp.disabled=true;inp.value='';
    var normId='n_'+id.replace('f_','');var nm=$(normId);if(nm)nm.textContent='';}
  else{naB.classList.remove('active');inp.disabled=false;}
  updateProgress();
}
function autoFillComisionRenta(){
  var inp=$('f_comision_renta');if(!inp||inp.getAttribute('data-manual')==='true')return;
  var rv=numVal('f_precio_renta');
  inp.value=rv!=null?(fmt(rv)+' MXN'):'';
}

/* ===================== ZONA inteligente (multi-select) ===================== */
var zonasSel=[];  // [{n:'Nombre', nueva:bool}, ...]
var zonaTimer=null;
$('f_zona').addEventListener('focus',function(){renderZonaSuggest('');});
$('f_zona').addEventListener('input',function(){
  clearTimeout(zonaTimer);
  var q=this.value;
  zonaTimer=setTimeout(function(){renderZonaSuggest(q);},120);
});
$('f_zona').addEventListener('blur',function(){setTimeout(function(){$('zonaSuggest').style.display='none';},200);});
$('f_zona').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&this.value.trim()){
    e.preventDefault();
    var v=this.value.trim();
    var isNueva=zonasAll().every(function(x){return x.n.toLowerCase()!==v.toLowerCase();});
    pickZona(v,isNueva);
  }
});
function renderZonasTags(){
  var tags=$('zonasTags');tags.innerHTML='';
  zonasSel.forEach(function(z){
    var t=document.createElement('span');t.className='tag';
    t.appendChild(document.createTextNode(z.n+(z.nueva?' ✦':'')));
    var x=document.createElement('button');x.type='button';x.textContent='✕';
    x.addEventListener('click',function(){
      zonasSel=zonasSel.filter(function(zz){return zz.n!==z.n;});
      renderZonasTags();updateHintZona();updateProgress();refreshDrive();
    });
    t.appendChild(x);tags.appendChild(t);
  });
}
function updateHintZona(){
  var nuevas=zonasSel.filter(function(z){return z.nueva;});
  $('zonaHint').textContent=nuevas.length?'Zonas nuevas (✦): el markdown instruirá crearlas en 📍 Zonas.':'';
}
function renderZonaSuggest(q){
  var box=$('zonaSuggest');box.innerHTML='';
  var all=zonasAll();
  var qn=q.trim().toLowerCase();
  var matches;
  if(!qn){
    matches=all.sort(function(a,b){return (b.uses||0)-(a.uses||0);}).slice(0,6);
  }else{
    matches=all.filter(function(z){return z.n.toLowerCase().indexOf(qn)!==-1;}).slice(0,8);
  }
  matches=matches.filter(function(z){return !zonasSel.some(function(s){return s.n===z.n;});});
  matches.forEach(function(z){
    var d=document.createElement('div');
    d.textContent=z.n+(z.uses?(' · '+z.uses+' uso(s)'):'');
    d.addEventListener('mousedown',function(e){e.preventDefault();pickZona(z.n,false);});
    box.appendChild(d);
  });
  var exact=all.some(function(z){return z.n.toLowerCase()===qn;});
  if(qn && !exact){
    var add=document.createElement('div');add.className='add-new';
    add.textContent='+ Agregar zona nueva: '+q.trim();
    add.addEventListener('mousedown',function(e){e.preventDefault();pickZona(q.trim(),true);});
    box.appendChild(add);
  }
  box.style.display=box.children.length?'block':'none';
}
function pickZona(n,nueva){
  if(!n)return;
  if(zonasSel.some(function(z){return z.n===n;}))return;
  zonasSel.push({n:n,nueva:nueva});
  $('f_zona').value='';$('zonaSuggest').style.display='none';
  renderZonasTags();updateHintZona();updateProgress();refreshDrive();
}
function zonaVal(){return zonasSel.length?zonasSel[0].n:'S/I';}

/* ===================== FUENTE otra ===================== */
$('f_fuente').addEventListener('change',function(){
  $('boxFuenteOtra').style.display=(this.value==='__otra')?'':'none';
});
function fuenteVal(){
  if($('f_fuente').value==='__otra'){var v=$('f_fuente_otra').value.trim();return{nombre:v||'S/I',nueva:!!v};}
  return{nombre:$('f_fuente').value,nueva:false};
}

/* ===================== ESTATUS auto ===================== */
$('f_estatus').addEventListener('change',function(){
  $('estatusHint').textContent='';
});

/* ===================== NORMALIZADOR ES ===================== */
var UNI={'cero':0,'un':1,'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9,'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,'quince':15,'dieciseis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,'veinte':20,'veintiun':21,'veintiuno':21,'veintidos':22,'veintitres':23,'veinticuatro':24,'veinticinco':25,'veintiseis':26,'veintisiete':27,'veintiocho':28,'veintinueve':29,'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,'noventa':90,'cien':100,'ciento':100,'doscientos':200,'trescientos':300,'cuatrocientos':400,'quinientos':500,'seiscientos':600,'setecientos':700,'ochocientos':800,'novecientos':900,'medio':0.5,'media':0.5};
function quitaAcentos(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function parseNumeroES(raw){
  if(raw==null)return null;
  var s=quitaAcentos(String(raw).toLowerCase().trim()).replace(/\$/g,'').replace(/\b(mxn|pesos|peso|usd|dolares|de)\b/g,' ').trim();
  if(!s)return null;
  if(/^[\d.,\s]+(mdp|m|k)?$/.test(s)){
    var suf=1,ms=s.match(/(mdp|m|k)$/);
    if(ms){suf=(ms[1]==='k')?1e3:1e6;s=s.replace(/(mdp|m|k)$/,'').trim();}
    var t=s.replace(/\s/g,'');
    if(/^\d{1,3}([.,]\d{3})+([.,]\d{1,2})?$/.test(t)){
      var dec=t.match(/[.,](\d{1,2})$/);
      t=t.replace(/[.,]\d{1,2}$/,'').replace(/[.,]/g,'');
      var v1=parseFloat(t);if(dec)v1+=parseFloat('0.'+dec[1]);
      return v1*suf;
    }
    t=t.replace(',','.');var v2=parseFloat(t);return isNaN(v2)?null:v2*suf;
  }
  var toks=s.split(/[\s-]+/).filter(Boolean);
  var total=0,cur=0,usado=false;
  for(var i=0;i<toks.length;i++){
    var tk=toks[i];
    if(/^[\d.,]+$/.test(tk)){var vn=parseFloat(tk.replace(/,/g,''));if(!isNaN(vn)){cur+=vn;usado=true;}continue;}
    if(tk==='y')continue;
    if(tk==='mil'||tk==='miles'){total+=(cur||1)*1000;cur=0;usado=true;continue;}
    if(tk==='millon'||tk==='millones'){total+=(cur||1)*1e6;cur=0;usado=true;continue;}
    if(UNI.hasOwnProperty(tk)){cur+=UNI[tk];usado=true;continue;}
  }
  total+=cur;return usado?total:null;
}
function fmt(n){return Number(n).toLocaleString('es-MX');}
function bindNorm(id,outId){
  $(id).addEventListener('blur',function(){
    var v=parseNumeroES($(id).value);
    $(outId).textContent=(v!=null&&$(id).value.trim()!=='')?('Se registrará: '+fmt(v)):'';
    updateProgress();
  });
  $(id).addEventListener('input',updateProgress);
}
bindNorm('f_precio','n_precio');bindNorm('f_precio_renta','n_precio_renta');
bindNorm('f_m2t','n_m2t');bindNorm('f_m2c','n_m2c');
$('f_precio_renta').addEventListener('input',autoFillComisionRenta);
$('f_precio_renta').addEventListener('blur',autoFillComisionRenta);
$('f_comision_renta').addEventListener('input',function(){this.setAttribute('data-manual','true');});
function numVal(id){var v=parseNumeroES($(id).value);return(v!=null&&$(id).value.trim()!=='')?v:null;}

/* ===================== NOMBRE / UNIDADES / DRIVE ===================== */
function nombreBase(){
  var n=$('f_nombre').value.trim();if(n)return n;
  var zona=zonaVal();var dir=$('f_direccion').value.trim().split(',')[0];
  n=((state.tipo||'Propiedad')+' '+(zona!=='S/I'?zona:'')+(dir?' - '+dir:'')).replace(/\s+/g,' ').trim();
  return n||'Propiedad sin nombre';
}
function sufijoTipo(){
  if(state.tipo==='Terreno')return 'lote';
  if(state.tipo==='Departamento')return 'dpto';
  if(['Local comercial','Oficina','Bodega'].indexOf(state.tipo)!==-1)return 'local';
  return 'casa';
}
function refreshUnits(){
  var n=Math.max(1,parseInt($('f_unidades').value,10)||1);
  $('unitsBox').style.display=(n>1)?'':'none';
  var list=$('unitsList');
  if(n<=1){list.innerHTML='';return;}
  var base=nombreBase();
  var prev=Array.prototype.map.call(list.querySelectorAll('.unit-card'),function(card){
    return {nombre:card.querySelector('[data-u=nombre]').value,
      m2t:(card.querySelector('[data-u=m2t]')||{value:''}).value,
      m2c:(card.querySelector('[data-u=m2c]')||{value:''}).value,
      precio:card.querySelector('[data-u=precio]').value,
      nota:card.querySelector('[data-u=nota]').value};
  });
  var gM2t=$('f_m2t').value.trim();
  var gM2c=$('f_m2c').value.trim();
  var gPrecio='';
  if(state.oper==='Venta'||state.oper==='Venta y Renta')gPrecio=$('f_precio').value.trim();
  if(state.oper==='Renta'||state.oper==='Venta y Renta')gPrecio=gPrecio||$('f_precio_renta').value.trim();
  list.innerHTML='';
  for(var i=1;i<=n;i++){
    var p=prev[i-1]||{};
    var card=document.createElement('div');card.className='unit-card';
    card.innerHTML='<div class="unit-head">Unidad '+i+'</div>'+
      '<input type="text" data-u="nombre" value="'+esc(p.nombre||(base+' - '+sufijoTipo()+' '+i))+'">'+
      '<div class="row2" style="margin-top:8px">'+
        '<div><div style="font-size:.75rem;color:var(--text-soft);margin-bottom:3px">m² terreno</div>'+
        '<input type="text" data-u="m2t" placeholder="'+esc(gM2t||'ej. 150')+'" value="'+esc(p.m2t||gM2t)+'"></div>'+
        '<div><div style="font-size:.75rem;color:var(--text-soft);margin-bottom:3px">m² construcción</div>'+
        '<input type="text" data-u="m2c" placeholder="'+esc(gM2c||'ej. 90')+'" value="'+esc(p.m2c||gM2c)+'"></div>'+
      '</div>'+
      '<input type="text" data-u="precio" placeholder="Precio ('+esc(gPrecio||'igual al campo global')+')" value="'+esc(p.precio||'')+'" style="margin-top:8px">'+
      '<input type="text" data-u="nota" placeholder="Nota (opcional)" value="'+esc(p.nota||'')+'" style="margin-top:8px">';
    list.appendChild(card);
  }
}
$('f_unidades').addEventListener('input',refreshUnits);
$('btnIgualaTodo').addEventListener('click',function(){
  var gM2t=$('f_m2t').value.trim();
  var gM2c=$('f_m2c').value.trim();
  var gPrecio='';
  if(state.oper==='Venta'||state.oper==='Venta y Renta')gPrecio=$('f_precio').value.trim();
  if(state.oper==='Renta'||state.oper==='Venta y Renta')gPrecio=gPrecio||$('f_precio_renta').value.trim();
  $('unitsList').querySelectorAll('.unit-card').forEach(function(card){
    if(gM2t)card.querySelector('[data-u=m2t]').value=gM2t;
    if(gM2c)card.querySelector('[data-u=m2c]').value=gM2c;
    if(gPrecio)card.querySelector('[data-u=precio]').value=gPrecio;
  });
});
$('f_nombre').addEventListener('input',function(){refreshDrive();});
function refreshDrive(){
  if($('f_drive').dataset.manual)return;
  $('f_drive').value=(CFG.drive||'Hauser Propiedades')+' / '+nombreBase();
}
$('f_drive').addEventListener('input',function(){this.dataset.manual='1';});
refreshDrive();

/* botón crear/confirmar carpeta drive */
$('btnDrive').addEventListener('click',function(){
  var name=$('f_drive').value.trim();
  if(!name){$('driveStatus').textContent='Escribe primero el nombre de la carpeta.';return;}
  if(CFG.endpoint){
    $('driveStatus').className='status';$('driveStatus').textContent='Creando carpeta en Drive…';
    api('createFolder',{name:name}).then(function(res){
      if(res&&res.url){$('driveStatus').className='status ok';
        $('driveStatus').textContent='✓ Carpeta lista. Ya puedes subir fotos.';
        $('btnFotos').disabled=false;$('btnFotos').dataset.url=res.url;}
      else throw new Error('sin url');
    }).catch(function(){
      $('driveStatus').className='status err';$('driveStatus').textContent='No se pudo crear automáticamente; el markdown llevará la instrucción de crearla.';
    });
  }else{
    $('driveStatus').className='status';
    $('driveStatus').textContent='Sin backend configurado: el markdown indicará crear esta carpeta. Configúralo en ⚙️ para automatizarlo.';
  }
});
$('btnFotos').addEventListener('click',function(){
  var url=this.dataset.url;if(url)window.open(url,'_blank');
  else alert('Primero crea/confirma la carpeta de Drive.');
});

/* ===================== DIRECCIÓN: autocompletado ===================== */
var sugTimer=null;
$('f_direccion').addEventListener('input',function(){
  refreshDrive();updateProgress();
  var q=$('f_direccion').value.trim();clearTimeout(sugTimer);
  if(q.length<5){$('dirSuggest').style.display='none';return;}
  sugTimer=setTimeout(function(){buscarDireccion(q);},650);
});
function buscarDireccion(q){
  fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=mx&accept-language=es&q='+encodeURIComponent(q+' Cuernavaca'))
  .then(function(r){return r.json();})
  .then(function(res){
    var box=$('dirSuggest');box.innerHTML='';
    if(!res||!res.length){box.style.display='none';return;}
    res.forEach(function(it){
      var d=document.createElement('div');d.textContent='📍 '+it.display_name;
      d.addEventListener('click',function(){
        $('f_direccion').value=it.display_name;
        setGeo(parseFloat(it.lat),parseFloat(it.lon),'Dirección y coordenadas cargadas. Corrige el número exterior si hace falta.');
        autoZonaFromAddr(it);box.style.display='none';refreshDrive();updateProgress();
      });
      box.appendChild(d);
    });
    box.style.display='block';
  })
  .catch(function(){
    $('dirSuggest').style.display='none';
    $('geoStatus').className='status';
    $('geoStatus').textContent='Las sugerencias de mapa no cargaron aquí; al abrir la URL en el navegador del celular sí funcionan.';
  });
}
function autoZonaFromAddr(it){
  if(zonasSel.length)return;
  var a=it.address||{};
  var z=a.neighbourhood||a.suburb||a.quarter||a.residential;
  if(z){pickZona(z,zonasAll().every(function(x){return x.n.toLowerCase()!==z.toLowerCase();}));}
}

/* ===================== GEO ===================== */
function setGeo(lat,lng,msg){
  state.lat=lat;state.lng=lng;
  $('f_maps').value='https://www.google.com/maps?q='+lat.toFixed(6)+','+lng.toFixed(6);
  $('geoStatus').className='status ok';
  $('geoStatus').textContent=msg||('Coordenadas guardadas: '+lat.toFixed(5)+', '+lng.toFixed(5));
}
function reverseGeo(lat,lng){
  fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=es&lat='+lat+'&lon='+lng)
  .then(function(r){return r.json();})
  .then(function(d){
    if(d&&d.display_name&&!$('f_direccion').value.trim()){$('f_direccion').value=d.display_name;refreshDrive();}
    if(d)autoZonaFromAddr(d);updateProgress();
  }).catch(function(){});
}
$('btnGeo').addEventListener('click',function(){
  if(!navigator.geolocation){$('geoStatus').className='status err';$('geoStatus').textContent='Tu dispositivo no permite geolocalización.';return;}
  $('geoStatus').className='status';$('geoStatus').textContent='Obteniendo tu ubicación…';
  navigator.geolocation.getCurrentPosition(function(pos){
    setGeo(pos.coords.latitude,pos.coords.longitude);reverseGeo(pos.coords.latitude,pos.coords.longitude);
  },function(){
    $('geoStatus').className='status err';$('geoStatus').textContent='No se pudo obtener la ubicación. Da permiso de ubicación o usa el mapa.';
  },{enableHighAccuracy:true,timeout:10000});
});

/* link de Maps pegado → coords */
$('f_maps').addEventListener('blur',function(){
  var u=this.value;var m=u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||u.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if(m){state.lat=parseFloat(m[1]);state.lng=parseFloat(m[2]);
    $('geoStatus').className='status ok';$('geoStatus').textContent='Coordenadas leídas del link.';}
});

/* MAPA modal */
var map=null,marker=null,pick=null,leafletLoaded=false;
function loadLeaflet(){
  return new Promise(function(res,rej){
    if(leafletLoaded&&window.L)return res();
    var css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
    var s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload=function(){leafletLoaded=true;res();};s.onerror=rej;document.head.appendChild(s);
  });
}
$('btnMap').addEventListener('click',function(){
  $('mapOverlay').classList.add('show');
  loadLeaflet().then(function(){
    if(!map){
      map=L.map('mapDiv').setView([state.lat||18.9261,state.lng||-99.2308],14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
      map.on('click',function(e){
        pick=e.latlng;
        if(marker)marker.setLatLng(pick);else marker=L.marker(pick).addTo(map);
        $('mapCoords').textContent=pick.lat.toFixed(5)+', '+pick.lng.toFixed(5);
        $('mapUse').disabled=false;
      });
    }
    setTimeout(function(){map.invalidateSize();},150);
  }).catch(function(){
    $('mapCoords').textContent='El mapa no cargó (restricción de red). Abre la URL en el navegador del celular, o usa 📍 / escribe la dirección.';
  });
});
$('mapClose').addEventListener('click',function(){$('mapOverlay').classList.remove('show');});
$('mapUse').addEventListener('click',function(){
  if(!pick)return;setGeo(pick.lat,pick.lng);reverseGeo(pick.lat,pick.lng);
  $('mapOverlay').classList.remove('show');
});

/* ===================== LEER ANUNCIO (IA) ===================== */
$('btnAnuncio').addEventListener('click',function(){
  var url=$('f_anuncio').value.trim();
  if(!url){$('anuncioStatus').textContent='Pega primero el link del anuncio.';return;}
  $('btnAnuncio').disabled=true;$('anuncioStatus').className='status';
  $('anuncioStatus').textContent='Leyendo el anuncio… unos segundos.';
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-6',max_tokens:1000,
      messages:[{role:'user',content:'Visita este anuncio inmobiliario y extrae sus datos: '+url+'\n\nResponde ÚNICAMENTE con un objeto JSON (sin backticks, sin texto extra) con estas llaves (usa null si no aparece; números planos sin símbolos):\n{"tipo":"Casa|Departamento|Terreno|Local comercial|Oficina|Bodega|Otro","operacion":"Venta|Renta|Venta y Renta","precio_venta":null,"precio_renta":null,"moneda":"MXN|USD","direccion":null,"colonia":null,"municipio":null,"m2_terreno":null,"m2_construccion":null,"recamaras":null,"banos":null,"estacionamientos":null,"caracteristicas":[],"portal":null,"publicador":null,"telefono":null,"descripcion_breve":null}'}],
      tools:[{type:'web_search_20250305',name:'web_search'}]
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    var text=(d.content||[]).filter(function(x){return x.type==='text';}).map(function(x){return x.text;}).join('\n').replace(/```(json)?/g,'').trim();
    var j=null,mjson=text.match(/\{[\s\S]*\}/);if(mjson){try{j=JSON.parse(mjson[0]);}catch(e){}}
    if(!j)throw new Error('sin JSON');
    var llenos=[];
    if(j.tipo){setChip('tipoChips','tipo',j.tipo,onTipo);llenos.push('tipo');}
    if(j.operacion){setChip('operChips','oper',j.operacion,onOper);llenos.push('operación');}
    if(j.precio_venta!=null){$('f_precio').value=String(j.precio_venta);$('n_precio').textContent='Se registrará: '+fmt(j.precio_venta);llenos.push('precio venta');}
    if(j.precio_renta!=null){$('f_precio_renta').value=String(j.precio_renta);$('n_precio_renta').textContent='Se registrará: '+fmt(j.precio_renta);llenos.push('precio renta');}
    if(j.moneda)$('f_moneda').value=j.moneda;
    if(j.direccion&&!$('f_direccion').value.trim()){$('f_direccion').value=j.direccion;llenos.push('dirección');}
    if(j.colonia){pickZona(j.colonia,zonasAll().every(function(z){return z.n.toLowerCase()!==String(j.colonia).toLowerCase();}));llenos.push('zona');}
    if(j.m2_terreno!=null){$('f_m2t').value=String(j.m2_terreno);llenos.push('m² terreno');}
    if(j.m2_construccion!=null){$('f_m2c').value=String(j.m2_construccion);llenos.push('m² construcción');}
    if(j.recamaras!=null){$('f_rec').value=String(j.recamaras);llenos.push('recámaras');}
    if(j.banos!=null){$('f_ban').value=String(j.banos);llenos.push('baños');}
    if(j.estacionamientos!=null){$('f_est').value=String(j.estacionamientos);llenos.push('estacionamientos');}
    if(j.caracteristicas&&j.caracteristicas.length){j.caracteristicas.forEach(function(c){addCaract(String(c));});llenos.push('características');}
    $('f_fuente').value='Portal';$('boxFuenteOtra').style.display='none';
    if(j.publicador||j.telefono){
      state.people.push({id:'pa'+Date.now(),nombre:j.publicador||'',rol:'Asesor inmobiliario',tel:j.telefono||'',fuente:'Portal',auto:false,touched:true});
      renderCRM();llenos.push('publicador→CRM');
    }
    if(j.descripcion_breve){var n=$('f_notas');n.value=(n.value?n.value+'\n':'')+'Del anuncio'+(j.portal?' ('+j.portal+')':'')+': '+j.descripcion_breve;}
    state.anuncioUrl=url;
    $('anuncioStatus').className='status ok';
    $('anuncioStatus').textContent='✓ Anuncio leído. Rellenado: '+(llenos.join(', ')||'nada')+'. Revisa y corrige.';
    updateProgress();refreshDrive();
  })
  .catch(function(){
    $('anuncioStatus').className='status err';
    $('anuncioStatus').textContent='No se pudo leer el anuncio aquí. Esta función opera dentro de Claude o con backend; en archivo suelto, captura manual. El portal también puede bloquear la lectura.';
  })
  .finally(function(){$('btnAnuncio').disabled=false;});
});

/* ===================== PROGRESO ===================== */
function filled(id){var el=$(id);if(!el)return false;return siOn(id)||naOn(id)||el.value.trim()!=='';}
function updateProgress(){
  var t=(state.tipo==='Terreno');
  var ids=['f_direccion','f_m2t'];
  if(state.oper==='Venta'||state.oper==='Venta y Renta')ids.push('f_precio');
  if(state.oper==='Renta'||state.oper==='Venta y Renta')ids.push('f_precio_renta');
  if(t)ids=ids.concat(['f_uso','f_frente']);
  else if(state.tipo)ids=ids.concat(['f_m2c','f_rec','f_ban','f_est']);
  var total=ids.length+3,done=0;  // +3: tipo, ofrece, zona
  ids.forEach(function(id){if(filled(id))done++;});
  if(state.tipo)done++;if(state.ofrece)done++;
  if(zonasSel.length)done++;
  if(t){total+=1;if(state.serv.length)done++;}
  var pct=total?Math.round(done/total*100):0;
  $('progText').textContent=done+' de '+total+' campos clave';
  $('progPct').textContent=pct+'%';$('progFill').style.width=pct+'%';
}
['f_zona','f_uso','f_frente','f_fondo','f_rec','f_ban','f_est','f_notas','f_m2c'].forEach(function(id){
  var el=$(id);if(el){el.addEventListener('input',updateProgress);el.addEventListener('change',updateProgress);}
});
updateProgress();

/* ===================== HELPERS SALIDA ===================== */
function txt(id){return siOn(id)?'S/I':(naOn(id)?'N/A':($(id).value.trim()||'S/I'));}
function numCell(id){
  if(siOn(id))return{val:null,pend:true};
  if(naOn(id))return{val:null,pend:false,na:true};
  var v=numVal(id);if(v==null)return{val:null,pend:true};
  return{val:v,pend:false};
}
function lineas(id){return $(id).value.split('\n').map(function(s){return s.trim();}).filter(Boolean);}

/* requisitos de "captura completa": m2, recámaras, baños, responsable */
function faltantesCompletitud(){
  var f=[];var esTerreno=(state.tipo==='Terreno');
  if(numCell('f_m2t').pend)f.push('m² terreno');
  if(!esTerreno && numCell('f_m2c').pend)f.push('m² construcción');
  if(!esTerreno){
    if(numCell('f_rec').pend)f.push('recámaras');
    if((siOn('f_ban')||!$('f_ban').value.trim())&&!naOn('f_ban'))f.push('baños');
  }
  if(!$('f_resp').value)f.push('quién captura (responsable)');
  return f;
}

/* ===================== SISTEMA DE ESTRELLAS — FASE 5 ===================== */
function calcularEstrellas(){
  var esTerreno=(state.tipo==='Terreno');
  var conVenta=(state.oper==='Venta'||state.oper==='Venta y Renta');
  var conRenta=(state.oper==='Renta'||state.oper==='Venta y Renta');
  function ok(id){return siOn(id)||naOn(id)||($(id)&&$(id).value.trim()!=='');}
  function okNum(id){return siOn(id)||naOn(id)||numVal(id)!=null;}

  // ⭐ 1: velocidad ≤ 5 min
  var s1=timerElapsed>0&&timerElapsed<=300;

  // ⭐ 2: datos esenciales
  var falt2=[];
  if(!state.tipo)falt2.push('Tipo de inmueble');
  if(!$('f_direccion').value.trim()&&!state.lat)falt2.push('Dirección o ubicación');
  if(!zonasSel.length)falt2.push('Zona/colonia');
  if(conVenta&&!okNum('f_precio'))falt2.push('Precio de venta');
  if(conRenta&&!okNum('f_precio_renta'))falt2.push('Precio de renta');
  if(!okNum('f_m2t'))falt2.push('m² terreno');
  if(!esTerreno&&!okNum('f_m2c'))falt2.push('m² construcción');
  if(!$('f_resp').value.trim())falt2.push('Responsable/asesor');
  if(!state.ofrece)falt2.push('Quién ofrece la propiedad');
  if(state.ofrece&&state.ofrece!=='No sé aún'&&
     !state.people.some(function(p){return p.nombre||p.tel;}))
    falt2.push('Contacto del oferente');
  if(!esTerreno&&state.tipo){
    if(!ok('f_rec'))falt2.push('Recámaras');
    if(!ok('f_ban'))falt2.push('Baños');
    if(!ok('f_est'))falt2.push('Estacionamientos');
  }
  if(esTerreno){
    if(!state.serv.length)falt2.push('Servicios disponibles');
    if(!ok('f_uso'))falt2.push('Uso de suelo/densidad');
  }
  var s2=falt2.length===0;

  // ⭐ 3: completa — extras sobre estrella 2
  var falt3=[];
  if(!state.lat&&!($('f_maps')&&$('f_maps').value.trim()))falt3.push('Coordenadas o link de Maps');
  if(esTerreno){
    if(!ok('f_frente'))falt3.push('Frente del terreno');
    if(!ok('f_fondo'))falt3.push('Fondo del terreno');
  }
  if(state.ofrece&&state.ofrece!=='No sé aún'&&
     !state.people.some(function(p){return p.nombre&&(p.tel||p.wa||p.email);}))
    falt3.push('Contacto con nombre y teléfono/email');
  var s3=s2&&falt3.length===0;

  var count=(s1?1:0)+(s2?1:0)+(s3?1:0);
  var quality=!s2?'Incompleta':(s3?'Completa':(s1?'Publicable':'Esencial'));
  return{s1:s1,s2:s2,s3:s3,count:count,quality:quality,falt2:falt2,falt3Extra:falt3};
}

/* ===================== GENERAR MARKDOWN ===================== */
var mdActual='';var lastCaptureId=null;
$('btnGen').addEventListener('click',function(){
  try{generar();}catch(err){alert('Error generando markdown: '+err.message);console.error(err);}
});

function cell(v,nota){return {v:(v==null||v==='')?'':String(v),nota:nota||''};}
function row(campo,tipo,c){return '| '+campo+' | '+tipo+' | '+(c.v||' ')+' | '+(c.nota||' ')+' |';}

function generar(){
  var esTerreno=(state.tipo==='Terreno');
  var conVenta=(state.oper==='Venta'||state.oper==='Venta y Renta');
  var conRenta=(state.oper==='Renta'||state.oper==='Venta y Renta');
  var zonasArr=zonasSel.slice();var zona=zonaVal();var fuente=fuenteVal();var nombre=nombreBase();
  var nU=Math.max(1,parseInt($('f_unidades').value,10)||1);

  // estrellas + estatus automático (Decisión 14)
  var estrellas=calcularEstrellas();
  var faltC=faltantesCompletitud();
  var estatus=$('f_estatus').value;
  if(estrellas.count===3){
    estatus='Captada';$('f_estatus').value='Captada';
    $('estatusHint').textContent='🌟 Captura completa (3 ⭐) → estatus: Captada.';
  }else if(faltC.length&&estatus==='Captada'){
    estatus='En análisis';$('f_estatus').value='En análisis';
    $('estatusHint').textContent='Se ajustó a "En análisis" porque faltan datos mínimos.';
  }

  var pv=conVenta?numCell('f_precio'):{val:null,pend:false,na:true};
  var pr=conRenta?numCell('f_precio_renta'):{val:null,pend:false,na:true};
  var m2t=numCell('f_m2t');
  var m2c=esTerreno?{val:null,na:true}:numCell('f_m2c');
  var rec=esTerreno?{val:null,na:true}:numCell('f_rec');
  var est=esTerreno?{val:null,na:true}:numCell('f_est');
  var banTxt;if(esTerreno)banTxt={v:null,na:true};else{var bv=$('f_ban').value.trim();banTxt=(siOn('f_ban')||!bv)?{pend:true}:{v:bv};}

  function valNum(o){return o.na?'':(o.pend?'':(o.val!=null?String(o.val):''));}
  function notaNum(o){return o.na?'N/A':(o.pend?'S/I':'');}

  var moneda=$('f_moneda').value;
  var unidades=[];
  if(nU>1){
    unidades=Array.prototype.map.call($('unitsList').querySelectorAll('.unit-card'),function(card){
      return {nombre:card.querySelector('[data-u=nombre]').value.trim(),
        m2t:(card.querySelector('[data-u=m2t]')||{value:''}).value.trim(),
        m2c:(card.querySelector('[data-u=m2c]')||{value:''}).value.trim(),
        precio:card.querySelector('[data-u=precio]').value.trim(),
        nota:card.querySelector('[data-u=nota]').value.trim()};
    }).filter(function(u){return u.nombre;});
  }

  /* ---------- construir markdown ---------- */
  var md='';
  md+='# Alta de propiedad en Notion — '+nombre+'\n\n';
  md+='> Instrucción para el agente de Notion (sistema Hauser, Cuernavaca). Crea o actualiza la propiedad en la base 🏠 **Propiedades** y vincula las bases relacionadas. No inventes datos: respeta S/I (sin información) y N/A (no aplica).\n\n';

  md+='## 1. Acción principal\n';
  if(nU>1){
    md+='Crear **'+unidades.length+' páginas** en 🏠 Propiedades, una por unidad (no agrupar en una sola). Clonar los datos comunes de abajo y respetar los datos específicos de cada unidad.\n';
    md+='- Página madre del conjunto: **'+state.madre+'**.\n';
    md+='- Carpeta de Drive: **'+state.driveShare+'**.\n\n';
  }else{
    md+='Crear **1 página** en 🏠 Propiedades con el nombre **'+nombre+'** (si ya existe una con esa dirección, actualizarla).\n\n';
  }
  if(conRenta){
    md+='> ⚠️ **Campos nuevos en esta captura:** "Ganancia renta" y "Tiempo mínimo de renta" aún no existen en la base 🏠 Propiedades. Créalos antes de llenar sus filas (ver sección 2). Si el dueño prefiere no alterar el esquema, registrar estos datos en el campo Notas.\n\n';
  }

  md+='## 2. Campos de la base 🏠 Propiedades\n';
  md+='| Campo Notion | Tipo esperado | Valor para Notion | Nota interna |\n';
  md+='|---|---|---|---|\n';

  // dirección genérica + instrucción de geolocalización (Decisión 1)
  var dirVal=$('f_direccion').value.trim();
  var dirNota=dirVal
    ?'Direccion generica capturada en campo. Instruccion al agente: buscar esta direccion en web / Google Maps, identificar la ubicacion exacta y rellenar Direccion con referencia tipo Google Maps (link y/o coordenadas).'
    :'S/I';

  // Notas: para terreno incluye servicios/uso_suelo/estatus_legal (Decisiones 8,10,11 → van en Notas, no en propiedades de Notion)
  var notasTextoCampo=$('f_notas').value.trim();
  var notasValorNotion,notaNotionRow;
  if(esTerreno){
    var servText=state.serv.length?state.serv.join(', '):'S/I';
    notasValorNotion='Servicios: '+servText+' | Uso de suelo/densidad: '+txt('f_uso')+' | Estatus legal: '+$('f_legal').value+(notasTextoCampo?' | Notas: '+notasTextoCampo:'');
    notaNotionRow='Datos de terreno incluidos aqui (servicios, uso de suelo, estatus legal). No son propiedades separadas de Notion hasta confirmacion del dueno.';
  }else{
    notasValorNotion=notasTextoCampo;
    notaNotionRow='';
  }

  md+=row('Nombre','Title',cell(nombre))+'\n';
  md+=row('Tipo de inmueble','Select',cell(state.tipo,state.tipo?'':'S/I'))+'\n';
  var operNotion=(state.oper==='Venta y Renta')?'Venta':state.oper;
  var operNota=(state.oper==='Venta y Renta')?'Propiedad disponible en Venta y Renta. El campo Operación se registra como "Venta". Los datos de renta van en los campos Precio renta, Ganancia renta y Tiempo mínimo de renta.':'';
  md+=row('Operación','Select',{v:operNotion,nota:operNota})+'\n';
  md+=row('Dirección','Text',cell(dirVal,dirNota))+'\n';
  var zonasStr=zonasArr.length?zonasArr.map(function(z){return z.n;}).join(' / '):'S/I';
  var zonasNota=zonasArr.length?zonasArr.map(function(z){return z.n+(z.nueva?' [CREAR y relacionar]':' [buscar y relacionar]');}).join('; '):'S/I';
  md+=row('Zona','Relación (multi) → 📍 Zonas',{v:zonasStr,nota:zonasNota})+'\n';
  md+=row('Precio','Number',{v:valNum(pv),nota:notaNum(pv)+(pv.val&&moneda?(' ('+moneda+', sin símbolo)'):'')})+'\n';
  if(conRenta){
    md+=row('Precio renta','Number',{v:valNum(pr),nota:notaNum(pr)+' renta mensual'})+'\n';
    md+=row('Ganancia renta','Number',{v:pr.val!=null?String(pr.val):'',nota:(pr.val!=null?('Igual al precio del primer mes de renta ('+fmt(pr.val)+' '+moneda+').'):('S/I — precio de renta no capturado.'))+' ⚠️ CAMPO NUEVO: crear en 🏠 Propiedades si no existe (tipo: Number).'})+'\n';
    md+=row('Tiempo mínimo de renta','Select',{v:state.rentaMin||'S/I',nota:'⚠️ CAMPO NUEVO: crear en 🏠 Propiedades si no existe (tipo: Select, opciones: "6 meses" / "1 año").'})+'\n';
  }
  md+=row('m² terreno','Number',{v:valNum(m2t),nota:notaNum(m2t)})+'\n';
  md+=row('m² construcción','Number',{v:valNum(m2c),nota:notaNum(m2c)})+'\n';
  md+=row('Recámaras','Number',{v:valNum(rec),nota:notaNum(rec)})+'\n';
  md+=row('Baños','Text',{v:(banTxt.na?'':(banTxt.pend?'':banTxt.v)),nota:(banTxt.na?'N/A':(banTxt.pend?'S/I':''))})+'\n';
  md+=row('Estacionamientos','Number',{v:valNum(est),nota:notaNum(est)})+'\n';
  md+=row('Estatus','Select',cell(estatus))+'\n';
  md+=row('Publicable','Select / Checkbox',cell($('f_pub').value))+'\n';
  md+=row('Fuente','Select',cell(fuente.nombre,fuente.nueva?'OPCIÓN NUEVA: agregar al select de Fuente':''))+'\n';
  md+=row('Propietario','Relación → 👥 Contactos',cell(propietarioNombre(),propietarioNota()))+'\n';
  md+=row('Notas','Texto',{v:notasValorNotion,nota:notaNotionRow})+'\n';
  md+=row('Precio / m²','Fórmula',{v:'',nota:'lo calcula Notion; no escribir'})+'\n';
  md+='\n';

  md+='## 3. Reglas de relaciones\n';
  md+='- **Zona**: es relación multi-valor a 📍 Zonas. Para cada zona: busca y relaciona si existe; si no existe, crea el registro (Municipio: Cuernavaca por defecto) y luego relaciona. No dejar como texto suelto.\n';
  md+='- **Propietario**: relación a 👥 Contactos. El **asesor/broker NO es el propietario legal**; si solo hay asesor, el Propietario legal queda **S/I**.\n';
  md+='- **Operaciones / Proyectos / Tareas**: son relaciones; créalas como registros aparte y vincula, no las metas como texto en Propiedades.\n';
  md+='- Las frases largas (notas, descripción) van en el **contenido de la página**, no en campos de relación.\n\n';

  // 4. CRM
  md+='## 4. Personas / CRM (base 👥 Contactos)\n';
  var people=state.people.filter(function(p){return p.nombre||p.tel||p.touched;});
  if(!people.length){
    md+='- Sin contactos capturados. Propietario legal: **S/I**.\n\n';
  }else{
    people.forEach(function(p){
      md+='### '+(p.nombre||'(nombre S/I)')+' — '+p.rol+'\n';
      md+='Crear o actualizar en 👥 Contactos y relacionar con esta propiedad según su rol.\n';
      md+='| Campo | Valor | Nota |\n|---|---|---|\n';
      md+='| Nombre | '+(p.nombre||' ')+' | '+(p.nombre?'':'S/I')+' |\n';
      md+='| Tipo de contacto | '+p.rol+' | |\n';
      if(p.tel)md+='| Teléfono | '+p.tel+' | |\n';
      if(p.wa)md+='| WhatsApp | '+p.wa+' | |\n';
      if(p.email)md+='| Email | '+p.email+' | |\n';
      if(p.empresa)md+='| Empresa | '+p.empresa+' | |\n';
      if(p.fuente)md+='| Fuente | '+p.fuente+' | |\n';
      if(p.relacion)md+='| Relación con propiedad | '+p.relacion+' | |\n';
      if(p.acuerdo)md+='| Acuerdo comercial | '+p.acuerdo+' | |\n';
      if(p.comision)md+='| Comisión | '+p.comision+' | |\n';
      if(p.presupuesto)md+='| Presupuesto | '+p.presupuesto+' | |\n';
      if(p.busca)md+='| Busca | '+p.busca+' | |\n';
      if(p.zonaInt)md+='| Zona de interés | '+p.zonaInt+' | relación → 📍 Zonas |\n';
      if(p.urgencia&&p.urgencia!=='S/I')md+='| Urgencia | '+p.urgencia+' | |\n';
      if(p.confianza&&p.confianza!=='S/I')md+='| Nivel de confianza | '+p.confianza+' | |\n';
      if(p.estatus)md+='| Etapa del lead | '+p.estatus+' | |\n';
      if(p.notas)md+='| Notas | '+p.notas+' | |\n';
      md+='\n';
    });
  }

  // 5. Operaciones
  var comprador=people.filter(function(p){return /Cliente A/.test(p.rol);})[0];
  md+='## 5. Operaciones\n';
  if(comprador){
    md+='Hay comprador interesado ('+(comprador.nombre||'S/I')+'). Crear una **Operación** en 🤝 Operaciones, relacionarla con esta propiedad y con el contacto comprador.\n';
    var comArr=[];
    if(conVenta)comArr.push('Venta: '+$('f_comision').value);
    if(conRenta)comArr.push('Renta: '+($('f_comision_renta').value||'S/I')+' (1er mes)');
    md+='- Comisión esperada: '+(comArr.join(' · ')||'S/I')+(comprador.presupuesto?(' · presupuesto comprador: '+comprador.presupuesto):'')+'.\n\n';
  }else{
    md+='Sin comprador aún. No crear Operación todavía.\n\n';
  }

  // 6. Tareas de seguimiento
  md+='## 6. Tareas de seguimiento\n';
  md+='Crear en ✅ Tareas, relacionadas con la propiedad/proyecto:\n';
  md+='- '+($('f_proxima').value.trim()||'Confirmar datos pendientes con el contacto')+' (responsable: '+$('f_resp').value+', fecha: '+$('f_seguimiento').value+').\n';
  if(faltC.length)md+='- Completar datos mínimos faltantes: '+faltC.join(', ')+'.\n';
  md+='\n';

  // 7. Drive
  md+='## 7. Carpeta de Drive y fotos\n';
  md+='- Carpeta: **'+$('f_drive').value.trim()+'** (dentro de la carpeta compartida de propiedades).\n';
  md+='- Notion guarda el **link** de la carpeta, no las fotos.\n';
  md+='- Fotos pendientes: '+(esTerreno?'panorámicas del lote, frente, colindancias, calle/contexto':'fachada, interiores, '+(state.caract.indexOf('Alberca')!==-1?'alberca, ':'')+'áreas comunes, calle/contexto')+'.\n\n';

  // 8. Terreno extra
  if(esTerreno){
    md+='## 8. Datos de terreno (contexto para corrida financiera)\n';
    md+='> Servicios, Uso de suelo y Estatus legal ya estan en el campo Notas de la seccion 2. Esta seccion es contexto adicional para el analisis financiero.\n\n';
    md+='- Servicios: '+(state.serv.length?state.serv.join(', '):'S/I')+'\n';
    md+='- Frente: '+txt('f_frente')+' m · Fondo: '+txt('f_fondo')+' m\n';
    md+='- Uso de suelo/densidad: '+txt('f_uso')+'\n';
    md+='- Estatus legal: '+$('f_legal').value+'\n';
    md+='- Características: '+(state.caractTerr.length?state.caractTerr.join(', '):'S/I')+'\n';
    md+='- Modo de análisis: '+state.modo+'\n\n';
  }

  // 9. Unidades
  if(nU>1){
    md+='## 9. Unidades del conjunto\n';
    md+='| Unidad | m² terreno | m² construcción | Precio | Nota |\n|---|---|---|---|---|\n';
    unidades.forEach(function(u){md+='| '+u.nombre+' | '+(u.m2t||'(global)')+' | '+(u.m2c||'(global)')+' | '+(u.precio||'(global)')+' | '+(u.nota||'')+' |\n';});
    md+='\n';
  }

  // 10. Contenido de página
  md+='## 10. Contenido interno de la página\n';
  var fuertes=lineas('f_fuertes');
  if(fuertes.length){md+='**Puntos fuertes:**\n';fuertes.forEach(function(x){md+='- '+x+'\n';});}
  if(state.caract.length&&!esTerreno)md+='\n**Características:** '+state.caract.join(', ')+'\n';
  if($('f_notas').value.trim())md+='\n**Notas de campo:** '+$('f_notas').value.trim()+'\n';
  if(state.lat)md+='\n**Coordenadas:** '+state.lat.toFixed(6)+', '+state.lng.toFixed(6)+' · '+$('f_maps').value+'\n';
  if(state.anuncioUrl)md+='\n**Anuncio original:** '+state.anuncioUrl+'\n';
  md+='\n';

  // 11. Riesgos y pendientes
  md+='## 11. Riesgos / dudas / pendientes\n';
  var riesgos=lineas('f_riesgos');
  riesgos.forEach(function(r){md+='- '+r+'\n';});
  faltC.forEach(function(f){md+='- Falta dato mínimo: '+f+'\n';});
  if(!riesgos.length&&!faltC.length)md+='- Sin riesgos ni pendientes en la captura inicial.\n';
  md+='\n';

  // 12. Info faltante
  var falt=camposSI();
  md+='## 12. Información faltante (S/I)\n';
  if(falt.length)falt.forEach(function(f){md+='- '+f+'\n';});else md+='- Ninguno marcado como S/I.\n';
  md+='\n';

  // 13. Resumen
  md+='## 13. Resumen de la captura\n';
  md+='- '+nombre+' · '+(state.tipo||'tipo S/I')+' · '+state.oper+(nU>1?(' · '+unidades.length+' unidades'):'')+'\n';
  md+='- Zona: '+zonasStr+' · Estatus: '+estatus+' · Responsable: '+$('f_resp').value+'\n';
  md+='- Capturada: '+$('f_fecha').value+' · Fuente: '+fuente.nombre+'\n\n';

  // 14. Confirmación
  md+='## 14. Confirmación solicitada al agente\n';
  md+='Al terminar, confirma: 1) nombre de las páginas creadas/actualizadas; 2) si fue alta o actualización; 3) campos vacíos por S/I; 4) relaciones creadas (Zona, Contactos, Operaciones, Tareas); 5) si se agregó alguna opción nueva (fuente/zona); 6) datos pendientes para publicar; 7) si se geolocalizo la dirección y qué referencia de Maps quedó registrada.\n';

  mdActual=md;$('mdOut').textContent=md;

  var precioTxt=conVenta?(pv.val!=null?('$'+fmt(pv.val)+' '+moneda):'precio S/I'):'';
  var rentaTxt=conRenta?(pr.val!=null?('$'+fmt(pr.val)+'/mes'):'renta S/I'):'';
  $('exitoBox').innerHTML='<strong>✅ Markdown generado</strong>Cópialo y pégalo en el chat del agente de Notion, o usa 📤 Enviar. Quedó guardado en el Historial.';
  $('resumenBox').innerHTML='<strong>Resumen</strong>'+nombre+' · '+(state.tipo||'tipo S/I')+' · '+state.oper+
    (nU>1?(' · '+unidades.length+' unidades'):'')+(precioTxt?(' · '+precioTxt):'')+(rentaTxt?(' · '+rentaTxt):'')+
    ' · Zona: '+zonasStr+'.<br>Incluye alta en Propiedades, '+people.length+' contacto(s) CRM, carpeta Drive y contenido de página.';
  if(falt.length){
    $('faltanteBox').style.display='';
    $('faltanteBox').innerHTML='<strong>⚠ Información faltante ('+falt.length+')</strong><ul>'+falt.map(function(f){return '<li>'+f+'</li>';}).join('')+'</ul>Ya quedó como pendiente en el markdown.';
  }else $('faltanteBox').style.display='none';
  $('outputArea').style.display='block';

  // guardar en historial
  lastCaptureId=saveCapture(md,estatus,falt,estrellas.count,estrellas.quality,timerElapsed);
  if(asesorActivo)updateAsesorStats(asesorActivo.id,estrellas,timerElapsed);
  sndSuccess();
  mostrarResultado(estrellas);
}

function propietarioNombre(){
  var prop=state.people.filter(function(p){return /Cliente B|Propietario/.test(p.rol);})[0];
  return prop&&prop.nombre?prop.nombre:'';
}
function propietarioNota(){
  var prop=state.people.filter(function(p){return /Cliente B|Propietario/.test(p.rol);})[0];
  if(prop&&prop.nombre)return 'relacionar contacto';
  if(state.ofrece==='Asesor / broker')return 'S/I — ofrecido por asesor, NO usar al asesor como propietario';
  return 'S/I';
}
function camposSI(){
  var f=[];
  [['f_m2t','m² terreno'],['f_m2c','m² construcción'],['f_rec','recámaras'],['f_ban','baños'],['f_est','estacionamientos'],['f_precio','precio venta'],['f_precio_renta','precio renta'],['f_frente','frente'],['f_fondo','fondo'],['f_uso','uso de suelo']].forEach(function(p){
    if($(p[0])&&siOn(p[0]))f.push(p[1]+' (S/I)');
    else if($(p[0])&&naOn(p[0]))f.push(p[1]+' (N/A)');
  });
  if(zonasSel.length===0)f.push('zona');
  return f;
}

/* ===================== RESULTADO + CONFETTI — FASE 5 ===================== */
function updateAsesorStats(id,strs,elapsed){
  var lista=getAsesores();
  var a=lista.filter(function(x){return x.id===id;})[0];if(!a)return;
  a.totalCapturas=(a.totalCapturas||0)+1;
  a.totalEstrellas=(a.totalEstrellas||0)+strs.count;
  if(strs.s2)a.capturasEsenciales=(a.capturasEsenciales||0)+1;
  if(strs.s3)a.capturasCompletas=(a.capturasCompletas||0)+1;
  if(elapsed>0&&(!a.mejorTiempo||elapsed<a.mejorTiempo))a.mejorTiempo=elapsed;
  a.ultimaCaptura=new Date().toISOString();
  saveAsesores(lista);
}

function launchConfetti(){
  var box=$('confettiBox');if(!box)return;
  box.innerHTML='';box.style.display='block';
  var cols=['#2e6f40','#F0C040','#52C462','#7DD3FC','#fff','#f59e0b','#c4554d'];
  for(var i=0;i<60;i++){
    var c=document.createElement('div');c.className='confetti-p';
    c.style.left=Math.random()*100+'%';
    c.style.background=cols[Math.floor(Math.random()*cols.length)];
    c.style.animationDelay=(Math.random()*1.4)+'s';
    c.style.animationDuration=(Math.random()*1.2+1.8)+'s';
    c.style.width=(Math.random()*7+4)+'px';c.style.height=(Math.random()*7+4)+'px';
    c.style.borderRadius=Math.random()>.5?'50%':'2px';
    box.appendChild(c);
  }
  setTimeout(function(){box.style.display='none';box.innerHTML='';},4200);
}

function mostrarResultado(strs){
  $('resPropName').textContent=nombreBase();
  var elapsedFmt=timerElapsed>0?timerFmt(timerElapsed):'sin cronómetro';
  $('resMeta').textContent=($('f_resp').value||'Asesor')+' · '+elapsedFmt+' · '+$('f_fecha').value;

  // badge de calidad
  var qLabels={Incompleta:'⚠ Incompleta',Esencial:'✓ Esencial',Publicable:'✓ Publicable',Completa:'🌟 Completa'};
  var qBadge=$('resQualityBadge');
  qBadge.textContent=qLabels[strs.quality]||strs.quality;
  qBadge.className='res-quality-badge res-q-'+(strs.quality||'').toLowerCase();

  // detalle de cada estrella
  var s1Txt=strs.s1?'¡En '+timerFmt(timerElapsed)+' (≤ 5 min)!':'No alcanzó 5 min'+(timerElapsed>0?' ('+timerFmt(timerElapsed)+')':' — sin cronómetro')+'.';
  var s2Txt=strs.s2?'Todos los campos esenciales completos.':'Faltan: '+strs.falt2.slice(0,4).join(', ')+(strs.falt2.length>4?' y '+(strs.falt2.length-4)+' más':'')+'.';
  var s3Txt=strs.s3?'¡Excelente, captura íntegra!':(!strs.s2?'Completa primero los datos esenciales.':(strs.falt3Extra.length?'Falta: '+strs.falt3Extra.slice(0,3).join(', ')+'.':'Revisa todos los campos.'));
  $('resStarsDetail').innerHTML=
    '<div class="star-row'+(strs.s1?' earned':'')+'"><span class="sr-icon">'+(strs.s1?'⭐':'☆')+'</span><div class="sr-text"><strong>Velocidad</strong> · '+s1Txt+'</div></div>'+
    '<div class="star-row'+(strs.s2?' earned':'')+'"><span class="sr-icon">'+(strs.s2?'⭐':'☆')+'</span><div class="sr-text"><strong>Datos esenciales</strong> · '+s2Txt+'</div></div>'+
    '<div class="star-row'+(strs.s3?' earned':'')+'"><span class="sr-icon">'+(strs.s3?'⭐':'☆')+'</span><div class="sr-text"><strong>Captura completa</strong> · '+s3Txt+'</div></div>';

  // callout faltantes
  var showFalt=!strs.s2?strs.falt2:(!strs.s3?strs.falt3Extra:[]);
  if(showFalt.length){
    $('resFaltCallout').style.display='';
    $('resFaltList').innerHTML=showFalt.map(function(f){return '<li>'+f+'</li>';}).join('');
  }else{
    $('resFaltCallout').style.display='none';
  }

  // mostrar vista + mascota
  showView('viewResult');
  setTimeout(function(){
    if(strs.count===3)setMascotState('celebrating');
    else setMascotState(strs.s2?'idle':'sad');
    console.log('mascot state:',($('mascotSvg')||{}).className);
  },100);

  // animar estrellas en secuencia
  var stars=[strs.s1,strs.s2,strs.s3];
  [$('resStar1'),$('resStar2'),$('resStar3')].forEach(function(el,i){
    el.className='res-star';
    setTimeout(function(){
      el.classList.add(stars[i]?'earned':'empty');
      if(stars[i])sndStar();
    },(i+1)*420);
  });

  // confetti con 3 estrellas
  if(strs.count===3)setTimeout(launchConfetti,1380);
}

/* listeners pantalla de resultado */
$('resBtnCopy').addEventListener('click',function(){
  copyText(mdActual);
  var b=this;b.textContent='Copiado ✓';
  setTimeout(function(){b.textContent='Copiar markdown';},1800);
});
$('resBtnVerMd').addEventListener('click',function(){
  showView('viewCapture');
  if($('outputArea').scrollIntoView)$('outputArea').scrollIntoView({behavior:'smooth'});
});
$('resBtnOtra').addEventListener('click',function(){doReset();showView('viewCapture');});
$('resBtnCompletar').addEventListener('click',function(){showView('viewCapture');window.scrollTo({top:0,behavior:'smooth'});});

/* ===================== RANKING — FASE 6 ===================== */
function repStar(n){var s='';for(var i=0;i<Math.min(n,9);i++)s+='⭐';return s+(n>9?'+':'');}

function sortAsesores(lista){
  return lista.slice().sort(function(a,b){
    var stA=a.totalEstrellas||0,stB=b.totalEstrellas||0;
    if(stA!==stB)return stB-stA;
    var capA=a.totalCapturas||0,capB=b.totalCapturas||0;
    var avA=capA?stA/capA:0,avB=capB?stB/capB:0;
    if(Math.abs(avA-avB)>.005)return avB-avA;
    return (a.mejorTiempo||99999)-(b.mejorTiempo||99999);
  });
}

function renderRanking(){
  var wrap=$('rankingList');if(!wrap)return;
  var modoEl=$('rankingModo');
  if(CFG.endpoint){
    wrap.innerHTML='<div class="empty" style="margin-top:48px">⏳ Cargando ranking compartido…</div>';
    if(modoEl)modoEl.textContent='';
    gasGet(function(data){
      if(data&&data.asesores&&data.asesores.length>1){
        var rows=parseGasRows(data.asesores);
        var total=data.capturas?data.capturas.length-1:rows.length;
        var lista=sortAsesores(rows.map(function(a){
          return{id:null,nombre:a.asesor||'S/I',
            totalCapturas:parseInt(a.totalCapturas)||0,
            totalEstrellas:parseInt(a.totalEstrellas)||0,
            capturasCompletas:parseInt(a.capturasCompletas)||0,
            capturasEsenciales:parseInt(a.capturasEsenciales)||0,
            mejorTiempo:parseInt(a.mejorTiempo)||null,
            ultimaCaptura:a.ultimaCaptura||null};
        }));
        if(modoEl)modoEl.textContent='🌐 Ranking compartido ('+total+' capturas de todos los dispositivos)';
        renderRankingConLista(lista);
      }else{
        if(modoEl)modoEl.textContent='📱 Ranking local (sin datos en la nube aún)';
        renderRankingLocal();
      }
    });
  }else{
    if(modoEl)modoEl.textContent='📱 Ranking local · Configura un endpoint en ⚙️ para compartir';
    renderRankingLocal();
  }
}
function renderRankingLocal(){
  renderRankingConLista(sortAsesores(getAsesores()));
}
function renderRankingConLista(full){
  var wrap=$('rankingList');if(!wrap)return;
  var lista=full.filter(function(a){return a.totalCapturas>0;});
  if(!lista.length){
    wrap.innerHTML='<div class="empty" style="margin-top:48px">Sin capturas aún.<br>Captura propiedades para aparecer en el ranking.</div>';
    return;
  }
  var html='';

  // podio top-3
  html+='<div class="podio">';
  var podioOrder=[1,0,2];  // izq=plata, centro=oro, der=bronce
  podioOrder.forEach(function(idx){
    if(idx>=lista.length)return;
    var a=lista[idx];
    var medal=['🥇','🥈','🥉'][idx];
    var posClass='pos-'+(idx+1);
    var init=a.nombre.split(' ').map(function(p){return p[0];}).join('').toUpperCase().slice(0,2);
    var avg=a.totalCapturas?(a.totalEstrellas/a.totalCapturas).toFixed(1):'0.0';
    html+='<div class="podio-card '+posClass+'">'+
      '<div class="podio-medal">'+medal+'</div>'+
      '<div class="podio-avatar">'+init+'</div>'+
      '<div class="podio-name">'+a.nombre+'</div>'+
      '<div class="podio-stars">'+repStar(a.totalEstrellas||0)+'</div>'+
      '<div class="podio-meta">'+(a.totalCapturas||0)+' cap · '+avg+' prom</div>'+
      '</div>';
  });
  html+='</div>';

  // tarjetas de todos los asesores
  lista.forEach(function(a,i){
    var pos=i+1;
    var init=a.nombre.split(' ').map(function(p){return p[0];}).join('').toUpperCase().slice(0,2);
    var avg=a.totalCapturas?(a.totalEstrellas/a.totalCapturas).toFixed(1):'—';
    var best=a.mejorTiempo?timerFmt(a.mejorTiempo):'—';
    var last=a.ultimaCaptura?new Date(a.ultimaCaptura).toLocaleDateString('es-MX'):'—';
    html+='<div class="rank-card">'+
      '<div class="rank-pos">'+pos+'</div>'+
      '<div class="rank-avatar">'+init+'</div>'+
      '<div class="rank-body">'+
        '<div class="rank-name">'+a.nombre+'</div>'+
        '<div class="rank-stats">'+
          '<span>⭐ '+(a.totalEstrellas||0)+' total</span>'+
          '<span>📊 '+avg+' prom</span>'+
          '<span>🏠 '+(a.totalCapturas||0)+' cap</span>'+
          (a.mejorTiempo?'<span>⚡ '+best+'</span>':'')+
        '</div>'+
        '<div class="rank-sub">'+
          (a.capturasCompletas?'<span>🌟 '+a.capturasCompletas+' completa(s)</span>':'')+
          (a.capturasEsenciales?'<span>✓ '+a.capturasEsenciales+' esencial(es)</span>':'')+
          (last!=='—'?'<span class="rank-last">Última: '+last+'</span>':'')+
        '</div>'+
      '</div>'+
      '</div>';
  });

  // asesores sin capturas al final
  var sinCap=full.filter(function(a){return !a.totalCapturas;});
  if(sinCap.length){
    html+='<div class="rank-sin-cap">Sin capturas: '+sinCap.map(function(a){return a.nombre;}).join(', ')+'</div>';
  }

  wrap.innerHTML=html;
}

/* ===================== HISTORIAL ===================== */
function histStars(n,quality){
  var s='';for(var i=0;i<3;i++)s+=(i<(n||0)?'⭐':'☆');
  return s+(quality?' <span class="hi-quality">'+quality+'</span>':'');
}
function getHist(){return load('hist',[]);}
function setHist(h){save('hist',h);updateBadge();}
function saveCapture(md,estatus,falt,stars,quality,elapsed){
  var h=getHist();
  var now=new Date().toISOString();
  var isEdit=!!state.editId;
  var id=isEdit?state.editId:genUUID();
  var orig=isEdit?h.filter(function(x){return x.id===id;})[0]:null;
  var capturadoEn=orig?(orig.capturadoEn||orig.fecha):now;
  var rec={
    id:id,fecha:now,
    capturadoEn:capturadoEn,modificadoEn:isEdit?now:null,
    asesorId:asesorActivo?asesorActivo.id:null,
    asesorNombre:asesorActivo?asesorActivo.nombre:($('f_resp').value||'S/I'),
    resp:$('f_resp').value,
    nombre:nombreBase(),direccion:$('f_direccion').value.trim(),zona:zonasSel.map(function(z){return z.n;}).join(' / ')||'S/I',
    tipo:state.tipo,oper:state.oper,estatus:estatus,fuente:fuenteVal().nombre,
    people:state.people.map(function(p){return (p.nombre||'?')+' ('+p.rol+')';}),
    anuncio:state.anuncioUrl||'',maps:$('f_maps').value,drive:$('f_drive').value,
    md:md,estado:falt.length?'Con faltantes':'Markdown generado',
    estrellas:stars||0,calidad:quality||'',elapsed:elapsed||0,
    faltantes:falt,copiado:false,enviado:false,edit:now,
    formData:snapshotForm()
  };
  if(isEdit)h=h.filter(function(x){return x.id!==id;});
  h.unshift(rec);setHist(h);
  zonasSel.forEach(function(z){zonaTouch(z.n);});
  if(CFG.endpoint){var p=buildGasPayload(rec);gasPost(p).then(function(r){if(r&&r.ok){var hh=getHist();var rr=hh.filter(function(x){return x.id===id;})[0];if(rr){rr.enviado=true;setHist(hh);}}}).catch(function(){queueForRetry(p);});}
  return id;
}
function renderHist(){
  var wrap=$('histList');
  // Build filters once
  var filt=$('histFilters');
  if(!filt.dataset.built){
    ['Todos','Pendientes','Enviados','Con faltantes'].forEach(function(f,i){
      var b=document.createElement('button');b.type='button';b.className='chip chip-sm'+(i===0?' sel':'');b.textContent=f;b.dataset.f=f;
      b.addEventListener('click',function(){filt.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');});b.classList.add('sel');_renderHistList(getHist());});
      filt.appendChild(b);
    });
    filt.dataset.built='1';
  }
  // Render local immediately
  _renderHistList(getHist());
  // Cloud sync in background (cloud is source of truth)
  if(CFG.endpoint){
    gasGet(function(data){
      if(data&&data.capturas&&data.capturas.length>1){
        var cloudRecs=gasCapturasToLocalHist(parseGasRows(data.capturas));
        var queueIds=load('gasqueue',[]).map(function(p){return p.id;});
        var localOnly=getHist().filter(function(r){return queueIds.indexOf(r.id)!==-1;});
        var merged=cloudRecs.concat(localOnly);
        merged.sort(function(a,b){return(b.fecha||'').localeCompare(a.fecha||'');});
        setHist(merged);
        _renderHistList(merged);
      }
    });
  }
}
function _renderHistList(h){
  var ctH=load('ct_hist',[]).map(function(r){return Object.assign({},r,{_isCt:true});});
  var all=h.concat(ctH).sort(function(a,b){return(b.fecha||'').localeCompare(a.fecha||'');});
  var filt=$('histFilters');
  var active=(filt.querySelector('.chip.sel')||{}).dataset?filt.querySelector('.chip.sel').dataset.f:'Todos';
  var list=all.filter(function(r){
    if(active==='Pendientes')return !r.enviado;
    if(active==='Enviados')return r.enviado;
    if(active==='Con faltantes')return !r._isCt&&r.faltantes&&r.faltantes.length;
    return true;
  });
  var wrap=$('histList');wrap.innerHTML='';
  if(!list.length){wrap.innerHTML='<div class="empty">Sin capturas todavía.</div>';return;}
  list.forEach(function(r){
    var item=document.createElement('div');
    var editDate=r.modificadoEn?'<br><span class="hi-edit-date">Editado: '+new Date(r.modificadoEn).toLocaleString('es-MX')+'</span>':'';
    if(r._isCt){
      item.className='hist-item hist-item-ct';
      var sc=r.enviado?'sent':'gen',st=r.enviado?'Enviado':'Generado';
      item.innerHTML='<div class="hi-top"><div>'+
        '<div class="hi-name"><span class="hi-ct-badge">🤝</span>'+esc(r.nombre||'Sin nombre')+'</div>'+
        (r.estrellas?'<div class="hi-stars">'+histStars(r.estrellas,r.calidad)+'</div>':'')+
        '<div class="hi-meta">'+esc(r.tipo||'?')+' · '+(r.tel||r.email||'S/I')+' · '+(r.asesor||'S/I')+
        '<br>'+new Date(r.capturadoEn||r.fecha).toLocaleString('es-MX')+editDate+'</div></div>'+
        '<span class="hi-state '+sc+'">'+st+'</span></div>'+
        '<div class="hi-actions">'+
          '<button type="button" class="btn" data-copy-ct="'+r.id+'">Copiar</button>'+
          '<button type="button" class="btn" data-view2-ct="'+r.id+'">Ver MD</button>'+
          '<button type="button" class="btn" data-edit-ct="'+r.id+'">Editar</button>'+
          (r.enviado?'<button type="button" class="btn" data-pend-ct="'+r.id+'">Marcar pendiente</button>':'<button type="button" class="btn" data-sent-ct="'+r.id+'">Marcar enviada</button>')+
          '<button type="button" class="btn btn-danger" data-del-ct="'+r.id+'">Borrar</button>'+
        '</div><pre style="display:none" id="md_ct_'+r.id+'">'+esc(r.md||'')+'</pre>';
    } else {
      item.className='hist-item';
      var sc=r.enviado?'sent':(r.faltantes&&r.faltantes.length?'miss':'gen');
      var st=r.enviado?'Enviada a Notion':(r.faltantes&&r.faltantes.length?'Con faltantes':'Generada');
      item.innerHTML='<div class="hi-top"><div><div class="hi-name">'+esc(r.nombre||'Sin nombre')+'</div>'+
        (r.estrellas!=null?'<div class="hi-stars">'+histStars(r.estrellas,r.calidad)+'</div>':'')+
        '<div class="hi-meta">'+(r.tipo||'?')+' · '+(r.oper||'?')+' · '+(r.zona||'?')+' · '+(r.asesorNombre||r.resp||'S/I')+
        '<br>'+new Date(r.capturadoEn||r.fecha).toLocaleString('es-MX')+editDate+'</div></div>'+
        '<span class="hi-state '+sc+'">'+st+'</span></div>'+
        '<div class="hi-actions">'+
          '<button type="button" class="btn" data-copy="'+r.id+'">Copiar MD</button>'+
          '<button type="button" class="btn" data-view2="'+r.id+'">Ver MD</button>'+
          (r.maps?'<button type="button" class="btn" data-maps="'+r.id+'">Maps</button>':'')+
          '<button type="button" class="btn" data-edit-prop="'+r.id+'">Editar</button>'+
          (r.enviado?'<button type="button" class="btn" data-pend="'+r.id+'">Marcar pendiente</button>':'<button type="button" class="btn" data-sent="'+r.id+'">Marcar enviada</button>')+
          '<button type="button" class="btn btn-danger" data-del2="'+r.id+'">Borrar</button>'+
        '</div><pre style="display:none" id="md_'+r.id+'">'+esc(r.md||'')+'</pre>';
    }
    wrap.appendChild(item);
  });
}
$('histList').addEventListener('click',function(e){
  var t=e.target;var h=getHist();
  function find(id){return h.filter(function(r){return r.id===id;})[0];}
  function findCt(id){var ch=load('ct_hist',[]);return ch.filter(function(r){return r.id===id;})[0];}
  // Propiedades
  if(t.dataset.copy){var r=find(t.dataset.copy);if(r){copyText(r.md);r.copiado=true;setHist(h);t.textContent='Copiado ✓';}}
  if(t.dataset.view2){var pre=$('md_'+t.dataset.view2);if(pre)pre.style.display=pre.style.display==='none'?'block':'none';}
  if(t.dataset.maps){var r2=find(t.dataset.maps);if(r2&&r2.maps)window.open(r2.maps,'_blank');}
  if(t.dataset.editProp){abrirEdicion(t.dataset.editProp);}
  if(t.dataset.sent){find(t.dataset.sent).enviado=true;setHist(h);_renderHistList(h);}
  if(t.dataset.pend){find(t.dataset.pend).enviado=false;setHist(h);_renderHistList(h);}
  if(t.dataset.del2){if(confirm('¿Borrar esta captura del historial?')){h=h.filter(function(r){return r.id!==t.dataset.del2;});setHist(h);_renderHistList(h);}}
  // Contactos
  if(t.dataset.copyCt){var rc=findCt(t.dataset.copyCt);if(rc){copyText(rc.md);t.textContent='Copiado ✓';}}
  if(t.dataset.view2Ct){var pre2=$('md_ct_'+t.dataset.view2Ct);if(pre2)pre2.style.display=pre2.style.display==='none'?'block':'none';}
  if(t.dataset.editCt){abrirEdicionCt(t.dataset.editCt);}
  if(t.dataset.sentCt){var ch=load('ct_hist',[]);var rc2=ch.filter(function(r){return r.id===t.dataset.sentCt;})[0];if(rc2){rc2.enviado=true;save('ct_hist',ch);updateCtBadge();_renderHistList(getHist());}}
  if(t.dataset.pendCt){var ch=load('ct_hist',[]);var rc3=ch.filter(function(r){return r.id===t.dataset.pendCt;})[0];if(rc3){rc3.enviado=false;save('ct_hist',ch);updateCtBadge();_renderHistList(getHist());}}
  if(t.dataset.delCt){if(confirm('¿Borrar este contacto del historial?')){var ch=load('ct_hist',[]);save('ct_hist',ch.filter(function(r){return r.id!==t.dataset.delCt;}));updateCtBadge();_renderHistList(getHist());}}
});
function updateBadge(){
  var pend=getHist().filter(function(r){return !r.enviado;}).length;
  var pendCt=load('ct_hist',[]).filter(function(r){return !r.enviado;}).length;
  var b=$('navBadge');var total=pend+pendCt;b.textContent=total;b.style.display=total?'block':'none';
}
updateBadge();

/* ===================== COPIAR / COMPARTIR ===================== */
function copyText(s){
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).catch(fb);
  else fb();
  function fb(){var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);}
}
$('btnCopy').addEventListener('click',function(){
  copyText(mdActual);var b=$('btnCopy');b.classList.add('copied');b.textContent='Copiado ✓';
  if(lastCaptureId){var h=getHist();var r=h.filter(function(x){return x.id===lastCaptureId;})[0];if(r){r.copiado=true;setHist(h);}}
  setTimeout(function(){b.classList.remove('copied');b.textContent='Copiar markdown';},1800);
});
$('btnShare').addEventListener('click',function(){
  if(navigator.share)navigator.share({title:'Captura de propiedad — Hauser',text:mdActual}).catch(function(){});
  else alert('Tu navegador no permite compartir directo. Usa "Copiar markdown".');
});
$('btnMarkSent').addEventListener('click',function(){
  if(lastCaptureId){var h=getHist();var r=h.filter(function(x){return x.id===lastCaptureId;})[0];if(r){r.enviado=true;setHist(h);}this.textContent='Enviada ✓';}
});

/* ===================== GUARDAR sin generar ===================== */
$('btnSave').addEventListener('click',function(){
  var h=getHist();
  h.unshift({id:genUUID(),fecha:new Date().toISOString(),resp:$('f_resp').value,
    nombre:nombreBase(),direccion:$('f_direccion').value.trim(),zona:zonasSel.map(function(z){return z.n;}).join(' / ')||'S/I',tipo:state.tipo,oper:state.oper,
    estatus:$('f_estatus').value,fuente:fuenteVal().nombre,people:[],anuncio:state.anuncioUrl||'',
    maps:$('f_maps').value,drive:$('f_drive').value,md:'(borrador sin markdown)',estado:'Borrador',
    faltantes:[],copiado:false,enviado:false,edit:new Date().toISOString()});
  setHist(h);
  this.textContent='Guardada ✓';var self=this;setTimeout(function(){self.textContent='💾 Guardar captura (sin generar)';},1800);
});

/* ===================== IA: AJUSTES ===================== */
$('btnAI').addEventListener('click',function(){
  var instr=$('aiInput').value.trim();
  if(!instr){$('aiStatus').textContent='Escribe primero qué cambiar.';return;}
  if(!mdActual){$('aiStatus').textContent='Genera primero el markdown.';return;}
  $('btnAI').disabled=true;$('aiStatus').className='status';$('aiStatus').textContent='Aplicando ajustes…';
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:
'Eres editor de instrucciones para un agente de Notion (inmobiliaria Hauser, Cuernavaca). Markdown actual:\n\n'+mdActual+
'\n\nInstrucción del usuario: "'+instr+'"\n\nReglas: no inventes datos; respeta S/I y N/A; convierte números en palabras a dígitos; mantén la estructura y la tabla de campos. Responde ÚNICAMENTE con el markdown completo actualizado, sin preámbulo ni backticks.'}]})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    var out=(d.content||[]).filter(function(x){return x.type==='text';}).map(function(x){return x.text;}).join('\n').replace(/```(markdown)?/g,'').trim();
    if(out){mdActual=out;$('mdOut').textContent=out;$('aiStatus').className='status ok';$('aiStatus').textContent='✓ Listo. Revisa y vuelve a copiar.';$('aiInput').value='';}
    else{$('aiStatus').className='status err';$('aiStatus').textContent='No llegó respuesta de la IA.';}
  })
  .catch(function(){$('aiStatus').className='status err';$('aiStatus').textContent='No se pudo conectar a la IA (solo funciona dentro de Claude o con backend).';})
  .finally(function(){$('btnAI').disabled=false;});
});

/* ===================== BACKEND GAS — Fase 2B ===================== */
function genUUID(){return 'CAP-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substr(2,8).toUpperCase();}
function parseGasRows(rows){if(!rows||rows.length<2)return[];var h=rows[0];return rows.slice(1).map(function(r){var o={};h.forEach(function(k,i){o[k]=r[i];});return o;});}
function gasPost(payload){
  if(!CFG.endpoint)return Promise.reject(new Error('sin endpoint'));
  return fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify(payload)}).then(function(r){return r.json();});
}
function gasGet(cb){
  if(!CFG.endpoint){cb(null);return;}
  fetch(CFG.endpoint).then(function(r){return r.json();}).then(function(d){cb(d.ok?d:null);}).catch(function(){cb(null);});
}
function queueForRetry(payload){var q=load('gasqueue',[]);q.push(payload);save('gasqueue',q);}
function processQueue(){
  if(!CFG.endpoint)return;
  var q=load('gasqueue',[]);if(!q.length)return;
  gasPost(q[0]).then(function(){var q2=load('gasqueue',[]);q2.shift();save('gasqueue',q2);if(q2.length)setTimeout(processQueue,500);}).catch(function(){});
}
function buildGasPayload(rec){
  var now=new Date().toISOString();
  return{id:rec.id,timestamp:rec.fecha||now,tipo:'propiedad',asesor:rec.asesorNombre||rec.resp||'S/I',
    estrellas:rec.estrellas||0,calidad:rec.calidad||'',propiedad_json:JSON.stringify(rec),contacto_json:'',
    capturadoEn:rec.fecha||now,modificadoEn:rec.edit||now};
}
function buildGasPayloadContact(rec){
  var now=new Date().toISOString();
  return{id:rec.id,timestamp:rec.fecha||now,tipo:'contacto',asesor:rec.asesor||'S/I',
    estrellas:0,calidad:'',propiedad_json:'',contacto_json:JSON.stringify(rec),
    capturadoEn:rec.fecha||now,modificadoEn:rec.fecha||now};
}
function gasCapturasToLocalHist(capturas){
  return capturas.filter(function(c){return c.tipo==='propiedad';}).map(function(c){
    try{var r=JSON.parse(c.propiedad_json);r.enviado=true;return r;}
    catch(e){return{id:c.id,fecha:c.capturadoEn||c.timestamp,asesorNombre:c.asesor,
      tipo:'',oper:'',zona:'S/I',estrellas:parseInt(c.estrellas)||0,calidad:c.calidad||'',
      md:'',nombre:'(sin nombre)',estado:'Sincronizado',faltantes:[],copiado:false,enviado:true};}
  });
}
// Retry queue en startup
if(CFG.endpoint)setTimeout(processQueue,3000);
// Stub para acciones legadas (Drive) no soportadas por GAS v2B
function api(action){return Promise.reject(new Error('No implementado: '+action));}

$('cfg_resp').addEventListener('change',function(){
  var n=this.value;CFG.resp=n;save('cfg',CFG);$('f_resp').value=n;
  var lista=getAsesores();
  var found=lista.filter(function(a){return a.nombre===n;})[0];
  if(found){asesorActivo=found;save('asesor_activo',found);var badge=$('asesorBadge');if(badge)badge.textContent='👤 '+n;}
});
$('cfg_drive').addEventListener('input',function(){CFG.drive=this.value;save('cfg',CFG);refreshDrive();});
$('cfg_endpoint').addEventListener('input',function(){CFG.endpoint=this.value.trim();save('cfg',CFG);});
$('cfg_test').addEventListener('click',function(){
  if(!CFG.endpoint){$('cfgStatus').textContent='Pega primero el endpoint.';return;}
  $('cfgStatus').className='status';$('cfgStatus').textContent='Probando conexión…';
  gasGet(function(data){
    if(data){$('cfgStatus').className='status ok';$('cfgStatus').textContent='✓ Conectado · '+(data.capturas?data.capturas.length-1:0)+' capturas en la nube';}
    else{$('cfgStatus').className='status err';$('cfgStatus').textContent='No respondió. Revisa la URL y que esté publicado con acceso "Cualquier persona".';}
  });
});
$('cfg_sync').addEventListener('click',function(){
  if(!CFG.endpoint){$('cfgStatus').textContent='Configura primero el endpoint.';return;}
  var hist=getHist();$('cfgStatus').textContent='Enviando '+hist.length+' capturas a la nube…';
  var done=0,errs=0;
  var total=hist.length;
  if(!total){$('cfgStatus').className='status ok';$('cfgStatus').textContent='No hay capturas locales.';return;}
  hist.forEach(function(rec){
    gasPost(buildGasPayload(rec)).then(function(){done++;if(done+errs===total){save('gasqueue',[]);$('cfgStatus').className='status ok';$('cfgStatus').textContent='✓ '+done+' capturas sincronizadas'+(errs?' ('+errs+' con error)':'')+'.';}}).catch(function(){errs++;queueForRetry(buildGasPayload(rec));if(done+errs===total){$('cfgStatus').className='status err';$('cfgStatus').textContent=done+' OK · '+errs+' en cola para reintentar.';}});
  });
});
$('cfg_export').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify(getHist(),null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='historial_capturas.json';a.click();
});
function renderCfgCount(){
  var q=load('gasqueue',[]).length;
  $('cfgCount').textContent=getHist().length+' captura(s) en este dispositivo'+(q?' · '+q+' pendiente(s) de sincronizar':'')+(CFG.endpoint?' · endpoint activo':' · sin endpoint');
}

/* config de sonidos */
function renderSndCfg(){
  var tog=$('cfg_snd_toggle');if(tog)tog.textContent=sndCfg.on?'🔊 Activados':'🔇 Silenciados';
  var vol=$('cfg_snd_vol');if(vol)vol.value=Math.round(sndCfg.vol*100);
  var v=$('cfg_snd_vol_val');if(v)v.textContent=Math.round(sndCfg.vol*100)+'%';
}
$('cfg_snd_toggle').addEventListener('click',function(){
  sndCfg.on=!sndCfg.on;save('cfg_sounds',sndCfg);renderSndCfg();
  if(sndCfg.on)sndClick();
});
$('cfg_snd_vol').addEventListener('input',function(){
  sndCfg.vol=parseInt(this.value)/100;save('cfg_sounds',sndCfg);
  var v=$('cfg_snd_vol_val');if(v)v.textContent=this.value+'%';
});
$('cfg_snd_test').addEventListener('click',function(){sndSuccess();});
renderSndCfg();

/* ===================== RESET ===================== */
function doReset(){
  document.querySelectorAll('#viewCapture input,#viewCapture textarea').forEach(function(i){if(i.type!=='date')i.value='';i.disabled=false;i.removeAttribute('data-manual');});
  document.querySelectorAll('.si-btn').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.na-btn').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('#viewCapture .chip').forEach(function(c){c.classList.remove('sel');});
  state={tipo:'',oper:'Venta',ofrece:'',crm:'No',modo:'A · Reventa de lote',madre:'No, solo individuales',driveShare:'Sí, carpeta común',serv:[],caract:[],caractTerr:[],lat:null,lng:null,people:[],editId:null,rentaMin:''};
  setChip('operChips','oper','Venta',onOper);setChip('modoChips','modo','A · Reventa de lote');
  setChip('madreChips','madre','No, solo individuales');setChip('driveShareChips','driveShare','Sí, carpeta común');
  setChip('crmChips','crm','No');
  buildCaract();renderCaractTerr();renderCRM();
  $('f_unidades').value=1;$('f_comision').value='4%';if(asesorActivo)syncAsesor();else $('f_resp').value=CFG.resp;
  $('f_fecha').value=hoy;$('f_seguimiento').value=hoy;$('f_estatus').value='En análisis';
  zonasSel=[];renderZonasTags();$('f_zona').value='';$('zonaHint').textContent='';
  $('f_fuente').value='Recorrido/Scouteo';$('boxFuenteOtra').style.display='none';
  ['unitsBox','terrenoExtra','dirSuggest','zonaSuggest'].forEach(function(id){$(id).style.display='none';});
  document.querySelectorAll('[data-construccion]').forEach(function(el){el.style.display='';});
  ['n_precio','n_precio_renta','n_m2t','n_m2c','geoStatus','anuncioStatus','aiStatus','driveStatus','estatusHint'].forEach(function(id){$(id).textContent='';});
  delete $('f_drive').dataset.manual;refreshDrive();
  $('outputArea').style.display='none';$('btnFotos').disabled=true;
  resetTimerToReady();
  // Limpiar modo edición
  var eb=$('editBanner');if(eb)eb.style.display='none';
  var bg=$('btnGen');if(bg)bg.textContent='Generar Markdown';
  updateProgress();window.scrollTo({top:0,behavior:'smooth'});
}
$('btnReset').addEventListener('click',function(){
  if(!confirm('¿Limpiar todos los campos? (El historial NO se borra)'))return;
  doReset();
});

/* ===================== EDICIÓN DE CAPTURAS — FASE 3 ===================== */
function snapshotForm(){
  var snap={};
  document.querySelectorAll('#viewCapture input,#viewCapture textarea,#viewCapture select').forEach(function(el){
    if(el.id)snap[el.id]=el.value;
  });
  document.querySelectorAll('#viewCapture .si-btn').forEach(function(b){
    if(b.dataset.for)snap['_si_'+b.dataset.for]=b.classList.contains('active');
  });
  document.querySelectorAll('#viewCapture .na-btn').forEach(function(b){
    if(b.dataset.forNa)snap['_na_'+b.dataset.forNa]=b.classList.contains('active');
  });
  snap._state=JSON.parse(JSON.stringify(state));
  snap._zonasSel=zonasSel.slice();
  return snap;
}
function restoreForm(snap){
  if(!snap)return;
  if(snap._state){var s=snap._state;
    state.tipo=s.tipo||'';state.oper=s.oper||'Venta';state.ofrece=s.ofrece||'';
    state.crm=s.crm||'No';state.modo=s.modo||'A · Reventa de lote';
    state.madre=s.madre||'No, solo individuales';state.driveShare=s.driveShare||'Sí, carpeta común';
    state.serv=s.serv||[];state.caract=s.caract||[];state.caractTerr=s.caractTerr||[];
    state.lat=s.lat||null;state.lng=s.lng||null;state.people=s.people||[];
    state.rentaMin=s.rentaMin||'';state.anuncioUrl=s.anuncioUrl||'';
  }
  if(state.tipo)setChip('tipoChips','tipo',state.tipo,onTipo);else onTipo('');
  setChip('operChips','oper',state.oper||'Venta',onOper);
  if(state.ofrece)setChip('ofreceChips','ofrece',state.ofrece,onOfrece);
  setChip('crmChips','crm',state.crm||'No');
  if(state.modo)setChip('modoChips','modo',state.modo);
  if(state.madre)setChip('madreChips','madre',state.madre);
  if(state.driveShare)setChip('driveShareChips','driveShare',state.driveShare);
  if(state.rentaMin)setChip('rentaMinChips','rentaMin',state.rentaMin);
  Object.keys(snap).forEach(function(k){
    if(k.startsWith('_'))return;
    var el=$(k);if(el)el.value=snap[k];
  });
  document.querySelectorAll('#viewCapture .si-btn').forEach(function(b){
    b.classList.toggle('active',!!snap['_si_'+b.dataset.for]);
  });
  document.querySelectorAll('#viewCapture .na-btn').forEach(function(b){
    if(snap['_na_'+b.dataset.forNa])setNaState(b.dataset.forNa,true);
  });
  if(snap._zonasSel){zonasSel=snap._zonasSel.slice();renderZonasTags();updateHintZona();}
  buildCaract();renderCaractTerr();renderCRM();
  refreshDrive();updateProgress();
}
function abrirEdicion(id){
  var h=getHist();var rec=h.filter(function(r){return r.id===id;})[0];
  if(!rec){alert('Captura no encontrada.');return;}
  doReset();
  state.editId=id;
  if(rec.formData){
    restoreForm(rec.formData);
  } else {
    if(rec.tipo)setChip('tipoChips','tipo',rec.tipo,onTipo);
    if(rec.oper)setChip('operChips','oper',rec.oper,onOper);
    if(rec.estatus)$('f_estatus').value=rec.estatus;
    if(rec.zona&&rec.zona!=='S/I'){var zn=rec.zona.split(' / ');zn.forEach(function(n){addZona(n.trim(),false);});}
  }
  var eb=$('editBanner');var ebn=$('editBannerNombre');
  if(eb){eb.style.display='';if(ebn)ebn.textContent=rec.nombre||'(sin nombre)';}
  var bg=$('btnGen');if(bg)bg.textContent='Actualizar captura';
  showView('viewCapture');
}
$('btnCancelEdit').addEventListener('click',function(){doReset();showView('viewHistory');});

// -- Contactos --
var ctEditId=null;var ctCapturadoEn=null;
function calcCtStars(){
  var s1=!!(ctVal('ct_nombre')&&ctState.tipos.length&&ctVal('ct_tel'));
  var s2=s1&&!!(ctVal('ct_email')||($('ct_fuente')&&$('ct_fuente').value));
  var s3=s2&&!!(ctVal('ct_zona_interes')||ctVal('ct_zona_oper')||ctVal('ct_zona_oper_aliado'));
  return{count:s3?3:s2?2:s1?1:0,s1:s1,s2:s2,s3:s3};
}
function snapshotCtForm(){
  var snap={};
  document.querySelectorAll('#viewContact input,#viewContact textarea,#viewContact select').forEach(function(el){
    if(el.id)snap[el.id]=el.value;
  });
  snap._ctState=JSON.parse(JSON.stringify(ctState));
  return snap;
}
function restoreCtForm(snap){
  if(!snap)return;
  if(snap._ctState){Object.assign(ctState,snap._ctState);
    // backwards compat: old records stored tipo as string
    if(!Array.isArray(ctState.tipos)){ctState.tipos=ctState.tipo?[ctState.tipo]:[];delete ctState.tipo;}
    document.querySelectorAll('#ctTipoChips .chip').forEach(function(c){c.classList.toggle('sel',ctState.tipos.indexOf(c.dataset.v)>=0);});
    ctOnTipos();
    ['ctConfianzaChips','ctUrgenciaChips','ctConfianzaAliado','ctEstatusChips'].forEach(function(cid){
      var key={ctConfianzaChips:'confianza',ctUrgenciaChips:'urgencia',ctConfianzaAliado:'confianzaAliado',ctEstatusChips:'estatus'}[cid];
      var w=$(cid);if(!w)return;
      w.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('sel',c.dataset.v===ctState[key]);});
    });
  }
  Object.keys(snap).forEach(function(k){
    if(k.startsWith('_'))return;
    var el=$(k);if(el)el.value=snap[k];
  });
  ctUpdateProgress();
}
function abrirEdicionCt(id){
  var h=load('ct_hist',[]);var rec=h.filter(function(r){return r.id===id;})[0];
  if(!rec){alert('Contacto no encontrado.');return;}
  $('ctBtnReset').click();
  ctEditId=id;ctCapturadoEn=rec.capturadoEn||rec.fecha;
  if(rec.formData){
    restoreCtForm(rec.formData);
  } else {
    if(rec.nombre)$('ct_nombre').value=rec.nombre;
    if(rec.tel)$('ct_tel').value=rec.tel;
    if(rec.email)$('ct_email').value=rec.email;
    if(rec.asesor)$('ct_asesor').value=rec.asesor;
  }
  var eb=$('ctEditBanner');var ebn=$('ctEditBannerNombre');
  if(eb){eb.style.display='';if(ebn)ebn.textContent=rec.nombre||'(sin nombre)';}
  var bg=$('ctBtnGenerar');if(bg)bg.textContent='Actualizar contacto';
  showView('viewContact');
}
$('btnCancelEditCt').addEventListener('click',function(){
  ctEditId=null;ctCapturadoEn=null;
  var eb=$('ctEditBanner');if(eb)eb.style.display='none';
  var bg=$('ctBtnGenerar');if(bg)bg.textContent='Generar markdown';
  $('ctBtnReset').click();showView('viewHistory');
});

/* ===================== CONTACTOS — FASE 7 ===================== */
var CT_COMPRADOR=['Comprador','Inversionista'];
var CT_PROPIETARIO=['Propietario','Desarrollador'];
var CT_ALIADO=['Arquitecto','Notario','Maestro de obra','Broker','Asesor inmobiliario'];

var ctState={tipos:[],confianza:'',estatus:'Nuevo',urgencia:'',confianzaAliado:''};
var ctMd='';

function ctVal(id){var el=$(id);return el?el.value.trim():'';}
function ctSI(v){return v||'S/I';}

function ctOnTipos(){
  var ts=ctState.tipos;
  var esCom=ts.some(function(v){return CT_COMPRADOR.indexOf(v)>=0;});
  var esProp=ts.some(function(v){return CT_PROPIETARIO.indexOf(v)>=0;});
  var esAliado=ts.some(function(v){return CT_ALIADO.indexOf(v)>=0;});
  $('ctOtroTipoBox').style.display=(ts.indexOf('Otro')>=0)?'':'none';
  $('ctSecOper').style.display=(esCom||esProp||esAliado)?'':'none';
  $('ctSecComprador').style.display=esCom?'':'none';
  $('ctSecPropietario').style.display=esProp?'':'none';
  $('ctSecAliado').style.display=esAliado?'':'none';
  $('ctConfianzaRow').style.display=(!esCom&&!esProp&&esAliado)?'none':'';
  ctUpdateProgress();
}

function ctUpdateProgress(){
  var kNombre=ctVal('ct_nombre')?1:0;
  var kTipo=ctState.tipos.length?1:0;
  var kContacto=(ctVal('ct_tel')||ctVal('ct_wa')||ctVal('ct_email'))?1:0;
  var filled=kNombre+kTipo+kContacto;
  var extras=[ctVal('ct_alias'),ctVal('ct_empresa'),ctVal('ct_puesto'),ctVal('ct_notas'),
    ctVal('ct_proxima'),ctVal('ct_seguimiento'),ctVal('ct_asesor'),
    $('ct_fuente')&&$('ct_fuente').value,ctState.confianza,ctState.estatus];
  var extFilled=extras.filter(function(f){return !!f;}).length;
  var pct=Math.round((filled/3*0.7+extFilled/extras.length*0.3)*100);
  var fill=$('ctProgFill');if(fill)fill.style.width=pct+'%';
  var pctEl=$('ctProgPct');if(pctEl)pctEl.textContent=pct+'%';
  var txtEl=$('ctProgText');if(txtEl)txtEl.textContent=filled+'/3 datos clave';
}

function ctWireChips(containerId,stateProp){
  var wrap=$(containerId);if(!wrap)return;
  wrap.querySelectorAll('.chip').forEach(function(btn){
    btn.addEventListener('click',function(){
      wrap.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel');});
      btn.classList.add('sel');
      ctState[stateProp]=btn.dataset.v;
      ctUpdateProgress();
    });
  });
}
ctWireChips('ctConfianzaChips','confianza');
ctWireChips('ctEstatusChips','estatus');
ctWireChips('ctUrgenciaChips','urgencia');
ctWireChips('ctConfianzaAliado','confianzaAliado');

$('ctTipoChips').addEventListener('click',function(e){
  var c=e.target.closest('.chip');if(!c)return;
  c.classList.toggle('sel');
  var v=c.dataset.v;var idx=ctState.tipos.indexOf(v);
  if(idx>=0)ctState.tipos.splice(idx,1);else ctState.tipos.push(v);
  ctOnTipos();
});

['ct_nombre','ct_alias','ct_empresa','ct_puesto','ct_tel','ct_wa','ct_email',
 'ct_presupuesto','ct_zona_interes','ct_tipo_busca','ct_zona_oper','ct_tipo_ofrece',
 'ct_propiedad_rel','ct_zona_oper_aliado','ct_servicio','ct_otro_tipo',
 'ct_proxima','ct_seguimiento','ct_asesor','ct_notas',
 'ct_notas_busca','ct_notas_oferta','ct_notas_servicio'].forEach(function(id){
  var el=$(id);if(el)el.addEventListener('input',ctUpdateProgress);
});

function genContact(){
  var nombre=ctVal('ct_nombre');
  if(!nombre){alert('El nombre completo es obligatorio.');return;}
  if(!ctState.tipos.length){alert('Selecciona al menos un tipo de contacto.');return;}
  var tipo=ctState.tipos.map(function(v){return v==='Otro'?(ctVal('ct_otro_tipo')||'Otro'):v;}).join(' / ');
  var now=new Date();
  var fecha=now.toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'});
  var isCtEdit=!!ctEditId;
  var id=isCtEdit?ctEditId:('CT-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substr(2,8).toUpperCase());
  var asesor=ctVal('ct_asesor')||CFG.resp||'S/I';
  var esCom=ctState.tipos.some(function(v){return CT_COMPRADOR.indexOf(v)>=0;});
  var esProp=ctState.tipos.some(function(v){return CT_PROPIETARIO.indexOf(v)>=0;});
  var esAliado=ctState.tipos.some(function(v){return CT_ALIADO.indexOf(v)>=0;});

  var md='# Alta de contacto en Notion — '+nombre+'\n\n';
  md+='> **Acción:** Crear nuevo registro en base **Contactos / CRM**.\n\n';
  md+='## Identificación\n| Campo | Valor |\n|---|---|\n';
  md+='| Nombre completo | '+nombre+' |\n';
  md+='| Alias | '+ctSI(ctVal('ct_alias'))+' |\n';
  md+='| Tipo | '+tipo+' |\n';
  md+='| Empresa | '+ctSI(ctVal('ct_empresa'))+' |\n';
  md+='| Puesto | '+ctSI(ctVal('ct_puesto'))+' |\n\n';
  md+='## Datos de contacto\n| Campo | Valor |\n|---|---|\n';
  md+='| Teléfono | '+ctSI(ctVal('ct_tel'))+' |\n';
  md+='| WhatsApp | '+ctSI(ctVal('ct_wa'))+' |\n';
  md+='| Correo | '+ctSI(ctVal('ct_email'))+' |\n\n';

  if(esCom){
    md+='## Búsqueda\n| Campo | Valor |\n|---|---|\n';
    md+='| Presupuesto | '+ctSI(ctVal('ct_presupuesto'))+' |\n';
    md+='| Zona de interés | '+ctSI(ctVal('ct_zona_interes'))+' |\n';
    md+='| Tipo de propiedad que busca | '+ctSI(ctVal('ct_tipo_busca'))+' |\n';
    md+='| Urgencia | '+ctSI(ctState.urgencia)+' |\n';
    if(ctVal('ct_notas_busca'))md+='| Notas | '+ctVal('ct_notas_busca')+' |\n';
    md+='\n';
  }
  if(esProp){
    md+='## Oferta\n| Campo | Valor |\n|---|---|\n';
    md+='| Zona de operación | '+ctSI(ctVal('ct_zona_oper'))+' |\n';
    md+='| Tipo de propiedad que ofrece | '+ctSI(ctVal('ct_tipo_ofrece'))+' |\n';
    md+='| Propiedad relacionada | '+ctSI(ctVal('ct_propiedad_rel'))+' |\n';
    if(ctVal('ct_notas_oferta'))md+='| Notas | '+ctVal('ct_notas_oferta')+' |\n';
    md+='\n';
    if(ctVal('ct_propiedad_rel')){md+='> ⚠️ Si la propiedad existe en la base, vincular en el campo **Propiedades** de este contacto.\n\n';}
  }
  if(esAliado){
    md+='## Servicio\n| Campo | Valor |\n|---|---|\n';
    md+='| Zona de operación | '+ctSI(ctVal('ct_zona_oper_aliado'))+' |\n';
    md+='| Servicio que ofrece | '+ctSI(ctVal('ct_servicio'))+' |\n';
    md+='| Nivel de confianza | '+ctSI(ctState.confianzaAliado)+' |\n';
    if(ctVal('ct_notas_servicio'))md+='| Notas | '+ctVal('ct_notas_servicio')+' |\n';
    md+='\n';
  }
  md+='## Gestión\n| Campo | Valor |\n|---|---|\n';
  md+='| Fuente | '+ctSI($('ct_fuente')&&$('ct_fuente').value)+' |\n';
  if(!esAliado||esCom||esProp)md+='| Nivel de confianza | '+ctSI(ctState.confianza)+' |\n';
  md+='| Estatus | '+(ctState.estatus||'Nuevo')+' |\n';
  md+='| Próxima acción | '+ctSI(ctVal('ct_proxima'))+' |\n';
  md+='| Fecha de seguimiento | '+ctSI(ctVal('ct_seguimiento'))+' |\n\n';
  if(ctVal('ct_notas'))md+='## Notas\n'+ctVal('ct_notas')+'\n\n';
  md+='---\nCapturado por: **'+asesor+'** · '+fecha+' · ID provisional: `'+id+'`\n';

  ctMd=md;
  $('ctMdOut').textContent=md;
  $('ctOutputArea').style.display='';
  $('ctOutputArea').scrollIntoView({behavior:'smooth',block:'start'});
  var ctStars=calcCtStars();
  var ctSnap=snapshotCtForm();
  saveContactHist({id:id,fecha:now.toISOString(),
    capturadoEn:isCtEdit?ctCapturadoEn:now.toISOString(),
    modificadoEn:isCtEdit?now.toISOString():null,
    nombre:nombre,tipo:tipo,
    tel:ctVal('ct_tel'),email:ctVal('ct_email'),
    asesorId:asesorActivo?asesorActivo.id:null,
    asesor:asesor,md:md,enviado:false,
    estrellas:ctStars.count,calidad:['','Esencial','Publicable','Completa'][ctStars.count]||'',
    formData:ctSnap});
  sndSuccess();
}

function saveContactHist(rec){
  if(!rec.id)rec.id='CT-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substr(2,8).toUpperCase();
  if(!rec.fecha)rec.fecha=new Date().toISOString();
  var h=load('ct_hist',[]);
  h=h.filter(function(x){return x.id!==rec.id;}); // upsert: remove old version
  h.unshift(rec);save('ct_hist',h);
  // Limpiar modo edición de contacto
  ctEditId=null;ctCapturadoEn=null;
  var eb=$('ctEditBanner');if(eb)eb.style.display='none';
  var bg=$('ctBtnGenerar');if(bg)bg.textContent='Generar markdown';
  updateCtBadge();renderCtHist();
  if(CFG.endpoint){var p=buildGasPayloadContact(rec);gasPost(p).catch(function(){queueForRetry(p);});}
}
function updateCtBadge(){
  var pend=load('ct_hist',[]).filter(function(r){return !r.enviado;}).length;
  var b=$('ctBadge');if(!b)return;
  b.textContent=pend;b.style.display=pend?'inline-flex':'none';
}
function renderCtHist(){
  var h=load('ct_hist',[]);var wrap=$('ctHistList');if(!wrap)return;
  if(!h.length){wrap.innerHTML='<div class="empty">Sin contactos capturados.</div>';return;}
  var html='';
  h.forEach(function(r){
    html+='<div class="hist-item">'+
      '<div class="hi-top"><div>'+
        '<div class="hi-name">'+esc(r.nombre)+'</div>'+
        '<div class="hi-meta">'+(r.tipo||'?')+' · '+(r.asesor||'S/I')+' · '+new Date(r.fecha).toLocaleString('es-MX')+'</div>'+
      '</div><span class="hi-state '+(r.enviado?'sent':'gen')+'">'+(r.enviado?'Enviado':'Generado')+'</span></div>'+
      '<div class="hi-actions">'+
        '<button type="button" class="btn" data-ct-copy="'+r.id+'">Copiar MD</button>'+
        (r.enviado?
          '<button type="button" class="btn" data-ct-pend="'+r.id+'">Marcar pendiente</button>':
          '<button type="button" class="btn" data-ct-sent="'+r.id+'">Marcar enviado</button>')+
        '<button type="button" class="btn btn-danger" data-ct-del="'+r.id+'">Borrar</button>'+
      '</div></div>';
  });
  wrap.innerHTML=html;
}
$('ctHistList').addEventListener('click',function(e){
  var t=e.target;var h=load('ct_hist',[]);
  function ctFind(id){return h.filter(function(r){return r.id===id;})[0];}
  if(t.dataset.ctCopy){var rc=ctFind(t.dataset.ctCopy);if(rc)copyText(rc.md);t.textContent='Copiado ✓';}
  if(t.dataset.ctSent){var rs=ctFind(t.dataset.ctSent);if(rs){rs.enviado=true;save('ct_hist',h);updateCtBadge();renderCtHist();}}
  if(t.dataset.ctPend){var rp=ctFind(t.dataset.ctPend);if(rp){rp.enviado=false;save('ct_hist',h);updateCtBadge();renderCtHist();}}
  if(t.dataset.ctDel){if(confirm('¿Borrar este contacto del historial?')){var nh=h.filter(function(r){return r.id!==t.dataset.ctDel;});save('ct_hist',nh);updateCtBadge();renderCtHist();}}
});
$('ctBtnGenerar').addEventListener('click',genContact);
$('ctBtnCopy').addEventListener('click',function(){
  copyText(ctMd);var b=$('ctBtnCopy');b.textContent='Copiado ✓';
  setTimeout(function(){b.textContent='Copiar markdown';},1800);
});
$('ctBtnReset').addEventListener('click',function(){
  if(!confirm('¿Limpiar el formulario de contacto?'))return;
  ctDoReset();
});
function ctDoReset(){
  ['ct_nombre','ct_alias','ct_empresa','ct_puesto','ct_tel','ct_wa','ct_email',
   'ct_presupuesto','ct_zona_interes','ct_tipo_busca','ct_zona_oper','ct_tipo_ofrece',
   'ct_propiedad_rel','ct_zona_oper_aliado','ct_servicio','ct_otro_tipo',
   'ct_proxima','ct_notas','ct_asesor',
   'ct_notas_busca','ct_notas_oferta','ct_notas_servicio'].forEach(function(id){var el=$(id);if(el)el.value='';});
  if($('ct_seguimiento'))$('ct_seguimiento').value=hoy;
  if($('ct_fuente'))$('ct_fuente').value='';
  document.querySelectorAll('#ctTipoChips .chip').forEach(function(b){b.classList.remove('sel');});
  ['ctConfianzaChips','ctUrgenciaChips','ctConfianzaAliado'].forEach(function(cid){
    var w=$(cid);if(w)w.querySelectorAll('.chip').forEach(function(b){b.classList.remove('sel');});
  });
  var estatusWrap=$('ctEstatusChips');
  if(estatusWrap){
    estatusWrap.querySelectorAll('.chip').forEach(function(b){b.classList.toggle('sel',b.dataset.v==='Nuevo');});
  }
  ctState={tipos:[],confianza:'',estatus:'Nuevo',urgencia:'',confianzaAliado:''};
  $('ctOtroTipoBox').style.display='none';
  $('ctSecOper').style.display='none';
  $('ctSecComprador').style.display='none';
  $('ctSecPropietario').style.display='none';
  $('ctSecAliado').style.display='none';
  $('ctConfianzaRow').style.display='';
  $('ctOutputArea').style.display='none';
  ctMd='';ctUpdateProgress();
  window.scrollTo({top:0,behavior:'smooth'});
}
(function ctInit(){
  if($('ct_seguimiento'))$('ct_seguimiento').value=hoy;
  if(asesorActivo&&$('ct_asesor'))$('ct_asesor').value=asesorActivo.nombre||CFG.resp||'';
  else if($('ct_asesor'))$('ct_asesor').value=CFG.resp||'';
  var ew=$('ctEstatusChips');
  if(ew)ew.querySelectorAll('.chip').forEach(function(b){b.classList.toggle('sel',b.dataset.v==='Nuevo');});
  updateCtBadge();renderCtHist();
})();

/* ===================== SERVICE WORKER ===================== */
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
})();
