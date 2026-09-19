import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const INTERVAL = Math.max(60, Number(process.env.CHECK_INTERVAL_SECONDS || 60)) * 1000;
const TOKEN = process.env.DASHBOARD_TOKEN || 'zelda';
const products = [
  {id:'console-amazon',name:'Console Zelda',store:'Amazon',url:'https://link.amazon/B0600ITmQ'},
  {id:'console-ml',name:'Console Zelda',store:'Mercado Livre',url:'https://descpromo.com/r/6sIOq9'},
  {id:'pro-amazon',name:'Controle Pro Zelda',store:'Amazon',url:'https://link.amazon/B03Y06bTZ'},
  {id:'pro-ml',name:'Controle Pro Zelda',store:'Mercado Livre',url:'https://descpromo.com/r/Ah6bFY'}
];
const state = {}, history = [];
const sold = ['currently unavailable','temporarily out of stock','produto indisponível','indisponível','sem estoque','esgotado','anúncio pausado','publicação pausada','não está disponível'];
const buy = ['adicionar ao carrinho','comprar agora','comprar com 1-clique','add to cart','buy now','em estoque'];
const clean = h => h.toLowerCase().replace(/<script[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

async function telegram(p) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const text = `🎮 ${p.name} voltou ao estoque na ${p.store}!\n${p.finalUrl || p.url}`;
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text,disable_web_page_preview:false}),signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error(`Telegram HTTP ${r.status}`);
}

async function check(p) {
  const prev = state[p.id] || {};
  let item = {...p,checkedAt:new Date().toISOString(),status:'incerto',reason:'Sem indicador confiável'};
  try {
    const r = await fetch(p.url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36','accept-language':'pt-BR,pt;q=0.9'},signal:AbortSignal.timeout(20000)});
    const text = clean(await r.text()); item.finalUrl = r.url; item.http = r.status;
    if (r.status===429 || /captcha|robot check|access denied|acesso negado/.test(text)) {item.status='bloqueado';item.reason='A loja bloqueou a consulta automática';}
    else {const no=sold.find(x=>text.includes(x)),yes=buy.find(x=>text.includes(x));if(no){item.status='indisponível';item.reason=no;}else if(yes){item.status='disponível';item.reason=yes;}}
  } catch(e) {item.status='erro';item.reason=e.name==='TimeoutError'?'Tempo excedido':e.message;}
  item.confirmations=item.status==='disponível'?(prev.confirmations||0)+1:0; item.lastAlert=prev.lastAlert||null;
  if(item.confirmations>=2 && (!item.lastAlert || Date.now()-Date.parse(item.lastAlert)>21600000)) {try{await telegram(item);item.alert='enviado';item.lastAlert=new Date().toISOString();}catch(e){item.alert='falhou';item.alertError=e.message;}}
  state[p.id]=item;history.unshift(item);if(history.length>300)history.pop();
}
let busy=false;async function run(){if(busy)return;busy=true;try{for(const p of products)await check(p);}finally{busy=false;}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=()=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="30"><title>Monitor Zelda</title><style>body{margin:auto;max-width:1000px;padding:22px;background:#07140f;color:#eff8f2;font:15px system-ui}h1{color:#f2c94c}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{padding:16px;background:#10251b;border:1px solid #294635;border-radius:14px}.disponível{color:#55d98a}.indisponível,.erro{color:#ff6b6b}.incerto,.bloqueado{color:#f2c94c}small{color:#9db4a6}table{margin-top:20px;width:100%;border-collapse:collapse}td,th{padding:9px;border-bottom:1px solid #294635;text-align:left}a{color:#f2c94c}</style><h1>Monitor Zelda</h1><p>Atualização visual a cada 30 segundos · consultas a cada ~1 minuto</p><div class="grid">${products.map(p=>{const x=state[p.id]||p;return `<div class="card"><b>${esc(p.name)}</b><p>${esc(p.store)}</p><strong class="${esc(x.status)}">${esc(x.status||'aguardando')}</strong><p><small>${esc(x.reason||'Primeira consulta em andamento')}</small></p><small>${x.checkedAt?new Date(x.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):''}</small><p><a href="${esc(x.finalUrl||p.url)}">Abrir anúncio</a></p></div>`}).join('')}</div><table><tr><th>Horário</th><th>Produto</th><th>Loja</th><th>Resultado</th></tr>${history.slice(0,60).map(x=>`<tr><td>${new Date(x.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td><td>${esc(x.name)}</td><td>${esc(x.store)}</td><td class="${esc(x.status)}">${esc(x.status)}</td></tr>`).join('')}</table></html>`;
http.createServer((req,res)=>{const u=new URL(req.url,`http://${req.headers.host}`);if(u.pathname==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,busy}));}if(u.searchParams.get('token')!==TOKEN){res.writeHead(401,{'content-type':'text/plain; charset=utf-8'});return res.end('Use o link privado do painel.');}res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(page());}).listen(PORT,()=>console.log(`Monitor ativo na porta ${PORT}`));
await run();setInterval(run,INTERVAL+Math.floor(Math.random()*8000));
