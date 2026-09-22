import * as core from './core.js';
import { compileExpression } from './expression.js';
import { texAugmented, texGaussStep } from './gauss-render.js';

const nf=new Intl.NumberFormat('id-ID',{maximumFractionDigits:10});
const graphFmt=new Intl.NumberFormat('id-ID',{maximumFractionDigits:3});
const fmt=v=>typeof v==='number'?(Number.isFinite(v)?nf.format(Object.is(v,-0)?0:v):'—'):Array.isArray(v)?`[${v.map(fmt).join('; ')}]`:typeof v==='object'&&v?`{${Object.entries(v).map(([k,x])=>`${k}: ${fmt(x)}`).join('; ')}}`:String(v??'—');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(form,name)=>{const v=Number(form.elements[name].value);if(!Number.isFinite(v))throw new Error(`Nilai “${name}” harus berupa angka.`);return v};
const expr=(form,name='fx')=>compileExpression(form.elements[name].value);
const matrix=s=>{const rows=s.trim().split(/\n|;/).map(r=>r.trim()).filter(Boolean).map(r=>r.split(/[,\s]+/).map(Number));if(!rows.length||rows.some(r=>r.some(v=>!Number.isFinite(v))||r.length!==rows.length))throw new Error('Matriks A harus persegi; pisahkan kolom dengan koma dan baris dengan titik koma.');return rows};
const vector=s=>{const a=s.split(/[,\s]+/).map(Number);if(!a.length||a.some(v=>!Number.isFinite(v)))throw new Error('Vektor harus berisi angka yang dipisahkan koma.');return a};
const points=s=>{const p=s.trim().split(';').map(r=>r.split(',').map(Number));if(p.length<2||p.some(q=>q.length!==2||q.some(v=>!Number.isFinite(v))))throw new Error('Titik harus berformat x,y; x,y dan sedikitnya dua titik.');return p};
const opts=f=>({tolerance:n(f,'tol'),maxIterations:n(f,'max')});
const fields={
  exact:['Nilai eksak','number','1.41421356237'],approx:['Nilai hampiran','number','1.4142'],fx:['f(x)','expression','x^3-x-2'],gx:['g(x)','expression','(x+2)^(1/3)'],df:['f\u2032(x)','expression','3*x^2-1'],a:['Batas bawah / tebakan pertama','number','1'],b:['Batas atas / tebakan kedua','number','2'],x0:['x₀','number','1.5'],x:['Nilai x tujuan','number','1'],y0:['y₀','number','1'],h:['Ukuran langkah h','number','0.1'],tol:['Toleransi','number','0.000001'],max:['Iterasi maksimum','number','50'],order:['Orde','number','4'],sub:['Jumlah subinterval','number','6'],A:['Matriks A','matrix','4,1;2,3'],B:['Vektor b','text','1,2'],initial:['Vektor awal','text','0,0'],pts:['Titik data (x,y; x,y)','text','0,1;1,3;2,2;3,5'],ode:['f(x,y)','expression','x+y']
};
const configs={
  galat:{title:'Galat & Taylor',methods:{errors:['Analisis galat',['exact','approx']],taylor:['Deret Taylor',['fx','x0','x','order']]}},
  akar:{title:'Akar Persamaan',methods:{bisection:['Bisection',['fx','a','b','tol','max']],regulaFalsi:['Regula Falsi',['fx','a','b','tol','max']],modifiedRegulaFalsi:['Regula Falsi Diperbaiki (Illinois)',['fx','a','b','tol','max']],fixedPoint:['Iterasi Titik Tetap',['gx','x0','tol','max']],newton:['Newton–Raphson',['fx','df','x0','tol','max']],secant:['Secant',['fx','a','b','tol','max']]}},
  spl:{title:'Sistem Persamaan Linear',methods:{gaussianElimination:['Eliminasi Gauss',['A','B']],gaussJordan:['Gauss–Jordan',['A','B']],luDecomposition:['Dekomposisi LU',['A']],jacobi:['Jacobi',['A','B','initial','tol','max']],gaussSeidel:['Gauss–Seidel',['A','B','initial','tol','max']]}},
  interpolasi:{title:'Interpolasi & Regresi',methods:{lagrange:['Interpolasi Lagrange',['pts','x']],newtonInterpolation:['Interpolasi Newton',['pts','x']],linearRegression:['Regresi Linear',['pts']]}},
  turunan:{title:'Turunan Numerik',methods:{forward:['Selisih Maju',['fx','x','h']],backward:['Selisih Mundur',['fx','x','h']],central:['Selisih Pusat',['fx','x','h']],second:['Turunan Kedua',['fx','x','h']]}},
  integrasi:{title:'Integrasi Numerik',methods:{trapezoid:['Trapesium',['fx','a','b','sub']],simpson13:['Simpson 1/3',['fx','a','b','sub']],simpson38:['Simpson 3/8',['fx','a','b','sub']],gaussLegendre:['Gauss–Legendre',['fx','a','b','order']]}},
  pdb:{title:'Persamaan Diferensial Biasa',methods:{euler:['Euler',['ode','x0','y0','x','h']],heun:['Heun',['ode','x0','y0','x','h']],rk4:['Runge–Kutta orde 4',['ode','x0','y0','x','h']]}}
};
const formulas={errors:'E_a=|x-\\hat{x}|,\\quad E_r=E_a/|x|',taylor:'f(x)\\approx\\sum_{k=0}^{n}\\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k',bisection:'c=(a+b)/2',regulaFalsi:'c=(af(b)-bf(a))/(f(b)-f(a))',modifiedRegulaFalsi:'c=\\frac{aF_b-bF_a}{F_b-F_a},\\quad F_{stagnan}\\leftarrow F/2',fixedPoint:'x_{k+1}=g(x_k)',newton:'x_{k+1}=x_k-f(x_k)/f\\prime(x_k)',secant:'x_{k+1}=x_k-f(x_k)(x_k-x_{k-1})/(f(x_k)-f(x_{k-1}))',gaussianElimination:'Ax=b',gaussJordan:'[A|b]\\longrightarrow[I|x]',luDecomposition:'PA=LU',jacobi:'x_i^{(k+1)}=(b_i-\\sum_{j\\ne i}a_{ij}x_j^{(k)})/a_{ii}',gaussSeidel:'x_i^{(k+1)}=(b_i-\\sum_{j\\ne i}a_{ij}x_j)/a_{ii}',lagrange:'P(x)=\\sum_i y_iL_i(x)',newtonInterpolation:'P(x)=f[x_0]+f[x_0,x_1](x-x_0)+\\cdots',linearRegression:'\\hat y=a+bx',forward:'f\\prime(x)\\approx(f(x+h)-f(x))/h',backward:'f\\prime(x)\\approx(f(x)-f(x-h))/h',central:'f\\prime(x)\\approx(f(x+h)-f(x-h))/(2h)',second:'f\\prime\\prime(x)\\approx(f(x+h)-2f(x)+f(x-h))/h^2',trapezoid:'I\\approx h(f_0+2\\sum f_i+f_n)/2',simpson13:'I\\approx h(f_0+4\\sum f_{ganjil}+2\\sum f_{genap}+f_n)/3',simpson38:'I\\approx3h(f_0+3\\sum f_i+2\\sum f_{3i}+f_n)/8',gaussLegendre:'I\\approx(b-a)\\sum_iw_if(x_i)/2',euler:'y_{n+1}=y_n+hf(x_n,y_n)',heun:'y_{n+1}=y_n+h(k_1+k_2)/2',rk4:'y_{n+1}=y_n+h(k_1+2k_2+2k_3+k_4)/6'};

function toTex(val){
  return val
    .replace(/sqrt\((.*?)\)/g,"\\sqrt{$1}")
    .replace(/exp\((.*?)\)/g,"e^{$1}")
    .replace(/e\^x/g,"e^x")
    .replace(/\*/g," \\cdot ")
    .replace(/\^([0-9a-zA-Z]+)/g,"^{$1}");
}

function fieldHTML(key,prefix){
  const [label,type,value]=fields[key],id=`${prefix}-${key}`,preset=prefix==='pdb'&&key==='x0'?'0':value;
  if(type==='matrix'||type==='text')return `<div class="field wide"><label for="${id}">${label}</label><textarea id="${id}" name="${key}">${preset}</textarea><span class="hint">${type==='matrix'?'Contoh: 4,1;2,3':'Pisahkan nilai dengan koma; pasangan titik dengan titik koma.'}</span></div>`;
  const isExpr=type==='expression';
  if(!isExpr)return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${key}" type="number" step="any" value="${preset}" required></div>`;
  return `<div class="field wide">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
      <label for="${id}">${label}</label>
      <span class="hint" style="font-size:.74rem">Ketik biasa atau sentuh tombol simbol:</span>
    </div>
    <div class="math-keypad" data-target="${id}" style="display:flex;gap:4px;flex-wrap:wrap;margin:4px 0 6px">
      <button type="button" class="key-btn" data-ins="^2" title="Pangkat 2">x²</button>
      <button type="button" class="key-btn" data-ins="^3" title="Pangkat 3">x³</button>
      <button type="button" class="key-btn" data-ins="^" title="Pangkat n">xⁿ</button>
      <button type="button" class="key-btn" data-ins="sqrt(" title="Akar kuadrat">√□</button>
      <button type="button" class="key-btn" data-ins="e^x" title="Euler e^x">eˣ</button>
      <button type="button" class="key-btn" data-ins="/" title="Bagi">/</button>
      <button type="button" class="key-btn" data-ins="*" title="Kali">×</button>
      <button type="button" class="key-btn" data-ins="()" title="Kurung">( )</button>
      <button type="button" class="key-btn" data-ins="sin(" title="Sinus">sin</button>
      <button type="button" class="key-btn" data-ins="cos(" title="Cosinus">cos</button>
      <button type="button" class="key-btn" data-ins="x" title="Variabel x">x</button>
      <button type="button" class="key-btn" data-action="clr" title="Bersihkan" style="background:#fee2e2;color:#991b1b">⌫</button>
    </div>
    <input id="${id}" name="${key}" type="text" inputmode="text" autocomplete="off" value="${preset}" required>
    <div style="margin-top:5px;padding:5px 10px;background:var(--paper);border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;gap:8px;min-height:34px">
      <span style="font-size:.74rem;color:var(--muted);font-weight:700">Tampilan Rumus:</span>
      <div id="${id}-prev" style="color:var(--brand);font-size:.95rem"></div>
    </div>
  </div>`;
}

function bindKeypads(container){
  container.querySelectorAll('.key-btn').forEach(b=>{
    b.onclick=(e)=>{
      e.preventDefault();
      const p=b.closest('.math-keypad');
      const input=document.getElementById(p.dataset.target);
      if(!input)return;
      if(b.dataset.action==='clr'){
        input.value='';
      } else if(b.dataset.ins){
        const ins=b.dataset.ins;
        const s=input.selectionStart??input.value.length;
        const end=input.selectionEnd??input.value.length;
        input.value=input.value.slice(0,s)+ins+input.value.slice(end);
        input.focus();
        let pos=s+ins.length;
        if(ins==='()' || ins==='sqrt(' || ins==='sin(' || ins==='cos(') pos=(ins==='()'?s+1:s+ins.length);
        input.setSelectionRange(pos,pos);
      }
      input.dispatchEvent(new Event('input'));
    };
  });
  container.querySelectorAll('input[type="text"]').forEach(input=>{
    const prev=document.getElementById(`${input.id}-prev`);
    if(!prev)return;
    const upd=()=>{
      const v=input.value.trim();
      if(!v){prev.textContent='—';return}
      const tex=toTex(v);
      if(window.katex){try{katex.render(tex,prev,{throwOnError:false,displayMode:false})}catch{prev.textContent=v}}else{prev.textContent=v}
    };
    input.addEventListener('input',upd);
    upd();
  });
}

function createPanel(id,cfg,active){
  const methods=Object.entries(cfg.methods);
  const el=document.createElement('section');
  el.className='panel';
  el.id=id;
  el.setAttribute('role','tabpanel');
  el.setAttribute('aria-labelledby',`tab-${id}`);
  el.hidden=!active;
  el.innerHTML=`<div class="workspace"><form class="card form-card" novalidate><div class="form-head"><div><h2>${cfg.title}</h2><div class="formula" aria-label="Rumus metode"></div></div></div><div class="field"><label for="method-${id}">Metode</label><select id="method-${id}" name="method">${methods.map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></div><div class="field-grid" data-fields></div><div class="preset-container"></div><button class="primary" type="submit">Hitung &amp; tampilkan langkah</button></form><section class="card output" aria-live="polite"><div class="empty">Pilih metode, periksa masukan, lalu hitung.</div></section></div>`;
  document.querySelector('#panels').append(el);
  const form=el.querySelector('form');
  const refresh=()=>{
    const method=form.elements.method.value;
    form.querySelector('[data-fields]').innerHTML=cfg.methods[method][1].map(key=>fieldHTML(key,id)).join('');
    renderMath(form.querySelector('.formula'),formulas[method]);
    bindKeypads(form);
    const pBox=form.querySelector('.preset-container');
    if(pBox){
      if(method==='taylor'){
        pBox.innerHTML='<div style="margin:8px 0 12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span style="font-size:.76rem;font-weight:700;color:var(--brand)">Contoh Cepat:</span><button type="button" data-p="cos" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">cos(x) [x₀=0, x=0.5]</button><button type="button" data-p="sin" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">sin(x) [x₀=0, x=0.5]</button><button type="button" data-p="exp" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">e^x [x₀=0, x=1]</button><button type="button" data-p="poly" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">x³−x−2 [x₀=1.5, x=1]</button></div>';
        pBox.querySelectorAll('button').forEach(b=>{b.onclick=()=>{const t=b.dataset.p;if(t==='cos'){form.elements.fx.value='cos(x)';form.elements.x0.value='0';form.elements.x.value='0.5';form.elements.order.value='4'}else if(t==='sin'){form.elements.fx.value='sin(x)';form.elements.x0.value='0';form.elements.x.value='0.5';form.elements.order.value='5'}else if(t==='exp'){form.elements.fx.value='exp(x)';form.elements.x0.value='0';form.elements.x.value='1';form.elements.order.value='4'}else if(t==='poly'){form.elements.fx.value='x^3-x-2';form.elements.x0.value='1.5';form.elements.x.value='1';form.elements.order.value='4'}form.elements.fx.dispatchEvent(new Event('input'));form.dispatchEvent(new Event('submit'))}});
      } else if(id==='akar'&&(method==='bisection'||method==='regulaFalsi'||method==='modifiedRegulaFalsi'||method==='secant')){
        pBox.innerHTML='<div style="margin:8px 0 12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span style="font-size:.76rem;font-weight:700;color:var(--brand)">Contoh Cepat Kuliah PPT:</span><button type="button" data-p="s1" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">Soal 1: x²−x−3 [2, 4]</button><button type="button" data-p="s2" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">Soal 2: eˣ−5x² [0, 1]</button><button type="button" data-p="lat" style="padding:4px 8px;font-size:.74rem;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer">Latihan: x³+2x²+10x−20 [1, 1.5]</button></div>';
        pBox.querySelectorAll('button').forEach(b=>{b.onclick=()=>{const t=b.dataset.p;if(t==='s1'){form.elements.fx.value='x^2-x-3';form.elements.a.value='2';form.elements.b.value='4';form.elements.tol.value='0.0001';form.elements.max.value='20'}else if(t==='s2'){form.elements.fx.value='e^x-5x^2';form.elements.a.value='0';form.elements.b.value='1';form.elements.tol.value='0.00001';form.elements.max.value='30'}else if(t==='lat'){form.elements.fx.value='x^3+2x^2+10x-20';form.elements.a.value='1';form.elements.b.value='1.5';form.elements.tol.value='0.000001';form.elements.max.value='30'}form.elements.fx.dispatchEvent(new Event('input'));form.dispatchEvent(new Event('submit'))}});
      } else {
        pBox.innerHTML='';
      }
    }
  };
  form.elements.method.addEventListener('change',refresh);
  form.addEventListener('submit',e=>{e.preventDefault();calculate(id,form,el.querySelector('.output'))});
  refresh();
}
function renderMath(el,source){el.textContent='';if(window.katex){try{katex.render(source,el,{throwOnError:false,displayMode:source.includes('\\begin')||source.includes('\\implies')||source.includes('\\frac')||source.includes('\\left')})}catch(_){el.textContent=source}}else el.setAttribute('data-math',source)}
function rerenderMath(){document.querySelectorAll('[data-math]').forEach(el=>{const s=el.getAttribute('data-math');el.removeAttribute('data-math');renderMath(el,s)})}

function run(id,m,f){
  if(m==='errors')return core.calculateErrors(n(f,'exact'),n(f,'approx'));
  if(m==='taylor'){const fn=expr(f),o=Math.trunc(n(f,'order'));if(o<0||o>8)throw new Error('Orde Taylor harus bilangan bulat 0–8.');const x0=n(f,'x0'),targetX=n(f,'x');const res=core.taylorSeries(Array.from({length:o+1},(_,i)=>()=>core.numericalDerivative(fn,i,x0)),targetX,x0);const exact=fn(targetX);const ea=Math.abs(exact-res.value);const er=Math.abs(exact)>1e-12?(ea/Math.abs(exact))*100:null;return {...res,order:o,exact,absoluteError:ea,relativeErrorPercentage:er}}
  if(id==='akar'){if(m==='fixedPoint')return core.fixedPoint(expr(f,'gx'),n(f,'x0'),opts(f));if(m==='newton')return core.newton(expr(f),expr(f,'df'),n(f,'x0'),opts(f));if(m==='secant')return core.secant(expr(f),n(f,'a'),n(f,'b'),opts(f));return core[m](expr(f),n(f,'a'),n(f,'b'),opts(f))}
  if(id==='spl'){const A=matrix(f.elements.A.value);if(m==='luDecomposition')return core.luDecomposition(A);const B=vector(f.elements.B.value);if(B.length!==A.length)throw new Error('Panjang vektor b harus sama dengan ukuran matriks.');if(m==='jacobi'||m==='gaussSeidel'){const initial=vector(f.elements.initial.value);return core[m](A,B,{...opts(f),initial})}return core[m](A,B)}
  if(id==='interpolasi')return m==='linearRegression'?core.linearRegression(points(f.elements.pts.value)):core[m](points(f.elements.pts.value),n(f,'x'));
  if(id==='turunan')return core.finiteDifference(expr(f),n(f,'x'),n(f,'h'),m);
  if(id==='integrasi'){const fn=expr(f),a=n(f,'a'),b=n(f,'b');return m==='gaussLegendre'?core.gaussLegendre(fn,a,b,Math.trunc(n(f,'order'))):core[m](fn,a,b,Math.trunc(n(f,'sub')))}
  return core[m](expr(f,'ode'),n(f,'x0'),n(f,'y0'),n(f,'x'),n(f,'h'));
}
function summary(m,r){if(m==='errors')return `Galat absolut ${fmt(r.absolute)} · relatif ${fmt(r.relative)} · persentase ${fmt(r.percentage)}%`;if(m==='taylor'&&r.exact!==undefined)return `Versi 1 (Hampiran P${r.order}): ${fmt(r.value)} · Versi 2 (Nilai Sebenarnya): ${fmt(r.exact)} · Galat Ea: ${fmt(r.absoluteError)}${r.relativeErrorPercentage!==null?` (${fmt(r.relativeErrorPercentage)}%)`:''}`;if(r.root!==undefined)return `x ≈ ${fmt(r.root)}`;if(r.solution)return `x = ${fmt(r.solution)}`;if(m==='luDecomposition')return `L = ${fmt(r.L)} · U = ${fmt(r.U)}`;if(m==='linearRegression')return `ŷ = ${fmt(r.intercept)} + ${fmt(r.slope)}x · R² = ${fmt(r.r2)}`;if(r.y!==undefined)return `y(${fmt(r.x)}) ≈ ${fmt(r.y)}`;return `Hasil ≈ ${fmt(r.value)}`}
function rowData(r){const rows=r.iterations||r.steps||r.samples||r.residuals||[];return rows.slice(0,40)}
function tableHTML(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(Object.keys))].filter(k=>rows.some(r=>['number','string','boolean'].includes(typeof r[k])||Array.isArray(r[k]))).slice(0,9);return `<p class="table-hint">Geser tabel ke samping untuk melihat seluruh kolom.</p><div class="table-wrap" tabindex="0"><table><thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${fmt(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length>=40?'<p class="warning">Tabel dibatasi 40 baris agar tetap ringan.</p>':''}`}
function warning(r){if(r.converged===false)return 'Metode belum konvergen dalam batas iterasi. Periksa tebakan, interval, atau toleransi.';if((r.iterations||r.steps||[]).length>30)return 'Iterasi cukup panjang. Pertimbangkan tebakan awal atau ukuran langkah yang lebih sesuai.';return ''}
const eq=(s,tex=false)=>`<div class="calc-eq"${tex?` data-math="${esc(s)}"`:''}>${esc(s)}</div>`;
const stepCard=(title,text,equation='',isTex=false)=>`<div class="step"><b>${esc(title)}</b><p>${esc(text)}</p>${equation?eq(equation,isTex):''}</div>`;
const shown=(rows,limit=12)=>rows.slice(0,limit);
function calculationSteps(id,m,f,r){
  const cards=[];
  if(m==='errors'){
    const exact=n(f,'exact'),approx=n(f,'approx');
    cards.push(stepCard('1. Tulis nilai yang diketahui',`Nilai eksak = ${fmt(exact)} dan nilai hampiran = ${fmt(approx)}.`));
    cards.push(stepCard('2. Hitung galat absolut','Kurangkan kedua nilai, lalu ambil nilai mutlak.',`Ea = |${fmt(exact)} − ${fmt(approx)}| = ${fmt(r.absolute)}`));
    cards.push(stepCard('3. Hitung galat relatif','Bagi galat absolut dengan nilai mutlak nilai eksak.',`Er = ${fmt(r.absolute)} / |${fmt(exact)}| = ${fmt(r.relative)}`));
    cards.push(stepCard('4. Ubah menjadi persen','Kalikan galat relatif dengan 100%.',`Ep = ${fmt(r.relative)} × 100% = ${fmt(r.percentage)}%`));
  } else if(m==='taylor'){
    const x0=n(f,'x0'),x=n(f,'x'),source=f.elements.fx.value,dx=x-x0;
    cards.push(stepCard('1. Tentukan pusat dan perpindahan',`Fungsi f(x) = ${source}, pusat x₀ = ${fmt(x0)}, tujuan x = ${fmt(x)}.`,`Δx = x − x₀ = ${fmt(x)} − ${fmt(x0)} = ${fmt(dx)}`));
    cards.push(stepCard('2. Gunakan rumus Taylor','Setiap suku dihitung dari nilai turunan di x₀.',`Tk = f⁽ᵏ⁾(x₀) / k! × (Δx)ᵏ`));
    r.terms.map((row,i)=>cards.push(stepCard(`${i+3}. Suku orde ${row.order}`,`Turunan ke-${row.order} di x₀ ≈ ${fmt(row.derivative)}; ${row.order}! = ${fmt(row.factorial)}.`,`T${row.order} = ${fmt(row.derivative)} / ${fmt(row.factorial)} × (${fmt(dx)})^${row.order} = ${fmt(row.term)}; jumlah sementara = ${fmt(row.partialSum)}`)));
    cards.push(stepCard(`${r.terms.length+3}. Versi 1: Nilai Hampiran Taylor (Kalkulator Polinom P${r.order})`,`Jumlahkan seluruh suku dari T₀ sampai T${r.terms.at(-1).order}.`,`P${r.terms.at(-1).order}(${fmt(x)}) = ${r.terms.map(row=>fmt(row.term)).join(' + ')} = ${fmt(r.value)}`));
    if(r.exact!==undefined){
      cards.push(stepCard(`${r.terms.length+4}. Versi 2: Nilai Sebenarnya (Eksak Fungsi Asli f(x))`,`Hitung nilai analitis langsung f(${fmt(x)}) dari fungsi aslinya f(x) = ${source}.`,`f(${fmt(x)}) = ${fmt(r.exact)}`));
      cards.push(stepCard(`${r.terms.length+5}. Perbandingan Kedua Versi & Analisis Galat`,`Bandingkan Versi 1 (Hampiran Taylor) dengan Versi 2 (Nilai Sebenarnya). Galat absolut Ea = |f(x) − P${r.order}(x)|.`,`Ea = |${fmt(r.exact)} − ${fmt(r.value)}| = ${fmt(r.absoluteError)}${r.relativeErrorPercentage!==null?` · Galat relatif Er = ${fmt(r.relativeErrorPercentage)}%`:''}`));
    }
  } else if(id==='akar'){
    let fn = null;
    try { fn = expr(f); } catch(e) {}
    if (m === 'bisection' || m === 'regulaFalsi' || m === 'modifiedRegulaFalsi') {
      const a0 = n(f, 'a'), b0 = n(f, 'b'), tol = n(f, 'tol');
      let fa0 = null, fb0 = null, bolzanoOk = false;
      if (fn) {
        try {
          fa0 = fn(a0);
          fb0 = fn(b0);
          bolzanoOk = (fa0 * fb0) < 0;
        } catch(e) {}
      }
      const bSignA = (fa0 < 0 ? 'negatif' : 'positif');
      const bSignB = (fb0 < 0 ? 'negatif' : 'positif');
      const bMsg = bolzanoOk 
        ? `f(a) = f(${fmt(a0)}) = ${fmt(fa0)} (${bSignA}) dan f(b) = f(${fmt(b0)}) = ${fmt(fb0)} (${bSignB}). Karena f(a) · f(b) = (${fmt(fa0)})(${fmt(fb0)}) = ${fmt(fa0*fb0)} < 0 (berbeda tanda), Teorema Bolzano menjamin minimal terdapat satu akar real di selang (${fmt(a0)}; ${fmt(b0)}).`
        : `PERINGATAN: f(${fmt(a0)}) = ${fmt(fa0)} dan f(${fmt(b0)}) = ${fmt(fb0)} bertanda sama. Syarat f(a) · f(b) < 0 TIDAK terpenuhi!`;
      cards.push(stepCard('1. Uji Syarat Awal Keberadaan Akar (Teorema Bolzano)', bMsg, `f(${fmt(a0)}) \\cdot f(${fmt(b0)}) = ${fmt(fa0*fb0)} < 0`));

      if (m === 'bisection') {
        const w0 = Math.abs(b0 - a0);
        const nMin = Math.ceil((Math.log(w0) - Math.log(tol)) / Math.LN2);
        cards.push(stepCard('2. Perkiraan Kebutuhan Iterasi Teoretis (Bagi Dua)', `Lebar selang terbagi dua pada tiap lelaran: Lₙ = (b₀ − a₀) / 2ⁿ. Agar lebar selang lebih kecil dari toleransi ε = ${fmt(tol)}, dibutuhkan minimal ${nMin} kali pembagian selang.`, `n > \\frac{\\ln(${fmt(w0)}) - \\ln(${fmt(tol)})}{\\ln 2} \\approx ${fmt((Math.log(w0) - Math.log(tol)) / Math.LN2)} \\implies n \\ge ${nMin}`));
      } else if (m === 'modifiedRegulaFalsi') {
        cards.push(stepCard('2. Prinsip Modifikasi Skema Illinois (Anti Titik Macet)', `Jika ujung selang yang sama tertahan dua kali berturut-turut, nilai fungsinya dibagi dua (F = F/2) untuk memiringkan tali busur dan membebaskan titik macet.`, `F_{\\text{stagnan}} \\leftarrow \\frac{F_{\\text{stagnan}}}{2}`));
      }
    } else {
      cards.push(stepCard('1. Siapkan persamaan', m==='fixedPoint'?`Gunakan g(x) = ${f.elements.gx.value}.`:`Gunakan f(x) = ${f.elements.fx.value}.`));
    }

    shown(r.iterations).forEach((row, i) => {
      let stepNum = (m === 'bisection' || m === 'modifiedRegulaFalsi' ? i + 3 : (m === 'regulaFalsi' ? i + 2 : i + 2));
      let title = `${stepNum}. Iterasi ${row.iteration}`;
      let text = '';
      let equation = '';

      if (m === 'bisection') {
        const cVal = row.root, fcVal = row.value;
        const signFC = (fcVal < 0 ? 'negatif' : 'positif');
        const nextSub = (row.lower === cVal ? `[${fmt(cVal)}; ${fmt(row.upper)}] (batas kiri a bergeser)` : `[${fmt(row.lower)}; ${fmt(cVal)}] (batas kanan b bergeser)`);
        text = `Batas selang: [${fmt(row.lower)}; ${fmt(row.upper)}]. Titik tengah c = (${fmt(row.lower)} + ${fmt(row.upper)}) / 2 = ${fmt(cVal)}. Nilai fungsi f(c) = ${fmt(fcVal)} (${signFC}). Selang baru: ${nextSub}. Lebar selang = ${fmt(row.error * 2)}.`;
        equation = `c_{${row.iteration}} = \\frac{${fmt(row.lower)} + ${fmt(row.upper)}}{2} = ${fmt(cVal)}; \\quad f(c_{${row.iteration}}) = ${fmt(fcVal)}`;
      } else if (m === 'regulaFalsi' || m === 'modifiedRegulaFalsi') {
        const cVal = row.root, fcVal = row.value;
        const signFC = (fcVal < 0 ? 'negatif' : 'positif');
        const faVal = row.Fa ?? f.elements.a.value;
        const fbVal = row.Fb ?? f.elements.b.value;
        text = `Tarik garis sekant melalui selang [${fmt(row.lower)}; ${fmt(row.upper)}]. Titik potong sumbu-x menghasilkan taksiran c = ${fmt(cVal)}, nilai f(c) = ${fmt(fcVal)} (${signFC}). Galat pergeseran = ${fmt(row.error)}.`;
        equation = `c_{${row.iteration}} = \\frac{(${fmt(row.lower)}) \\cdot (${fmt(fbVal)}) - (${fmt(row.upper)}) \\cdot (${fmt(faVal)})}{(${fmt(fbVal)}) - (${fmt(faVal)})} = ${fmt(cVal)}; \\quad f(c_{${row.iteration}}) = ${fmt(fcVal)}`;
      } else if (m === 'fixedPoint') {
        text = `Hitung nilai lelaran x berikutnya dari persamaan g(x).`;
        equation = `x_{${row.iteration}} = g(${fmt(row.current)}) = ${fmt(row.next)}; \\quad \\text{galat} = ${fmt(row.error)}`;
      } else if (m === 'newton') {
        text = `Gunakan garis singgung dengan turunan pertama f'(x).`;
        equation = `x_{${row.iteration}} = ${fmt(row.current)} - \\frac{f(${fmt(row.current)})}{f'(${fmt(row.current)})} = ${fmt(row.next)}; \\quad \\text{galat} = ${fmt(row.error)}`;
      } else {
        text = `Gunakan pendekatan beda hingga sekant.`;
        equation = `x_{${row.iteration}} = ${fmt(row.next)}; \\quad \\text{galat} = ${fmt(row.error)}`;
      }
      cards.push(stepCard(title, text, equation));
    });

    if (r.iterations.length > 12) {
      cards.push(stepCard('… Iterasi Lanjutan Tersedia pada Tabel', `${r.iterations.length - 12} iterasi berikutnya dapat ditinjau lengkap pada tabel di bawah grafik.`));
    }
    cards.push(stepCard('Hasil Akhir Pencarian Akar', r.converged ? 'Kriteria toleransi galat berhasil dipenuhi.' : 'Batas iterasi maksimum tercapai.', `x \\approx ${fmt(r.root)}; \\quad f(x) \\approx ${fmt(r.value ?? (fn ? fn(r.root) : 0))}`));
  } else if(id==='spl'){
    const A=matrix(f.elements.A.value);
    const B=m!=='luDecomposition'?vector(f.elements.B.value):null;
    if(B&&(m==='gaussianElimination'||m==='gaussJordan')){
      cards.push(stepCard('1. Bentuk Sistem Augmented [A | b]', 'Tuliskan matriks koefisien dan vektor konstanta ke dalam matriks augmented:', texAugmented(A, B), true));
      shown(r.steps).forEach((row,i)=>{
        const isBack = row.operation==='back-substitute';
        const title = `${i+2}. ${isBack?'Substitusi Balik':row.operation==='swap'?'Tukar Baris':'Operasi Baris Elementer'}`;
        const text = row.operation==='swap'
          ? `Tukar baris R${row.rows[0]+1} dengan baris R${row.rows[1]+1} agar pivot diagonal bernilai mutlak terbesar.`
          : row.operation==='eliminate'
            ? `Nolkan baris ke-${row.row+1} di bawah pivot baris ke-${row.pivotRow+1}.`
            : row.operation==='normalize'
              ? `Bagi baris ke-${row.row+1} dengan elemen diagonal utama.`
              : `Substitusi nilai yang diketahui untuk memperoleh x${row.row+1}.`;
        cards.push(stepCard(title, text, texGaussStep(row), true));
      });
    } else {
      cards.push(stepCard('1. Bentuk sistem','Tuliskan matriks koefisien dan data yang diketahui.',m==='luDecomposition'?`A = ${fmt(A)}`:`A = ${fmt(A)}, b = ${fmt(vector(f.elements.B.value))}`));
      shown(r.steps).forEach((row,i)=>{
        let text='Lakukan operasi baris elementer.';
        let formula;
        if(row.operation==='swap'){text='Tukar baris untuk memperoleh pivot yang aman.';formula=`R${row.rows[0]+1} ↔ R${row.rows[1]+1}`}
        else if(row.operation==='eliminate'){formula=`R${row.row+1} ← R${row.row+1} − (${fmt(row.factor)})R${row.pivotRow+1}`}
        else if(row.operation==='normalize'){formula=`R${row.row+1} ← R${row.row+1} / ${fmt(row.divisor)}`}
        else {text='Substitusi balik dari persamaan terakhir.';formula=`x${row.row+1} = ${fmt(row.value)}`}
        cards.push(stepCard(`${i+2}. ${row.operation==='back-substitute'?'Substitusi balik':'Operasi baris'}`,text,`${formula}${row.matrix?`; matriks menjadi ${fmt(row.matrix)}`:''}`));
      });
    }
    if(m==='jacobi'||m==='gaussSeidel'){
      cards.length=1;
      shown(r.iterations).forEach((row,i)=>cards.push(stepCard(`${i+2}. Iterasi ${row.iteration}`,'Hitung setiap komponen dari persamaan yang telah diisolasi.',`x⁽${row.iteration}⁾ = ${fmt(row.values)}; galat maksimum = ${fmt(row.error)}`)));
    }
    if(r.steps.length>12)cards.push(stepCard('… Langkah lanjutan',`${r.steps.length-12} langkah berikutnya tersedia pada tabel.`));
    cards.push(stepCard('Hasil akhir',m==='luDecomposition'?'Matriks berhasil difaktorkan.':'Substitusikan kembali untuk memeriksa hasil.',m==='luDecomposition'?`L = ${fmt(r.L)}; U = ${fmt(r.U)}`:`x = ${fmt(r.solution)}`));
  } else if(id==='interpolasi'){
    const ps=points(f.elements.pts.value);
    cards.push(stepCard('1. Tulis data',`Titik yang digunakan: ${fmt(ps)}${m==='linearRegression'?'.':`; nilai tujuan x = ${fmt(n(f,'x'))}.`}`));
    if(m==='lagrange')shown(r.steps).forEach((row,i)=>cards.push(stepCard(`${i+2}. Hitung basis L${row.i}`,'Kalikan semua faktor basis, lalu kalikan dengan yᵢ.',`L${row.i} = ${row.factors.map(v=>fmt(v.factor)).join(' × ')} = ${fmt(row.basis)}; y${row.i}L${row.i} = ${fmt(row.contribution)}; jumlah = ${fmt(row.partialSum)}`)));
    else if(m==='newtonInterpolation')shown(r.steps).forEach((row,i)=>cards.push(stepCard(`${i+2}. Suku orde ${row.order}`,'Gunakan koefisien beda terbagi dan hasil kali (x − xᵢ).',`T${row.order} = ${fmt(row.coefficient)} × ${fmt(row.product)} = ${fmt(row.term)}; jumlah = ${fmt(row.partialSum)}`)));
    else {
      cards.push(stepCard('2. Hitung rata-rata','Jumlahkan setiap data lalu bagi banyak titik.',`x̄ = ${fmt(r.meanX)}; ȳ = ${fmt(r.meanY)}`));
      cards.push(stepCard('3. Hitung kemiringan dan konstanta','Gunakan penyimpangan setiap titik dari rata-ratanya.',`b = Σ[(x−x̄)(y−ȳ)] / Σ(x−x̄)² = ${fmt(r.slope)}; a = ȳ − bx̄ = ${fmt(r.intercept)}`));
      cards.push(stepCard('4. Bentuk model','Substitusikan a dan b ke persamaan garis.',`ŷ = ${fmt(r.intercept)} + ${fmt(r.slope)}x; R² = ${fmt(r.r2)}`));
    }
    if(m!=='linearRegression')cards.push(stepCard('Hasil interpolasi','Jumlahkan seluruh kontribusi.',`P(${fmt(n(f,'x'))}) = ${fmt(r.value)}`));
  } else if(id==='turunan'){
    const samples=r.samples.map(p=>`f(${fmt(p.x)}) = ${fmt(p.value)}`).join('; ');
    cards.push(stepCard('1. Ambil nilai fungsi','Hitung fungsi pada titik-titik yang diperlukan.',samples));
    const formulasText={forward:`[f(x+h) − f(x)] / h`,backward:`[f(x) − f(x−h)] / h`,central:`[f(x+h) − f(x−h)] / (2h)`,second:`[f(x+h) − 2f(x) + f(x−h)] / h²`};
    cards.push(stepCard('2. Substitusikan ke rumus',`Gunakan h = ${fmt(r.step)}.`,`${formulasText[m]} = ${fmt(r.value)}`));
    cards.push(stepCard('3. Hasil',m==='second'?'Nilai ini menghampiri turunan kedua.':'Nilai ini menghampiri turunan pertama.',`${m==='second'?'f″':'f′'}(${fmt(r.x)}) ≈ ${fmt(r.value)}`));
  } else if(id==='integrasi'){
    cards.push(stepCard('1. Tentukan lebar pias',m==='gaussLegendre'?`Gunakan kuadratur Gauss–Legendre orde ${r.order}.`:`Bagi interval menjadi ${n(f,'sub')} bagian sama.`,m==='gaussLegendre'?`x = (a+b)/2 + (b−a)t/2`:`h = (b−a)/n = ${fmt(r.stepSize)}`));
    shown(r.steps).forEach((row,i)=>cards.push(stepCard(`${i+2}. Titik ${row.i}`,'Hitung nilai fungsi dan kontribusinya.',`x${row.i} = ${fmt(row.x)}; f(x${row.i}) = ${fmt(row.fx)}; bobot = ${fmt(row.weight)}; kontribusi = ${fmt(row.contribution)}`)));
    const sum=r.steps.reduce((total,row)=>total+row.contribution,0);
    cards.push(stepCard('Hasil integral','Jumlahkan kontribusi, lalu gunakan faktor metode.',m==='trapezoid'?`I = h/2 × Σ(wᵢfᵢ) = ${fmt(r.value)}`:m==='simpson13'?`I = h/3 × Σ(wᵢfᵢ) = ${fmt(r.value)}`:m==='simpson38'?`I = 3h/8 × Σ(wᵢfᵢ) = ${fmt(r.value)}`:`I = Σ kontribusi = ${fmt(sum)}`));
  } else if(id==='pdb'){
    cards.push(stepCard('1. Nilai awal',`Gunakan f(x,y) = ${f.elements.ode.value}.`,`x₀ = ${fmt(n(f,'x0'))}; y₀ = ${fmt(n(f,'y0'))}; h = ${fmt(n(f,'h'))}`));
    shown(r.steps).forEach((row,i)=>{
      let formula=`k₁ = f(${fmt(row.x)}, ${fmt(row.y)}) = ${fmt(row.k1)}; y berikutnya = ${fmt(row.nextY)}`;
      if(m==='heun')formula=`k₁ = ${fmt(row.k1)}; prediksi = ${fmt(row.predictor)}; k₂ = ${fmt(row.k2)}; y berikutnya = ${fmt(row.nextY)}`;
      if(m==='rk4')formula=`k₁ = ${fmt(row.k1)}; k₂ = ${fmt(row.k2)}; k₃ = ${fmt(row.k3)}; k₄ = ${fmt(row.k4)}; y berikutnya = ${fmt(row.nextY)}`;
      cards.push(stepCard(`${i+2}. Langkah ${row.iteration}`,`Bergerak dari x = ${fmt(row.x)} ke x = ${fmt(row.nextX)}.`,formula));
    });
    cards.push(stepCard('Hasil akhir','Ambil nilai y pada x tujuan.',`y(${fmt(r.x)}) ≈ ${fmt(r.y)}`));
  }
  return `<div class="steps"><h3>Langkah Perhitungan</h3>${cards.join('')}</div>`;
}
function plotSVG(samples,{area=false,mark=null}={}){
  const clean=samples.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(clean.length<2)return '';
  let xmin=Math.min(...clean.map(p=>p.x),0),xmax=Math.max(...clean.map(p=>p.x),0),ymin=Math.min(...clean.map(p=>p.y),0),ymax=Math.max(...clean.map(p=>p.y),0);
  const padx=(xmax-xmin||1)*.08,pady=(ymax-ymin||1)*.12;xmin-=padx;xmax+=padx;ymin-=pady;ymax+=pady;
  const W=720,H=360,P=48,X=x=>P+(x-xmin)/(xmax-xmin)*(W-2*P),Y=y=>H-P-(y-ymin)/(ymax-ymin)*(H-2*P);
  const ticks=(min,max)=>Array.from({length:5},(_,i)=>min+(max-min)*i/4);
  const xt=ticks(xmin,xmax),yt=ticks(ymin,ymax),axisX=Math.max(P,Math.min(W-P,X(0))),axisY=Math.max(P,Math.min(H-P,Y(0)));
  const path=clean.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' '),fill=area?`${path} L${X(clean.at(-1).x)},${axisY} L${X(clean[0].x)},${axisY} Z`:'';
  const svg=`<svg class="plot" viewBox="0 0 ${W} ${H}" data-base-viewbox="0 0 ${W} ${H}" role="img" aria-label="Grafik Kartesius hasil numerik">${xt.map(v=>`<line class="grid-line" x1="${X(v)}" y1="${P}" x2="${X(v)}" y2="${H-P}"/><text class="tick-label" x="${X(v)}" y="${H-P+24}" text-anchor="middle">${graphFmt.format(Math.abs(v)<0.0005?0:v)}</text>`).join('')}${yt.map(v=>`<line class="grid-line" x1="${P}" y1="${Y(v)}" x2="${W-P}" y2="${Y(v)}"/><text class="tick-label" x="${P-7}" y="${Y(v)+7}" text-anchor="end">${graphFmt.format(Math.abs(v)<0.0005?0:v)}</text>`).join('')}<line class="axis-line" x1="${P}" y1="${axisY}" x2="${W-P}" y2="${axisY}"/><line class="axis-line" x1="${axisX}" y1="${P}" x2="${axisX}" y2="${H-P}"/><text class="axis-label" x="${W-P}" y="${axisY-10}" text-anchor="end">x</text><text class="axis-label" x="${axisX+10}" y="${P+18}">y</text>${area?`<path d="${fill}" fill="#65a98a33"/>`:''}<path d="${path}" fill="none" stroke="#176b4c" stroke-width="3" vector-effect="non-scaling-stroke"/>${clean.length<80?clean.map(p=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3" fill="#176b4c"/>`).join(''):''}${mark!==null&&Number.isFinite(mark)?`<circle cx="${X(mark)}" cy="${Y(clean.reduce((a,p)=>Math.abs(p.x-mark)<Math.abs(a.x-mark)?p:a).y)}" r="6" fill="#b45309"/>`:''}</svg>`;
  return `<section class="chart"><div class="chart-head"><b>Grafik Kartesius</b><div class="chart-controls"><button type="button" data-zoom="in" aria-label="Perbesar grafik">＋ Perbesar</button><button type="button" data-zoom="out" aria-label="Perkecil grafik">− Perkecil</button><button type="button" data-zoom="reset" aria-label="Atur ulang grafik">Atur ulang</button></div></div><div class="plot-wrap">${svg}</div></section>`;
}
function graph(id,m,f,r){try{
  if(id==='galat'){if(m==='errors')return plotSVG([{x:0,y:n(f,'exact')},{x:1,y:n(f,'approx')}]);const fn=expr(f),a=n(f,'x0'),b=n(f,'x'),center=(a+b)/2,span=Math.max(Math.abs(b-a)*2,1);return plotSVG(Array.from({length:101},(_,i)=>{const x=center-span+2*span*i/100;return{x,y:fn(x)}}),{mark:b})}
  if(id==='akar'){const fn=m==='fixedPoint'?x=>expr(f,'gx')(x)-x:expr(f);const center=r.root,span=Math.max(2,Math.abs(center||0));return plotSVG(Array.from({length:101},(_,i)=>{const x=center-span+2*span*i/100;return{x,y:fn(x)}}),{mark:center})}
  if(id==='spl'){const values=r.solution||(r.U?r.U.flat():[]);return plotSVG(values.map((y,x)=>({x:x+1,y})))}
  if(id==='interpolasi'){const ps=points(f.elements.pts.value);let fn;if(m==='linearRegression')fn=x=>r.intercept+r.slope*x;else fn=x=>core[m](ps,x).value;const lo=Math.min(...ps.map(p=>p[0])),hi=Math.max(...ps.map(p=>p[0]));return plotSVG(Array.from({length:101},(_,i)=>{const x=lo+(hi-lo)*i/100;return{x,y:fn(x)}}))}
  if(id==='turunan'){const fn=expr(f),center=n(f,'x'),span=Math.max(Math.abs(n(f,'h'))*4,1);return plotSVG(Array.from({length:101},(_,i)=>{const x=center-span+2*span*i/100;return{x,y:fn(x)}}),{mark:center})}
  if(id==='integrasi'){const fn=expr(f),a=n(f,'a'),b=n(f,'b');return plotSVG(Array.from({length:101},(_,i)=>{const x=a+(b-a)*i/100;return{x,y:fn(x)}}),{area:true})}
  if(id==='pdb')return plotSVG(r.points);
  return ''
}catch{return ''}}
function bindGraphZoom(out){out.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{const svg=out.querySelector('.plot');if(!svg)return;const base=svg.dataset.baseViewbox.split(' ').map(Number);if(button.dataset.zoom==='reset'){svg.setAttribute('viewBox',svg.dataset.baseViewbox);return}const current=svg.getAttribute('viewBox').split(' ').map(Number),factor=button.dataset.zoom==='in'?.8:1.25,nw=Math.max(base[2]*.25,Math.min(base[2]*4,current[2]*factor)),nh=Math.max(base[3]*.25,Math.min(base[3]*4,current[3]*factor));svg.setAttribute('viewBox',`${current[0]+(current[2]-nw)/2} ${current[1]+(current[3]-nh)/2} ${nw} ${nh}`)}))}
function calculate(id,form,out){const m=form.elements.method.value;out.setAttribute('aria-busy','true');try{if(!form.checkValidity()){form.reportValidity();throw new Error('Lengkapi semua masukan dengan nilai yang valid.')}const r=run(id,m,form),rows=rowData(r),warn=warning(r);out.innerHTML=`<div class="result"><small>Hasil ${configs[id].methods[m][0]}</small><strong>${summary(m,r)}</strong></div>${calculationSteps(id,m,form,r)}${warn?`<div class="warning" role="status">${warn}</div>`:''}${tableHTML(rows)}${graph(id,m,form,r)}`;bindGraphZoom(out);out.querySelectorAll('.calc-eq[data-math]').forEach(el=>renderMath(el,el.getAttribute('data-math')))}catch(e){out.innerHTML=`<div class="error" role="alert"><strong>Perhitungan belum dapat dilakukan.</strong><br>Masukan tidak valid: ${esc(e.message||e)}</div><div class="empty">Perbaiki masukan lalu coba kembali.</div>`}finally{out.removeAttribute('aria-busy')}}

Object.entries(configs).forEach(([id,cfg],i)=>createPanel(id,cfg,i===0));
document.getElementById('galat-fallback')?.remove();
const tabs=[...document.querySelectorAll('[role="tab"]')];
function activate(tab){tabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on});tab.focus()}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activate(tabs[next])})});
window.addEventListener('load',rerenderMath);