
const DATA = window.POSTPAY_DATA || [];
const filters = {m:"", rr:"", ar:"", ch:"", ot:"", sh:""};
let selectedEmployee = "";
let selectedReason = "";

const $ = id => document.getElementById(id);
const uniq = arr => [...new Set(arr.filter(x=>x!=="" && x!=null))];
const pct = (n,d) => d ? (n/d*100) : 0;
const fmt = n => Number(n||0).toLocaleString("en-US");
const pct1 = n => `${Number(n||0).toFixed(1)}%`;
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const isUnassigned = r => !r.emp || String(r.emp).trim()==="" || String(r.emp).trim()==="ไม่ระบุ";
const statusStats = rows => ({
  cases: rows.length,
  complete: rows.filter(r=>r.st==="สมบูรณ์").length,
  incomplete: rows.filter(r=>r.st!=="สมบูรณ์").length,
  xflag: rows.filter(r=>r.st==="ไม่สมบูรณ์ (X Flag)").length
});
const currentRows = () => DATA.filter(r =>
  (!filters.m || r.m===filters.m) &&
  (!filters.rr || r.rr===filters.rr) &&
  (!filters.ar || r.ar===filters.ar) &&
  (!filters.ch || r.ch===filters.ch) &&
  (!filters.ot || r.ot===filters.ot) &&
  (!filters.sh || r.sh===filters.sh)
);
function rowsExcept(key){
  return DATA.filter(r => Object.entries(filters).every(([k,v]) => k===key || !v || r[k]===v));
}
function fillSelect(id, values, value){
  const el=$(id);
  const opts=['<option value="">All</option>'].concat(values.sort((a,b)=>String(a).localeCompare(String(b),'th')).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`));
  el.innerHTML=opts.join(""); el.value=value||"";
}
function refreshFilters(){
  fillSelect("month",uniq(rowsExcept("m").map(r=>r.m)),filters.m);
  fillSelect("region",uniq(rowsExcept("rr").map(r=>r.rr)),filters.rr);
  fillSelect("area",uniq(rowsExcept("ar").map(r=>r.ar)),filters.ar);
  fillSelect("channel",uniq(rowsExcept("ch").map(r=>r.ch)),filters.ch);
  fillSelect("order",uniq(rowsExcept("ot").map(r=>r.ot)),filters.ot);
  fillSelect("shop",uniq(rowsExcept("sh").map(r=>r.sh)),filters.sh);
}
function setFilter(k,v){
 filters[k]=v;
 const clearMap={m:["rr","ar","ch","ot","sh"],rr:["ar","ch","ot","sh"],ar:["ch","ot","sh"],ch:[],ot:["sh"],sh:[]};
 (clearMap[k]||[]).forEach(x=>filters[x]="");
 selectedEmployee=""; selectedReason="";
 refreshFilters(); renderAll();
}
["month","region","area","channel","order","shop"].forEach((id,k)=>{
  const map=["m","rr","ar","ch","ot","sh"];
  $(id).addEventListener("change",e=>setFilter(map[k],e.target.value));
});
$("reset").addEventListener("click",()=>{Object.keys(filters).forEach(k=>filters[k]="");selectedEmployee="";selectedReason="";refreshFilters();renderAll();});
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("active"));
 b.classList.add("active");$(b.dataset.tab).classList.add("active");
}));

function groupShop(rows){
 const m=new Map();
 rows.forEach(r=>{const k=r.sh||"ไม่ระบุ Shop"; if(!m.has(k))m.set(k,{sh:k,ar:r.ar,rr:r.rr,c:0,i:0,x:0});const o=m.get(k);o.c++;if(r.st!=="สมบูรณ์")o.i++;if(r.st==="ไม่สมบูรณ์ (X Flag)")o.x++;});
 return [...m.values()].map(o=>({...o,ir:pct(o.i,o.c),cr:pct(o.c-o.i,o.c)}));
}
function topRegion(rows, asc=false){
 const regs=["BMA","UPC1","UPC2"].map(rr=>{const s=statusStats(rows.filter(r=>r.rr===rr));return {name:rr,...s,ir:pct(s.incomplete,s.cases),cr:pct(s.complete,s.cases)}}).filter(x=>x.cases);
 regs.sort((a,b)=>asc?a.ir-b.ir:b.ir-a.ir); return regs[0]||null;
}
function topRoot(rows){
 const inc=rows.filter(r=>r.st!=="สมบูรณ์");
 const m={};inc.forEach(r=>{const k=r.cat||"ไม่ระบุ";m[k]=(m[k]||0)+1});
 const a=Object.entries(m).sort((a,b)=>b[1]-a[1]); return a.length?{name:a[0][0],n:a[0][1],share:pct(a[0][1],inc.length)}:null;
}
function renderOverviewHighlight(rows){
 const s=statusStats(rows), scope=scopeLabel(), target=95;
 const cr=pct(s.complete,s.cases), ir=pct(s.incomplete,s.cases), xr=pct(s.xflag,s.cases), gap=cr-target;
 const shops=groupShop(rows).filter(x=>x.c>0);
 const topIncompleteShop=[...shops].sort((a,b)=>b.i-a.i||b.ir-a.ir||b.c-a.c)[0]||null;
 const topRateShop=[...shops].filter(x=>x.c>=10).sort((a,b)=>b.cr-a.cr||b.c-a.c)[0]||null;
 const inc=rows.filter(r=>r.st!=="สมบูรณ์");
 const countBy=(arr,keyFn)=>Object.entries(arr.reduce((m,r)=>{const k=keyFn(r)||"ไม่ระบุ";m[k]=(m[k]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1]);
 const roots=countBy(inc,r=>r.cat), reasons=countBy(inc,r=>r.reason&&r.reason!=="ไม่ระบุ"?r.reason:"ไม่ระบุ");
 const topRoot=roots[0]||null, topReason=reasons[0]||null, top3=roots.slice(0,3).reduce((n,x)=>n+x[1],0);
 const em={}; rows.filter(r=>!isUnassigned(r)).forEach(r=>{const k=r.emp;if(!em[k])em[k]={e:k,c:0,i:0};em[k].c++;if(r.st!=="สมบูรณ์")em[k].i++});
 const topEmp=Object.values(em).filter(x=>x.c>=5).map(x=>({...x,ir:pct(x.i,x.c)})).sort((a,b)=>b.i-a.i||b.ir-a.ir)[0]||null;
 const scopeTitle=scope==="All W&W"?"ภาพรวม W&W":esc(scope);
 const status=s.cases?`ตรวจ <b>${fmt(s.cases)}</b> รายการ: Complete <b>${pct1(cr)}</b> (${fmt(s.complete)}), Incomplete <b>${pct1(ir)}</b> (${fmt(s.incomplete)}), X Flag <b>${pct1(xr)}</b> (${fmt(s.xflag)})`:`ไม่พบข้อมูลสำหรับตัวกรองปัจจุบัน`;
 const quality=s.cases?(gap<0?`Complete Rate <b>${pct1(cr)}</b> ต่ำกว่า Target <b>${target}.0%</b> อยู่ <b>${pct1(Math.abs(gap))}</b> จุด และมี Incomplete <b>${fmt(s.incomplete)} รายการ</b> ที่ต้องเร่งติดตาม`:`Complete Rate <b>${pct1(cr)}</b> ผ่าน Target <b>${target}.0%</b> อยู่ <b>${pct1(gap)}</b> จุด`):"";
 let perf=topIncompleteShop?`Incomplete สูงสุดอยู่ที่ <b>${esc(topIncompleteShop.sh)}</b> จำนวน <b>${fmt(topIncompleteShop.i)} รายการ</b> (${pct1(topIncompleteShop.ir)} ของรายการในสาขา)`:`ไม่มี Incomplete ให้เปรียบเทียบ`;
 if(topRateShop && (!topIncompleteShop || topRateShop.sh!==topIncompleteShop.sh)) perf+=`<br>Benchmark: <b>${esc(topRateShop.sh)}</b> Complete Rate <b>${pct1(topRateShop.cr)}</b> จาก ${fmt(topRateShop.c)} รายการ`;
 if(topEmp) perf+=`<br>พนักงานที่มี Incomplete สูงสุด: <b>${esc(topEmp.e)}</b> ${fmt(topEmp.i)} รายการ (${pct1(topEmp.ir)})`;
 const rootText=topRoot?`Root Cause หลัก <b>${esc(topRoot[0])}</b> ${fmt(topRoot[1])} รายการ (${pct1(pct(topRoot[1],s.incomplete))} ของ Incomplete)`:`ไม่พบ Root Cause`;
 const reasonText=topReason?`Detailed Reason สูงสุด: <b>${esc(topReason[0])}</b> ${fmt(topReason[1])} รายการ (${pct1(pct(topReason[1],s.incomplete))})`:`ไม่มี Detailed Reason`;
 const action=s.incomplete?`เริ่มแก้จาก <b>${esc(topRoot?topRoot[0]:"Root Cause หลัก")}</b> → <b>${esc(topReason?topReason[0]:"Detailed Reason สูงสุด")}</b>${topIncompleteShop?` → Focus <b>${esc(topIncompleteShop.sh)}</b>`:""} และติดตามการปิด Case จนครบ <b>${fmt(s.incomplete)} รายการ</b>`:`รักษา Complete Rate ให้อยู่เหนือ Target และตรวจสอบไม่ให้เกิด Incomplete ซ้ำ`;
 const focusLine=top3?`Top 3 Root Cause รวม <b>${fmt(top3)} รายการ</b> (${pct1(pct(top3,s.incomplete))} ของ Incomplete)`:"";
 $("overviewHighlight").innerHTML=`<div class="highlight-head"><div class="highlight-icon">★</div><div class="highlight-title">EXECUTIVE HIGHLIGHT • ${scopeTitle}</div></div><div class="highlight-grid"><div class="highlight-item risk"><b>1. QUALITY STATUS — สถานการณ์คุณภาพ</b><br>${status}<br>${quality}<br><b>Executive Takeaway:</b> ${s.incomplete?`Priority 1: ปิด Incomplete ${fmt(s.incomplete)} รายการ เพื่อนำ Complete Rate กลับสู่ ≥ ${target}.0%`:`คุณภาพผ่านเป้าหมายและไม่พบ Incomplete Case`}</div><div class="highlight-item goodbox"><b>2. PERFORMANCE — ผลงานและจุดที่ต้อง Focus</b><br>${perf}<br><b>มุมมองผู้บริหาร:</b> ใช้สาขาที่ Complete Rate สูงเป็น Benchmark และ Focus จุดที่มี Incomplete สูงที่สุดในตัวกรองปัจจุบัน</div><div class="highlight-item focus"><b>3. ROOT CAUSE & ACTION — สาเหตุและสิ่งที่ควรดำเนินการ</b><br>${rootText}<br>${reasonText}<br>${focusLine}<br><b>Management Action:</b> ${action}</div></div>`;
}
function renderKpis(rows){
 const s=statusStats(rows), target=95, cr=pct(s.complete,s.cases), ir=pct(s.incomplete,s.cases), xr=pct(s.xflag,s.cases);
 $("kpis").innerHTML=[
  ["TOTAL CASES",fmt(s.cases),"รายการตรวจทั้งหมด",""],
  ["COMPLETE",pct1(cr),`${fmt(s.complete)} cases`,"green"],
  ["INCOMPLETE",pct1(ir),`${fmt(s.incomplete)} cases`,"red"],
  ["X FLAG",pct1(xr),`${fmt(s.xflag)} cases`,"orange"],
  ["TARGET",`${target}.0%`,`Gap ${pct1(cr-target)} vs target`,""]
 ].map(x=>`<div class="kpi ${x[3]}"><div class="label">${x[0]}</div><div class="value ${x[3]}">${x[1]}</div><div class="sub">${x[2]}</div></div>`).join("");
}
function renderRegionCards(rows){
 const regs=["BMA","UPC1","UPC2"];
 $("regionCards").innerHTML=regs.map(rr=>{
   const s=statusStats(rows.filter(r=>r.rr===rr)), ir=pct(s.incomplete,s.cases), cr=pct(s.complete,s.cases);
   const tag=ir>=10?"RISK":ir<7?"BEST":"WATCH";
   return `<div class="region-card ${tag==="RISK"?"risk":tag==="BEST"?"best":""}">
     <span class="tag">${tag}</span><div class="rname">${rr}</div>
     <div class="region-metrics">
       <div class="metric"><b>${fmt(s.cases)}</b><span>CASES</span></div>
       <div class="metric"><b>${fmt(s.incomplete)}</b><span>INCOMPLETE</span></div>
       <div class="metric"><b>${pct1(ir)}</b><span>INCOMPLETE RATE</span></div>
     </div>
     <div style="margin-top:10px;font-size:11px;color:#d9eaff">Complete ${pct1(cr)} • X Flag ${pct1(pct(s.xflag,s.cases))}</div>
   </div>`;
 }).join("");
}
function renderTrend(rows){
 /* Keep both months visible within the selected non-month scope; highlight selected month */
 const trendRows=DATA.filter(r =>
   (!filters.rr || r.rr===filters.rr) && (!filters.ar || r.ar===filters.ar) &&
   (!filters.ch || r.ch===filters.ch) && (!filters.ot || r.ot===filters.ot) && (!filters.sh || r.sh===filters.sh)
 );
 const months=["July'26","Aug'26"].filter(m=>trendRows.some(r=>r.m===m));
 $("trend").innerHTML=months.map(m=>{
   const s=statusStats(trendRows.filter(r=>r.m===m)), c=pct(s.complete,s.cases), i=pct(s.incomplete,s.cases), x=pct(s.xflag,s.cases);
   const hi=filters.m===m?' style="padding:8px;border:1px solid #8fc7f3;border-radius:10px;background:#f4faff"':'';
   return `<div${hi}><div style="margin-bottom:7px;font-weight:700;font-size:12px">${m}${filters.m===m?' • SELECTED':''} <span style="float:right;color:#7b8ca0">${fmt(s.cases)} cases</span></div>
   <div class="trend-row"><span class="trend-label">Complete</span><div class="bar-bg"><div class="bar complete" style="width:${c}%"></div></div><span class="trend-val good">${pct1(c)}</span></div>
   <div class="trend-row"><span class="trend-label">Incomplete</span><div class="bar-bg"><div class="bar incomplete" style="width:${i}%"></div></div><span class="trend-val bad">${pct1(i)} / ${fmt(s.incomplete)}</span></div>
   <div class="trend-row"><span class="trend-label">X Flag</span><div class="bar-bg"><div class="bar xflag" style="width:${x}%"></div></div><span class="trend-val warn">${pct1(x)} / ${fmt(s.xflag)}</span></div></div>`;
 }).join("");
}
function rankBars(items, mode){
 const max=Math.max(...items.map(x=>mode==="rate"?x.ir:x.i),1);
 return `<div class="rank">${items.map((x,idx)=>`<div class="rank-item">
   <div class="rank-no">${idx+1}</div><div><div class="rank-name" title="${esc(x.name||x.sh)}">${esc(x.name||x.sh)}</div><div class="rank-bar"><i style="width:${((mode==="rate"?x.ir:x.i)/max*100).toFixed(1)}%"></i></div></div>
   <div class="rank-rate">${mode==="rate"?pct1(x.ir):fmt(x.i)}</div></div>`).join("")}</div>`;
}
function renderRegionRank(rows){
 const a=["BMA","UPC1","UPC2"].map(rr=>{const s=statusStats(rows.filter(r=>r.rr===rr));return {name:rr,ir:pct(s.incomplete,s.cases),i:s.incomplete,c:s.cases}}).filter(x=>x.c);
 a.sort((x,y)=>y.ir-x.ir); $("regionRank").innerHTML=rankBars(a,"rate");
}
function renderShopTables(rows){
 const shops=groupShop(rows).filter(x=>x.c>=50);
 const top=[...shops].sort((a,b)=>b.cr-a.cr || b.c-a.c).slice(0,7);
 const prob=[...shops].sort((a,b)=>b.i-a.i || b.ir-a.ir).slice(0,7);
 $("topShops").innerHTML=top.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Shop</th><th>Cases</th><th>Incomplete</th><th>Complete Rate</th></tr></thead><tbody>${top.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.sh)}</td><td class="num">${fmt(x.c)}</td><td class="num bad">${fmt(x.i)}</td><td class="num good">${pct1(x.cr)}</td></tr>`).join("")}</tbody></table></div>`:"<div class='scope'>ไม่มี Shop ที่มีอย่างน้อย 50 Cases ในตัวกรองปัจจุบัน</div>";
 $("problemShops").innerHTML=prob.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Shop</th><th>Cases</th><th>Incomplete</th><th>Incomplete Rate</th></tr></thead><tbody>${prob.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.sh)}</td><td class="num">${fmt(x.c)}</td><td class="num bad">${fmt(x.i)}</td><td class="num bad">${pct1(x.ir)}</td></tr>`).join("")}</tbody></table></div>`:"<div class='scope'>ไม่มี Shop ที่มีอย่างน้อย 50 Cases ในตัวกรองปัจจุบัน</div>";
}
function renderEmployee(rows){
 const assignedRows=rows.filter(r=>!isUnassigned(r));
 const unRows=rows.filter(isUnassigned);
 const us=statusStats(unRows);
 const ush=uniq(unRows.map(r=>r.sh)).length;
 const ua=$("unassignedCard");
 if(us.cases){
   ua.className="unassigned-card show";
   ua.innerHTML=`<div class="unassigned-title">DATA QUALITY ALERT • ไม่ระบุพนักงาน</div><div class="unassigned-stats">
    <span>Cases <b>${fmt(us.cases)}</b></span><span>Incomplete <b>${fmt(us.incomplete)}</b></span><span>Rate <b>${pct1(pct(us.incomplete,us.cases))}</b></span><span>X Flag <b>${fmt(us.xflag)}</b></span><span>ครอบคลุม <b>${fmt(ush)}</b> Shops</span>
   </div>`;
 } else {ua.className="unassigned-card";ua.innerHTML="";}

 const m=new Map();
 assignedRows.forEach(r=>{const k=r.emp;if(!m.has(k))m.set(k,{e:k,c:0,i:0,x:0,sh:new Set(),ar:new Set()});const o=m.get(k);o.c++;if(r.st!=="สมบูรณ์")o.i++;if(r.st==="ไม่สมบูรณ์ (X Flag)")o.x++;o.sh.add(r.sh);o.ar.add(r.ar)});
 let a=[...m.values()].filter(x=>x.c>=5).map(x=>({...x,ir:pct(x.i,x.c),cr:pct(x.c-x.i,x.c),shops:[...x.sh],areas:[...x.ar]})).sort((a,b)=>b.i-a.i || b.ir-a.ir);

 if(selectedEmployee && !a.some(x=>x.e===selectedEmployee)) selectedEmployee="";
 if(!selectedEmployee && a.length) selectedEmployee=a[0].e;

 $("employeeTable").innerHTML=a.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Employee</th><th>Shop</th><th>Cases</th><th>Incomplete</th><th>Rate</th></tr></thead><tbody>${a.slice(0,80).map((x,i)=>`<tr class="emp-row" data-emp="${esc(x.e)}" style="cursor:pointer;background:${selectedEmployee===x.e?'#eef7ff':''}"><td>${i+1}</td><td>${esc(x.e)}</td><td>${esc(x.shops.length===1?x.shops[0]:x.shops.length+" shops")}</td><td class="num">${fmt(x.c)}</td><td class="num bad">${fmt(x.i)}</td><td class="num ${x.ir>=10?'bad':'good'}">${pct1(x.ir)}</td></tr>`).join("")}</tbody></table></div>`:"<div class='scope'>ไม่มีพนักงานที่ระบุชื่อและมีอย่างน้อย 5 Cases ในตัวกรองปัจจุบัน</div>";
 document.querySelectorAll(".emp-row").forEach(el=>el.addEventListener("click",()=>{selectedEmployee=el.dataset.emp;renderPeople(rows)}));

 const top=a[0];
 $("peopleHighlight").innerHTML=`<div class="highlight-head"><div class="highlight-icon">★</div><div class="highlight-title">EXECUTIVE HIGHLIGHT • Employee Accountability</div></div>
 <div class="highlight-grid">
  <div class="highlight-item risk"><b>1) พนักงานที่ควรติดตาม:</b> ${top?`<b>${esc(top.e)}</b> มี Incomplete ${fmt(top.i)} รายการ จากทั้งหมด ${fmt(top.c)} รายการ (${pct1(top.ir)})`:"ไม่มีพนักงานเข้าเกณฑ์"}</div>
  <div class="highlight-item focus"><b>2) ตัวกรองปัจจุบัน:</b> ${esc(scopeLabel())}<br>Ranking จะแสดงเฉพาะพนักงานที่ระบุชื่อ เพื่อให้การเปรียบเทียบถูกต้อง</div>
  <div class="highlight-item ${us.incomplete?'risk':'goodbox'}"><b>3) คุณภาพข้อมูลผู้รับผิดชอบ:</b> ${us.cases?`มี ${fmt(us.cases)} รายการที่ไม่ระบุพนักงาน • Incomplete ${fmt(us.incomplete)} รายการ • ครอบคลุม ${fmt(ush)} สาขา`:"ไม่พบรายการที่ไม่ระบุพนักงานในตัวกรองปัจจุบัน"}</div>
 </div>`;
}
function renderPeople(rows){
 renderEmployee(rows);
 const empRows=selectedEmployee?rows.filter(r=>r.emp===selectedEmployee):[];
 const s=statusStats(empRows);
 $("peopleScope").textContent=`ตัวกรอง: ${scopeLabel()}${selectedEmployee?" • Employee: "+selectedEmployee:""}`;
 $("shopProfile").innerHTML=selectedEmployee?`<div class="profile">
   <div class="box"><span>EMPLOYEE</span><b style="font-size:16px">${esc(selectedEmployee)}</b></div>
   <div class="box"><span>CASES</span><b>${fmt(s.cases)}</b></div>
   <div class="box"><span>INCOMPLETE</span><b class="bad">${fmt(s.incomplete)}</b></div>
   <div class="box"><span>INCOMPLETE RATE</span><b class="bad">${pct1(pct(s.incomplete,s.cases))}</b></div>
   <div class="box"><span>X FLAG</span><b class="warn">${fmt(s.xflag)}</b></div>
   <div class="box"><span>COMPLETE RATE</span><b class="good">${pct1(pct(s.complete,s.cases))}</b></div>
 </div>`:`<div class="scope">เลือกพนักงานจากตารางเพื่อดู Profile</div>`;
 const rs=empRows.filter(r=>r.st!=="สมบูรณ์");
 const rc={};rs.forEach(r=>rc[r.reason]=(rc[r.reason]||0)+1);
 const arr=Object.entries(rc).sort((a,b)=>b[1]-a[1]).slice(0,8);
 $("employeeRoot").innerHTML=selectedEmployee && arr.length?`<div class="rank">${arr.map(([n,v],i)=>`<div class="rank-item"><div class="rank-no">${i+1}</div><div><div class="rank-name">${esc(n)}</div><div class="rank-bar"><i style="width:${(v/arr[0][1]*100).toFixed(1)}%"></i></div></div><div class="rank-rate bad">${fmt(v)} cases</div></div>`).join("")}</div>`:`<div class="scope">ยังไม่มี Incomplete Case สำหรับพนักงานที่เลือก</div>`;
}
function renderRoot(rows){
 const inc=rows.filter(r=>r.st!=="สมบูรณ์");
 const cats=uniq(inc.map(r=>r.cat));
 const sel=$("rootCat");
 const old=sel.value;
 sel.innerHTML=['<option value="">All Root Causes</option>',...cats.sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`)].join("");
 sel.value=cats.includes(old)?old:"";
 const cat=sel.value;
 const categoryRows=cat?inc.filter(r=>r.cat===cat):inc;

 const cm={};categoryRows.forEach(r=>cm[r.cat]=(cm[r.cat]||0)+1);
 const mix=Object.entries(cm).sort((a,b)=>b[1]-a[1]);const mx=Math.max(...mix.map(x=>x[1]),1);
 $("rootMix").innerHTML=mix.length?`<div class="root-mix">${mix.map(([n,v])=>`<div class="mix-row"><div class="name">${esc(n)}</div><div class="mix-bg"><div class="mix-bar" style="width:${(v/mx*100).toFixed(1)}%"></div></div><div class="mix-num">${fmt(v)} • ${pct1(pct(v,categoryRows.length))}</div></div>`).join("")}</div>`:"<div class='scope'>ไม่มี Incomplete Case</div>";

 const rm={};categoryRows.forEach(r=>{if(r.reason&&r.reason!=="ไม่ระบุ")rm[r.reason]=(rm[r.reason]||0)+1});
 const reasons=Object.entries(rm).sort((a,b)=>b[1]-a[1]).slice(0,12);
 if(selectedReason && !reasons.some(x=>x[0]===selectedReason)) selectedReason="";
 const rmx=Math.max(...reasons.map(x=>x[1]),1);
 $("reasonRank").innerHTML=reasons.length?`<button class="reason-clear ${selectedReason?'':'active'}" id="clearReason">All Detailed Reasons</button>
 <div class="rank">${reasons.map(([n,v],i)=>`<div class="reason-row reason-click ${selectedReason===n?'selected':''}" data-reason="${esc(n)}">
   <div class="rank-no">${i+1}</div><div><div class="rank-name" title="${esc(n)}">${esc(n)}</div><div class="rank-bar"><i style="width:${(v/rmx*100).toFixed(1)}%"></i></div></div><div class="rank-rate">${fmt(v)}</div>
 </div>`).join("")}</div>`:"<div class='scope'>ไม่มี Detailed Reason</div>";
 if($("clearReason")) $("clearReason").addEventListener("click",()=>{selectedReason="";renderRoot(rows)});
 document.querySelectorAll(".reason-click").forEach(el=>el.addEventListener("click",()=>{selectedReason=el.dataset.reason;renderRoot(rows)}));

 const locationRows=selectedReason?categoryRows.filter(r=>r.reason===selectedReason):categoryRows;
 const lm=new Map();locationRows.forEach(r=>{const k=`${r.rr}|||${r.ar}|||${r.sh}`;if(!lm.has(k))lm.set(k,{rr:r.rr,ar:r.ar,sh:r.sh,c:0});lm.get(k).c++});
 const loc=[...lm.values()].sort((a,b)=>b.c-a.c).slice(0,30);
 $("rootLocation").innerHTML=loc.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Region</th><th>Area</th><th>Shop</th><th class="num">Case</th><th class="num">% of Selected Root</th></tr></thead><tbody>${loc.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.rr)}</td><td>${esc(x.ar)}</td><td>${esc(x.sh)}</td><td class="num bad">${fmt(x.c)}</td><td class="num">${pct1(pct(x.c,locationRows.length))}</td></tr>`).join("")}</tbody></table></div>`:"<div class='scope'>ไม่มีข้อมูล</div>";

 const topCat=Object.entries(categoryRows.reduce((m,r)=>{const k=r.cat||"ไม่ระบุ";m[k]=(m[k]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1])[0];
 const topReason=Object.entries((selectedReason?locationRows:categoryRows).reduce((m,r)=>{const k=r.reason&&r.reason!=="ไม่ระบุ"?r.reason:"ไม่ระบุ";m[k]=(m[k]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1])[0];
 const topLoc=loc[0];
 const allRoots=Object.entries(inc.reduce((m,r)=>{const k=r.cat||"ไม่ระบุ";m[k]=(m[k]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1]);
 const top3=allRoots.slice(0,3).reduce((n,x)=>n+x[1],0);
 const rootDen=categoryRows.length;
 $("rootScope").textContent=`${scopeLabel()} • ${cat||"All Root Causes"}${selectedReason?" • "+selectedReason:""}`;
 $("rootHighlight").innerHTML=`<div class="highlight-head"><div class="highlight-icon">★</div><div class="highlight-title">EXECUTIVE HIGHLIGHT • Root Cause & Where to Act</div></div>
 <div class="highlight-grid">
  <div class="highlight-item risk"><b>1) สาเหตุหลักของปัญหา:</b> ${topCat?`<b>${esc(topCat[0])}</b> จำนวน <b>${fmt(topCat[1])}</b> รายการ คิดเป็น <b>${pct1(pct(topCat[1],rootDen))}</b> ของ Incomplete ในตัวกรองปัจจุบัน`:"ไม่มี Incomplete Case"}</div>
  <div class="highlight-item focus"><b>2) Detailed Reason ที่ต้อง Focus:</b> ${selectedReason?`กำลัง Drill-down <b>${esc(selectedReason)}</b> จำนวน <b>${fmt(locationRows.length)}</b> รายการ`:topReason?`อันดับ 1 คือ <b>${esc(topReason[0])}</b> จำนวน <b>${fmt(topReason[1])}</b> รายการ (${pct1(pct(topReason[1],rootDen))})`:"ไม่มี Detailed Reason"}<br><b>Top 3 Root Cause:</b> ${fmt(top3)} รายการ (${pct1(pct(top3,inc.length))} ของ Incomplete)</div>
  <div class="highlight-item ${topLoc?'risk':'goodbox'}"><b>3) Where to Act:</b> ${topLoc?`เริ่มตรวจที่ <b>${esc(topLoc.rr)} → ${esc(topLoc.ar)} → ${esc(topLoc.sh)}</b> จำนวน <b>${fmt(topLoc.c)}</b> รายการ (${pct1(pct(topLoc.c,locationRows.length))} ของรายการที่กำลังวิเคราะห์)`:"ไม่มี Location ที่ต้องติดตาม"}</div>
 </div>`;
}
function scopeLabel(){
 const bits=[]; if(filters.m)bits.push(filters.m); if(filters.rr)bits.push(filters.rr); if(filters.ar)bits.push(filters.ar); if(filters.ch)bits.push(filters.ch); if(filters.ot)bits.push(filters.ot); if(filters.sh)bits.push(filters.sh);
 return bits.length?bits.join(" • "):"All W&W";
}
function renderAll(){
 const rows=currentRows();
 renderOverviewHighlight(rows);
 renderKpis(rows);renderRegionCards(rows);renderTrend(rows);renderRegionRank(rows);renderShopTables(rows);
 $("scopeText").textContent=`${scopeLabel()} • ${fmt(rows.length)} cases`;
 $("footerCount").textContent=`Current filters: ${fmt(rows.length)} cases • W&W source total 41,596`;
 renderPeople(rows);renderRoot(rows);
}
$("rootCat").addEventListener("change",()=>{selectedReason="";renderRoot(currentRows())});
refreshFilters();renderAll();
