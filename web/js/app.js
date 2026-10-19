const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),norm=t=>t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),slug=t=>norm(t).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const SEM_DEF="II-2026",IMG=/\.(png|jpe?g|webp|gif)$/i;
const DOC=["Informes","Guías","Planos P&ID","Esquemas eléctricos","Datasheets","Presentaciones"],PRG=["Firmware PIC","Python/Node-RED","MATLAB"];
const ART=[["q1","Base","NEMA 23","0–180°"],["q2","Hombro","NEMA 23","0–90°"],["q3","Codo","NEMA 23","0–90°"],["q4","Muñeca","NEMA 17 / 16","0–150°"],["q5","Pinza","NEMA 17 / 16","Apertura y cierre"],["q6","Giro de muñeca","NEMA 17 / 16","0–360°"]];
const LABS=[["Auditoría física y documental"],["Modelado, planos y lazos de control"],["Base de datos de telemetría"],[""],[""],[""],[""],[""]];
let ALL=[],CAT={docs:{},videos:[]},RAW="",cur="";
const api=(p,x="")=>"/api/repo?"+x+"path="+encodeURIComponent(p),msg=t=>$("#msg").textContent=t;
const semOf=p=>{const m=p.match(/(I{1,2})-(20\d\d)/i)||p.match(/(20\d\d)-(I{1,2})/i);return m?(/^20/.test(m[1])?m[2]+"-"+m[1]:m[1]+"-"+m[2]).toUpperCase():SEM_DEF};
const tipoOf=p=>{const s=norm(p);return s.includes("evidencia")?"Evidencias":s.includes("plano")?"Planos P&ID":s.includes("esquema")?"Esquemas eléctricos":s.includes("datasheet")?"Datasheets":s.includes("informe")?"Informes":s.includes("guia")?"Guías":s.includes("presentacion")?"Presentaciones":s.includes("programa")?"Firmware PIC":"Informes"};
const opts=(a,ph)=>(ph?`<option value="">${ph}</option>`:"")+a.map(x=>`<option>${x}</option>`).join("");
const labsO=[1,2,3,4,5,6,7,8].map(n=>"Lab "+n),artsO=[...ART.map(a=>a[0]),"Controlador","General"];
// vistas
function ruta(){const v=(location.hash.slice(1)||"inicio").split("?")[0];$$(".v").forEach(s=>s.classList.toggle("on",s.id==="v-"+(document.getElementById("v-"+v)?v:"inicio")));$$("nav a").forEach(a=>a.classList.toggle("on",a.hash==="#"+v));scrollTo(0,0)}
addEventListener("hashchange",ruta);
function irA(v,o={}){for(const k in o)$(`#${v}-${k}`).value=o[k];lista(v);location.hash=v}
// inicio
$("#arts").innerHTML=ART.map(a=>`<a class="card" href="#" data-ir="documentos|art|${a[0]}"><h3>${a[0]} · ${a[1]}</h3><small>${a[2]} · ${a[3]}</small></a>`).join("");
$("#labs").innerHTML=LABS.map((l,i)=>`<a class="card" href="#" data-ir="documentos|lab|Lab ${i+1}"><h3>Laboratorio ${i+1}</h3><small>${l[0]||"Por completar"}</small></a>`).join("");
document.addEventListener("click",e=>{const i=e.target.closest("[data-ir]");if(i){e.preventDefault();const[v,k,x]=i.dataset.ir.split("|");irA(v,{[k]:x})}const w=e.target.closest("[data-v]");if(w){e.preventDefault();openFile(w.dataset.v)}});
// datos
async function load(){try{const d=await (await fetch("/api/repo?tree=1")).json();RAW=d.raw||"";ALL=(d.tree||[]).filter(f=>f.type==="blob"&&!f.path.split("/").some(n=>n[0]===".")&&!/^(README\.md|index\.html|catalogo\.json|functions\/|web\/)/.test(f.path)).map(f=>({path:f.path,name:f.path.split("/").pop(),size:f.size||0}))}catch{ALL=[]}
 try{const r=await fetch(api("catalogo.json","raw=1&"));if(r.ok)CAT=await r.json()}catch{}
 CAT.docs=CAT.docs||{};CAT.videos=CAT.videos||[];
 ALL.forEach(f=>{const m=CAT.docs[f.path]||{};f.sem=m.sem||semOf(f.path);f.cat=m.cat||tipoOf(f.path);f.estado=m.estado||"";f.lab=m.lab||"";f.art=m.art||"";f.desc=m.desc||""});
 $("#stats").innerHTML=`<div><b>${ALL.filter(f=>f.cat!=="Evidencias").length}</b>archivos</div><div><b>${ALL.filter(f=>f.estado==="Aceptado").length}</b>aceptados</div><div><b>${ALL.filter(f=>f.cat==="Evidencias").length}</b>evidencias</div>`;
 lista("documentos");lista("programas");galeria()}
const saveCat=()=>put("catalogo.json",btoa(unescape(encodeURIComponent(JSON.stringify(CAT,null,1)))));
const put=(p,b)=>fetch(api(p),{method:"PUT",headers:{"x-admin-key":$("#key").value},body:JSON.stringify({content:b})});
// listas con filtros
["documentos","programas"].forEach(v=>{const S=(id,ph,o)=>`<select id="${v}-${id}">${opts(o,ph)}</select>`;
 $(`#${v}-f`).innerHTML=`<input id="${v}-q" type="search" placeholder="Buscar por nombre o descripción">`+S("sem","Semestre",[])+S("cat","Categoría",v==="programas"?PRG:DOC)+S("est","Estado",["En revisión","Aceptado"])+S("lab","Laboratorio",labsO)+S("art","Articulación",artsO);
 $(`#${v}-f`).oninput=()=>lista(v)});
function lista(v){const g=k=>$(`#${v}-${k}`).value,q=norm(g("q")),base=ALL.filter(x=>x.cat!=="Evidencias"&&(v==="programas")===PRG.includes(x.cat)),s=$(`#${v}-sem`),c=s.value;
 s.innerHTML=opts([...new Set(base.map(x=>x.sem))].sort().reverse(),"Semestre");s.value=c;
 const L=base.filter(x=>(!g("sem")||x.sem===g("sem"))&&(!g("cat")||x.cat===g("cat"))&&(!g("est")||x.estado===g("est"))&&(!g("lab")||x.lab===g("lab"))&&(!g("art")||x.art===g("art"))&&norm(x.path+" "+x.desc).includes(q));
 $(`#${v}-r`).innerHTML=L.length?L.map(f=>`<article class="it"><span class="tg">${esc(f.cat)}</span>${f.estado?`<span class="tg ${f.estado==="Aceptado"?"ea":"er"}">${f.estado}</span>`:""}${f.lab?`<span class="tg">${f.lab}</span>`:""}${f.art?`<span class="tg">${f.art}</span>`:""}<a href="#" data-v="${esc(f.path)}">${esc(f.name)}</a><p>${esc(f.desc)}</p><small>${f.sem} · ${Math.ceil(f.size/1024)} KB</small></article>`).join(""):"<p class='sub'>No hay archivos con estos filtros. Súbalos desde Repositorio.</p>"}
// galería
const yt=u=>(u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)||[])[1];
function galeria(){const G=ALL.filter(f=>f.cat==="Evidencias"&&IMG.test(f.name));
 $("#gal").innerHTML=G.length?G.map(f=>`<figure><img loading="lazy" src="${RAW+encodeURI(f.path)}" alt="${esc(f.name)}" data-v="${esc(f.path)}"><figcaption>${esc(f.desc||f.name)}</figcaption></figure>`).join(""):"<p class='sub'>Aún no hay fotos. Súbalas con la categoría Evidencias.</p>";
 $("#vid").innerHTML=CAT.videos.length?CAT.videos.map(v=>yt(v.url)?`<figure><iframe src="https://www.youtube.com/embed/${yt(v.url)}" title="${esc(v.t)}" allowfullscreen loading="lazy"></iframe><figcaption>${esc(v.t)}</figcaption></figure>`:"").join(""):"<p class='sub'>Aún no hay videos.</p>"}
$$(".bar [data-t]").forEach(b=>b.onclick=()=>{$$(".bar [data-t]").forEach(x=>x.classList.toggle("on",x===b));$("#gal").hidden=b.dataset.t!=="fotos";$("#vid").hidden=b.dataset.t!=="videos"});
$("#addv").onclick=async()=>{const u=prompt("Enlace de YouTube:");if(!u||!yt(u))return msg("Enlace de YouTube no válido.");CAT.videos.push({t:prompt("Título del video:")||"Video",url:u});const r=await saveCat();msg(r.ok?"Video agregado.":(await r.json()).message);galeria()};
// visor
async function openFile(p){const b=$("#mbody");$("#modal").hidden=false;$("#mt").textContent=p;b.textContent="Cargando…";const r=await fetch(api(p,"raw=1&"));if(!r.ok){b.textContent="No se pudo abrir el archivo.";return}
 const u=URL.createObjectURL(await r.blob());$("#mdl").href=u;$("#mdl").download=p.split("/").pop();
 b.innerHTML=/\.pdf$/i.test(p)?`<iframe src="${u}" title="${esc(p)}"></iframe>`:IMG.test(p)?`<img src="${u}" alt="${esc(p)}">`:"<p>Este formato no se puede mostrar aquí. Use Descargar.</p>"}
const closeM=()=>{$("#modal").hidden=true;$("#mbody").innerHTML=""};$("#mx").onclick=closeM;addEventListener("keydown",e=>e.key==="Escape"&&closeM());
// explorador
async function ls(p){cur=p;$("#crumb").textContent="/"+p;let d;try{d=await (await fetch(api(p))).json()}catch{msg("No se pudo conectar con la API.");return}
 if(!Array.isArray(d)){$("#list").innerHTML=`<li>${esc(d.message==="Not Found"?"Carpeta vacía.":d.message||"Error")}</li>`;return}
 d.sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):a.type==="dir"?-1:1);
 $("#list").innerHTML=(p?`<li><a href="#" data-d="${esc(p.split("/").slice(0,-1).join("/"))}">Subir un nivel</a></li>`:"")+d.filter(f=>f.name[0]!==".").map(f=>f.type==="dir"?`<li><a href="#" data-d="${esc(f.path)}">${esc(f.name)}/</a></li>`:`<li><a href="#" data-v="${esc(f.path)}">${esc(f.name)}</a><small>${Math.ceil(f.size/1024)} KB</small><button data-x="${esc(f.path)}">Eliminar</button></li>`).join("")}
$("#list").onclick=async e=>{const a=e.target.closest("[data-d]"),x=e.target.dataset.x;if(a){e.preventDefault();ls(a.dataset.d)}
 if(x&&confirm("¿Eliminar "+x+"?")){const r=await fetch(api(x),{method:"DELETE",headers:{"x-admin-key":$("#key").value}});if(r.ok&&CAT.docs[x]){delete CAT.docs[x];await saveCat()}msg(r.ok?"Eliminado: "+x:(await r.json()).message);ls(cur);load()}};
$("#home").onclick=()=>ls("");
$("#u-cat").innerHTML=opts([...DOC,...PRG,"Evidencias"]);$("#u-lab").innerHTML=opts(labsO,"Laboratorio");$("#u-art").innerHTML=opts(artsO,"Articulación");
const b64=f=>new Promise(r=>{const x=new FileReader;x.onload=()=>r(x.result.split(",")[1]);x.readAsDataURL(f)});
$("#subir").onsubmit=async e=>{e.preventDefault();const g=k=>$("#u-"+k).value,fs=$("#u-f").files;if(!fs.length)return msg("Elija al menos un archivo.");
 const dir=(PRG.includes(g("cat"))?"programas/":"Documentacion/")+g("sem")+"/"+slug(g("cat"))+"/";
 for(const f of fs){const p=dir+f.name,r=await put(p,await b64(f));if(!r.ok)return msg((await r.json()).message);CAT.docs[p]={sem:g("sem"),cat:g("cat"),estado:g("est"),lab:g("lab"),art:g("art"),desc:g("d")}}
 const r=await saveCat();msg(r.ok?"Archivos subidos.":(await r.json()).message);e.target.reset();$("#u-sem").value=SEM_DEF;ls(cur);load()};
// tema y simulador
$("#tema").onclick=()=>{const t=document.documentElement.dataset.theme==="dark"?"":"dark";document.documentElement.dataset.theme=t;try{localStorage.tema=t}catch{}};
const R=[["q1 Base",0,180,90],["q2 Hombro",0,90,45],["q3 Codo",0,90,45],["q4 Muñeca",0,150,75],["q5 Pinza (apertura %)",0,100,50],["q6 Giro de muñeca",0,360,0]];
$("#sl").innerHTML=R.map((r,i)=>`<label>${r[0]}: <b id="o${i+1}">${r[3]}</b><input id="s${i+1}" type="range" min="${r[1]}" max="${r[2]}" value="${r[3]}"></label>`).join("");
function sim(){const v=i=>+$("#s"+i).value,k=Math.PI/180,A=[v(2),v(2)-v(3)];A[2]=A[1]-(v(4)-75);let x=90,y=250;const P=[[x,y]];[110,95,55].forEach((l,i)=>{x+=l*Math.cos(A[i]*k);y-=l*Math.sin(A[i]*k);P.push([x,y])});
 $("#arm").setAttribute("d","M"+P.map(p=>p.map(n=>n.toFixed(1)).join(" ")).join("L"));const g=v(5)/100*14,e=P[3];
 $("#grip").setAttribute("d",`M0 ${-g}H22M0 ${g}H22`);$("#grip").setAttribute("transform",`translate(${e[0].toFixed(1)} ${e[1].toFixed(1)}) rotate(${-A[2]})`);
 $("#d1").setAttribute("transform",`rotate(${v(1)-90} 330 70)`);$("#d6").setAttribute("transform",`rotate(${v(6)} 330 190)`);for(let i=1;i<=6;i++)$("#o"+i).textContent=v(i)}
$("#sl").oninput=sim;sim();ruta();ls("");load();
