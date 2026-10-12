/* Sistema de Estoque de TI — aplicação (HTML/CSS/JS puro, dados salvos no navegador) */
'use strict';
(function () {
  const KEY = 'sei.db.v1', SES = 'sei.session', LOCK = 'sei.lock';
  const CATS = {
    notebooks: { nome: 'Notebooks', sing: 'Notebook', pref: 'NB', cor: '#2f6fed' },
    monitores: { nome: 'Monitores', sing: 'Monitor', pref: 'MON', cor: '#1fa89a' },
    celulares: { nome: 'Celulares', sing: 'Celular', pref: 'CEL', cor: '#f39c1f' },
    impressoras: { nome: 'Impressoras', sing: 'Impressora', pref: 'IMP', cor: '#8b5cf6' },
    perifericos: { nome: 'Periféricos', sing: 'Periférico', pref: 'PER', cor: '#d6455d' }
  };
  const STATUS = ['Em uso', 'Disponível', 'Manutenção'];
  const MOV = {
    entregas: { tipo: 'Entrega', nome: 'Entregas', sub: 'Registro de entregas de equipamentos', btn: 'Nova Entrega' },
    devolucoes: { tipo: 'Devolução', nome: 'Devoluções', sub: 'Registro de devoluções de equipamentos', btn: 'Nova Devolução' },
    transferencias: { tipo: 'Transferência', nome: 'Transferências', sub: 'Registro de transferências entre colaboradores', btn: 'Nova Transferência' }
  };
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '#/dashboard' },
    { id: 'movimentacoes', label: 'Movimentações', icon: 'swap', href: '#/movimentacoes/entregas',
      subs: [['entregas', 'Entregas'], ['devolucoes', 'Devoluções'], ['transferencias', 'Transferências']] },
    { id: 'equipamentos', label: 'Estoque de Equipamentos', icon: 'box', href: '#/equipamentos/todos',
      subs: [['todos', 'Todos'], ...Object.entries(CATS).map(([k, v]) => [k, v.nome])] },
    { id: 'suprimentos', label: 'Toners e Cilindros', icon: 'printer', href: '#/suprimentos/toners',
      subs: [['toners', 'Estoque de Toners'], ['cilindros', 'Estoque de Cilindros'], ['nova-retirada', 'Nova Retirada'], ['historico', 'Histórico de Retiradas']] },
    { id: 'usuarios', label: 'Usuários', icon: 'users', href: '#/usuarios/colaboradores',
      subs: [['colaboradores', 'Colaboradores'], ['vinculados', 'Equipamentos Vinculados'], ['historico', 'Histórico']] },
    { id: 'configuracoes', label: 'Configurações', icon: 'gear', href: '#/configuracoes' }
  ];

  /* ---------- utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = n => String(n).padStart(2, '0');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const today = () => nowLocal().slice(0, 10);
  const fmtD = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '';
  const fmtDT = s => s ? `${fmtD(s)} ${s.slice(11, 16)}` : '';
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    swap: '<path d="M4 8h14l-3-3"/><path d="M20 16H6l3 3"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M18 14.2c2 .7 3.5 2.6 3.5 5.8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.7A17 17 0 002 12s4 7 10 7a10 10 0 004.4-1"/>',
    download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>',
    tool: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2 19h20"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    stock: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/>'
  };
  const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
  const LOGO = `<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="52" height="36" rx="4"/><path d="M22 56h20M32 44v12"/><path d="M32 15l10 5.5v10L32 36l-10-5.5v-10z"/><path d="M22 20.5l10 5.5 10-5.5M32 26v10"/></svg>`;

  async function sha(s) {
    const t = 'sei:' + s;
    try {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let h = 5381; for (const c of t) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
      return 'f' + h.toString(16);
    }
  }

  /* ---------- dados ---------- */
  let db, session;
  const emptyDB = () => ({ versao: 1, users: [], setores: [], colaboradores: [], equipamentos: [], movimentacoes: [], suprimentos: [], retiradas: [] });
  function load() {
    try { const r = localStorage.getItem(KEY); db = r ? Object.assign(emptyDB(), JSON.parse(r)) : emptyDB(); }
    catch (e) { db = emptyDB(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('Não foi possível salvar os dados neste navegador (armazenamento cheio ou bloqueado).', 'err'); }
  }
  async function ensureAdmin() {
    if (db.users.length) return;
    db.users.push({ email: 'admin@sistema.com', nome: 'Administrador', hash: await sha('admin123'), padrao: true });
    save();
  }
  const colab = id => db.colaboradores.find(c => c.id === id);
  const equip = id => db.equipamentos.find(e => e.id === id);
  function eqView(e) {
    const c = e.status === 'Em uso' ? colab(e.usuarioId) : null;
    return { ...e, usuario: c ? c.nome : '', setorAtual: c ? c.setor : (e.status === 'Manutenção' ? 'TI' : 'Estoque') };
  }
  const eqDesc = e => `${CATS[e.cat].sing} ${e.marca} ${e.modelo}`.trim();
  const setorOpts = () => db.setores.map(s => [s, s]);

  /* ---------- interface básica ---------- */
  function toast(msg, tipo = '') {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + tipo; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }
  function field(label, name, o = {}) {
    const id = 'f-' + name, req = o.required ? ' *' : '';
    let ctl;
    if (o.options) {
      ctl = `<select class="select" id="${id}" name="${name}"${o.required ? ' required' : ''}>${o.placeholder !== false ? `<option value="">${esc(o.placeholder || 'Selecione')}</option>` : ''}${o.options.map(([v, l]) => `<option value="${esc(v)}"${String(o.value ?? '') === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (o.type === 'textarea') {
      ctl = `<textarea class="textarea" id="${id}" name="${name}" placeholder="${esc(o.placeholder || '')}">${esc(o.value || '')}</textarea>`;
    } else {
      ctl = `<input class="input" id="${id}" name="${name}" type="${o.type || 'text'}" value="${esc(o.value ?? '')}" placeholder="${esc(o.placeholder || '')}"${o.required ? ' required' : ''}${o.max ? ` max="${o.max}"` : ''}${o.min != null ? ` min="${o.min}"` : ''}${o.maxlength ? ` maxlength="${o.maxlength}"` : ''}${o.readonly ? ' readonly' : ''}>`;
    }
    return `<div class="field${o.full ? ' full' : ''}"><label for="${id}">${esc(label)}${req}</label>${ctl}${o.hint ? `<span class="hint">${esc(o.hint)}</span>` : ''}</div>`;
  }
  function modal({ title, body, submitLabel = 'Salvar', onSubmit, onOpen, wide, danger }) {
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><form novalidate><header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Fechar">${ic('x')}</button></header><div class="modal-body">${body}<p class="form-error" role="alert" hidden></p></div><footer><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" type="submit">${esc(submitLabel)}</button></footer></form></div>`;
    document.body.appendChild(ov);
    const form = $('form', ov), errEl = $('.form-error', ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    ov.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      for (const k in data) if (typeof data[k] === 'string') data[k] = data[k].trim();
      const err = onSubmit ? await onSubmit(data, form) : null;
      if (err) { errEl.textContent = err; errEl.hidden = false; } else close();
    });
    if (onOpen) onOpen(form);
    const first = $('input:not([readonly]),select,textarea', ov); if (first) first.focus();
    return ov;
  }
  const confirmBox = (msg, label, fn) => modal({ title: 'Confirmar ação', body: `<p>${esc(msg)}</p>`, submitLabel: label, danger: true, onSubmit: () => { fn(); return null; } });

  function pill(txt) {
    const m = { 'Em uso': 'green', 'Disponível': 'blue', 'Manutenção': 'amber', 'Ativo': 'green', 'Inativo': 'amber', 'Normal': 'green', 'Baixo': 'red', 'Zerado': 'red' };
    return `<span class="pill ${m[txt] || 'gray'}">${esc(txt)}</span>`;
  }
  function csv(cols, rows, nome) {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const exp = cols.filter(c => c.v);
    const txt = '﻿' + [exp.map(c => q(c.h)).join(';'), ...rows.map(r => exp.map(c => q(c.v(r))).join(';'))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = `${nome}-${today()}.csv`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* Lista genérica com filtros, paginação e exportação */
  function makeList(host, { filters, cols, getRows, onAct, empty, perPage = 10, exportName = 'dados' }) {
    host.innerHTML = `<div class="toolbar">${filters || ''}<button type="button" class="btn ghost sm" data-clear>Limpar filtros</button><button type="button" class="btn ghost sm" data-export>${ic('download')}Exportar CSV</button></div><div class="table-card"><div id="tbl"></div></div>`;
    const tb = $('.toolbar', host), tbl = $('#tbl', host);
    let page = 1, last = [];
    const read = () => { const f = {}; tb.querySelectorAll('[name]').forEach(el => f[el.name] = el.value); return f; };
    const draw = () => {
      last = getRows(read());
      const pages = Math.max(1, Math.ceil(last.length / perPage)); if (page > pages) page = pages;
      const slice = last.slice((page - 1) * perPage, page * perPage);
      if (!last.length) { tbl.innerHTML = `<div class="empty"><b>${esc(empty.titulo)}</b>${esc(empty.texto || '')}</div>`; return; }
      const nums = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
      tbl.innerHTML = `<div class="table-scroll"><table><thead><tr>${cols.map(c => `<th${c.cls ? ` class="${c.cls}"` : ''}>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${slice.map(r => `<tr>${cols.map(c => `<td${c.cls ? ` class="${c.cls}"` : ''}>${c.f ? c.f(r) : esc(c.v(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="pager"><span>Mostrando ${(page - 1) * perPage + 1} a ${(page - 1) * perPage + slice.length} de ${last.length} registro${last.length > 1 ? 's' : ''}</span><div class="pages"><button data-pg="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>${nums.map(n => n === '…' ? '<button disabled>…</button>' : `<button data-pg="${n}"${n === page ? ' aria-current="page"' : ''}>${n}</button>`).join('')}<button data-pg="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Próxima página">›</button></div></div>`;
    };
    tb.addEventListener('input', () => { page = 1; draw(); });
    tb.addEventListener('change', () => { page = 1; draw(); });
    tb.addEventListener('click', e => {
      if (e.target.closest('[data-clear]')) { tb.querySelectorAll('[name]').forEach(el => el.value = ''); page = 1; draw(); }
      if (e.target.closest('[data-export]')) { if (!last.length) return toast('Não há registros para exportar.'); csv(cols, last, exportName); }
    });
    tbl.addEventListener('click', e => {
      const pg = e.target.closest('[data-pg]'); if (pg) { page = +pg.dataset.pg; draw(); return; }
      const b = e.target.closest('[data-act]'); if (b && onAct) onAct(b.dataset.act, b.dataset.id);
    });
    draw();
    return draw;
  }
  const searchBox = ph => `<div class="search">${ic('search')}<input class="input" name="q" type="search" placeholder="${esc(ph)}" aria-label="${esc(ph)}"></div>`;
  const selBox = (name, label, opts) => `<select class="select" name="${name}" aria-label="${esc(label)}"><option value="">${esc(label)}</option>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
  const dateBox = (name, label) => `<input class="input date" type="date" name="${name}" aria-label="${esc(label)}" title="${esc(label)}">`;
  const actBtns = (id, extra = '') => `<td-actions>${extra}<button class="icon-btn" data-act="edit" data-id="${id}" aria-label="Editar" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-act="del" data-id="${id}" aria-label="Excluir" title="Excluir">${ic('trash')}</button></td-actions>`;
  const btns = (id, extra = '') => actBtns(id, extra).replace(/td-actions/g, 'span');
  const hit = (q, parts) => !q || norm(parts.join(' ')).includes(norm(q));

  /* ---------- estrutura (menu + cabeçalho) ---------- */
  function alertas() {
    const out = [];
    ['Toner', 'Cilindro'].forEach(t => {
      const n = db.suprimentos.filter(s => s.tipo === t && s.estoque <= s.minimo).length;
      if (n) out.push({ txt: `${n} ${t === 'Toner' ? (n > 1 ? 'toners' : 'toner') : (n > 1 ? 'cilindros' : 'cilindro')} com estoque baixo`, href: `#/suprimentos/${t === 'Toner' ? 'toners' : 'cilindros'}` });
    });
    return out;
  }
  function shell(sec, sub, title, subtitle, actionHTML = '') {
    const nav = NAV.map(n => {
      const on = n.id === sec;
      return `<a class="top" href="${n.href}"${on ? ' aria-current="page"' : ''}>${ic(n.icon)}<span>${esc(n.label)}</span></a>` +
        (on && n.subs ? `<div class="subs">${n.subs.map(([k, l]) => `<a href="#/${n.id}/${k}"${k === sub ? ' aria-current="page"' : ''}>${esc(l)}</a>`).join('')}</div>` : '');
    }).join('');
    const al = alertas();
    const ini = session.nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    $('#app').innerHTML = `<div class="shell"><aside class="sidebar" id="sidebar"><div class="brand">${LOGO.replace('logo-mark', '')}<div><b>Sistema de</b><strong>Estoque de TI</strong></div></div><nav class="nav" aria-label="Menu principal">${nav}<button class="logout" id="logout">${ic('logout')}<span>Sair</span></button></nav></aside>
      <main class="main"><div class="topbar"><div style="display:flex;gap:10px;align-items:flex-start"><button class="icon-btn menu-btn" id="menu" aria-label="Abrir menu">${ic('menu')}</button><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></div>
      <div class="top-actions">${actionHTML}<a class="icon-btn bell" href="${al[0] ? al[0].href : '#/dashboard'}" aria-label="Alertas: ${al.length}" title="${al.length ? esc(al.map(a => a.txt).join('; ')) : 'Nenhum alerta'}">${ic('bell')}${al.length ? `<span class="badge">${al.length}</span>` : ''}</a><div class="me"><span class="avatar" aria-hidden="true">${esc(ini)}</span><div><b>${esc(session.nome)}</b><small>${esc(session.email)}</small></div></div></div></div>
      <div id="view"></div><p class="footer">Sistema de Estoque de TI · Versão 1.0.0</p></main></div>`;
    $('#logout').onclick = () => { sessionStorage.removeItem(SES); localStorage.removeItem(SES); session = null; location.hash = '#/login'; };
    const sb = $('#sidebar');
    $('#menu').onclick = () => {
      sb.classList.toggle('open');
      let sc = $('.scrim'); if (sc) { sc.remove(); return; }
      sc = document.createElement('div'); sc.className = 'scrim'; sc.onclick = () => { sb.classList.remove('open'); sc.remove(); }; document.body.appendChild(sc);
    };
    return $('#view');
  }

  /* ---------- login ---------- */
  function renderLogin() {
    $('#app').innerHTML = `<div class="login"><section class="login-brand">${LOGO}<h1>Sistema de<span>Estoque de TI</span></h1><p>Controle de equipamentos e suprimentos de TI</p></section>
      <section class="login-form-wrap"><form class="login-form" id="lf" novalidate><h2>Acesse sua conta</h2><p class="sub">Informe suas credenciais para entrar no sistema</p><p class="form-error" id="le" role="alert" hidden></p>
      <div class="field"><label for="em">E-mail</label><input class="input" id="em" type="email" autocomplete="username" placeholder="seu.email@empresa.com" required></div>
      <div class="field"><label for="pw">Senha</label><div class="pw"><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="Sua senha" required><button type="button" class="icon-btn" id="tg" aria-label="Mostrar senha">${ic('eye')}</button></div></div>
      <label class="check"><input type="checkbox" id="rm"> Lembrar meu acesso</label><button class="btn primary block" type="submit">Entrar</button>
      ${db.users.some(u => u.email === 'admin@sistema.com' && u.padrao) ? '<p class="hint" style="text-align:center;margin-top:14px;color:var(--ink-2);font-size:13px">Primeiro acesso? Entre com <b>admin@sistema.com</b> e a senha <b>admin123</b>.</p>' : ''}
      <a class="forgot" href="#/login" id="fg">Esqueceu sua senha?</a><p class="copy">© ${new Date().getFullYear()} - Todos os direitos reservados.</p></form></section></div>`;
    const err = m => { const e = $('#le'); e.textContent = m; e.hidden = false; };
    $('#tg').onclick = () => { const i = $('#pw'), s = i.type === 'password'; i.type = s ? 'text' : 'password'; $('#tg').innerHTML = ic(s ? 'eyeoff' : 'eye'); $('#tg').setAttribute('aria-label', s ? 'Ocultar senha' : 'Mostrar senha'); };
    $('#fg').onclick = e => { e.preventDefault(); toast('Para redefinir a senha, procure o administrador do sistema.'); };
    $('#lf').onsubmit = async e => {
      e.preventDefault();
      let lk = {}; try { lk = JSON.parse(localStorage.getItem(LOCK) || '{}'); } catch (x) { }
      if (lk.ate && Date.now() < lk.ate) return err(`Muitas tentativas. Aguarde ${Math.ceil((lk.ate - Date.now()) / 1000)} segundos.`);
      const email = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
      if (!email || !pw) return err('Informe o e-mail e a senha.');
      const u = db.users.find(x => x.email.toLowerCase() === email), h = await sha(pw);
      if (!u || u.hash !== h) {
        const n = (lk.n || 0) + 1; localStorage.setItem(LOCK, JSON.stringify(n >= 5 ? { n: 0, ate: Date.now() + 60000 } : { n }));
        return err('E-mail ou senha incorretos.');
      }
      localStorage.removeItem(LOCK);
      session = { email: u.email, nome: u.nome };
      (($('#rm').checked ? localStorage : sessionStorage)).setItem(SES, JSON.stringify(session));
      location.hash = '#/dashboard';
    };
    $('#em').focus();
  }

  /* ---------- dashboard ---------- */
  function pageDashboard() {
    const eqs = db.equipamentos, n = s => eqs.filter(e => e.status === s).length;
    const sup = t => db.suprimentos.filter(s => s.tipo === t).reduce((a, s) => a + s.estoque, 0);
    const v = shell('dashboard', null, 'Dashboard', 'Visão geral do estoque de TI');
    const cards = [
      ['Equipamentos Cadastrados', eqs.length, 'Total de equipamentos', 'red', 'laptop'],
      ['Equipamentos em Uso', n('Em uso'), 'Em uso', 'blue', 'users'],
      ['Equipamentos em Estoque', n('Disponível'), 'Disponíveis', 'purple', 'box'],
      ['Equipamentos em Manutenção', n('Manutenção'), 'Em manutenção', 'rose', 'tool'],
      ['Toners Disponíveis', sup('Toner'), 'Em estoque', 'orange', 'printer'],
      ['Cilindros Disponíveis', sup('Cilindro'), 'Em estoque', 'maroon', 'stock']
    ];
    const cats = Object.entries(CATS).map(([k, c]) => ({ ...c, qtd: eqs.filter(e => e.cat === k).length }));
    const R = 70, C = 2 * Math.PI * R; let acc = 0;
    const arcs = eqs.length ? cats.filter(c => c.qtd).map(c => { const len = c.qtd / eqs.length * C; const s = `<circle cx="86" cy="86" r="${R}" fill="none" stroke="${c.cor}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}"/>`; acc += len; return s; }).join('') : `<circle cx="86" cy="86" r="${R}" fill="none" stroke="#e6e8ed" stroke-width="26"/>`;
    const ult = [...db.movimentacoes].sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 5);
    const al = alertas(), mes = today().slice(0, 7), ret = db.retiradas.filter(r => r.data.startsWith(mes));
    const defaultPw = db.users.find(u => u.email === session.email)?.padrao;
    v.innerHTML = `${defaultPw ? `<div class="alert" style="margin-bottom:14px">${ic('warn')}<span>Você ainda usa uma senha provisória. <a href="#/configuracoes"><b>Altere a senha agora</b></a>.</span></div>` : ''}
      <div class="stats">${cards.map(c => `<div class="stat"><div class="top"><span class="tile ${c[3]}">${ic(c[4])}</span>${esc(c[0])}</div><div class="num">${c[1]}</div><div class="lbl">${esc(c[2])}</div></div>`).join('')}</div>
      <div class="grid-2"><section class="card"><h3>Equipamentos por Categoria</h3><div class="donut-wrap"><div class="donut"><svg width="172" height="172" viewBox="0 0 172 172" role="img" aria-label="Gráfico de equipamentos por categoria">${arcs}</svg><div class="center"><small>Total</small><b>${eqs.length}</b><small>Equipamentos</small></div></div>
        <div class="legend">${cats.map(c => `<div><i style="background:${c.cor}"></i><span>${c.nome}</span><span class="v">${c.qtd}</span><span class="p">(${eqs.length ? (c.qtd / eqs.length * 100).toFixed(1).replace('.', ',') : '0,0'}%)</span></div>`).join('')}</div></div></section>
      <section class="card"><h3>Últimas Movimentações</h3>${ult.length ? `<div class="table-scroll"><table><thead><tr><th>Data/Hora</th><th>Equipamento</th><th>Tipo</th><th>Usuário</th><th>Setor</th><th>Responsável</th></tr></thead><tbody>${ult.map(m => `<tr><td>${fmtDT(m.dataHora)}</td><td>${esc(m.equipamento)}</td><td>${esc(m.tipo)}</td><td>${esc(m.usuario)}</td><td>${esc(m.setor)}</td><td>${esc(m.responsavel)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><b>Nenhuma movimentação registrada</b>As entregas, devoluções e transferências aparecerão aqui.</div>`}</section></div>
      <div class="grid-2b"><section class="card"><h3>Alertas</h3><div class="alerts">${al.length ? al.map(a => `<a class="alert" href="${a.href}" style="text-decoration:none">${ic('warn')}${esc(a.txt)}</a>`).join('') : `<div class="alert ok">${ic('check')}Nenhum alerta no momento.</div>`}</div></section>
      <section class="card"><h3>Retiradas de Suprimentos (Mês Atual)</h3><div class="withdraw"><span class="tile red">${ic('printer')}</span><div><b>${ret.length}</b><span class="lbl muted">Total de retiradas</span></div></div></section></div>`;
  }

  /* ---------- equipamentos ---------- */
  function equipForm(e, catPadrao) {
    const novo = !e, d = e || { cat: catPadrao && catPadrao !== 'todos' ? catPadrao : '', status: 'Disponível' };
    if (!db.setores.length && false) return;
    const ativos = db.colaboradores.filter(c => c.status === 'Ativo' || c.id === d.usuarioId).map(c => [c.id, `${c.nome} (${c.setor})`]);
    const body = `<div class="form-grid">${field('Categoria', 'cat', { options: Object.entries(CATS).map(([k, c]) => [k, c.sing]), value: d.cat, required: true })}
      ${field('Patrimônio', 'patrimonio', { value: d.patrimonio, required: true, placeholder: 'Ex.: NB-000123', maxlength: 30 })}
      ${field('Marca', 'marca', { value: d.marca, required: true, maxlength: 40 })}${field('Modelo', 'modelo', { value: d.modelo, required: true, maxlength: 60 })}
      ${field('Nº de Série', 'serie', { value: d.serie, maxlength: 60 })}${field('Status', 'status', { options: STATUS.map(s => [s, s]), value: d.status, required: true, placeholder: false })}
      <div class="full" id="uw" ${d.status === 'Em uso' ? '' : 'hidden'}>${field('Colaborador responsável', 'usuarioId', { options: ativos, value: d.usuarioId, hint: ativos.length ? '' : 'Cadastre um colaborador ativo para vincular o equipamento.' })}</div></div>`;
    modal({
      title: novo ? 'Novo Equipamento' : 'Editar Equipamento', body, wide: true,
      onOpen: f => {
        const st = f.elements.status, cat = f.elements.cat, pat = f.elements.patrimonio;
        st.onchange = () => { $('#uw', f).hidden = st.value !== 'Em uso'; };
        cat.onchange = () => { if (novo && (!pat.value.trim() || pat.dataset.auto) && cat.value) { const pref = CATS[cat.value].pref; const max = db.equipamentos.filter(x => x.cat === cat.value).map(x => parseInt((x.patrimonio.match(/(\d+)$/) || [0, 0])[1], 10)).reduce((a, b) => Math.max(a, b), 0); pat.value = `${pref}-${String(max + 1).padStart(6, '0')}`; pat.dataset.auto = '1'; } };
        pat.addEventListener('input', () => { delete pat.dataset.auto; });
        if (novo && cat.value) cat.onchange();
      },
      onSubmit: x => {
        if (!x.cat || !x.patrimonio || !x.marca || !x.modelo) return 'Preencha categoria, patrimônio, marca e modelo.';
        x.patrimonio = x.patrimonio.toUpperCase();
        if (db.equipamentos.some(o => o.patrimonio === x.patrimonio && (novo || o.id !== e.id))) return 'Já existe um equipamento com este patrimônio.';
        if (x.serie && db.equipamentos.some(o => o.serie && o.serie.toLowerCase() === x.serie.toLowerCase() && (novo || o.id !== e.id))) return 'Já existe um equipamento com este número de série.';
        if (x.status === 'Em uso' && !x.usuarioId) return 'Selecione o colaborador responsável para equipamentos em uso.';
        const rec = { cat: x.cat, patrimonio: x.patrimonio, marca: x.marca, modelo: x.modelo, serie: x.serie, status: x.status, usuarioId: x.status === 'Em uso' ? x.usuarioId : '' };
        if (novo) db.equipamentos.push({ id: uid(), ...rec }); else Object.assign(e, rec);
        save(); toast(novo ? 'Equipamento cadastrado.' : 'Equipamento atualizado.', 'ok'); route(); return null;
      }
    });
  }
  function pageEquip(cat) {
    const all = cat === 'todos'; if (!all && !CATS[cat]) { location.hash = '#/equipamentos/todos'; return; }
    const v = shell('equipamentos', cat, all ? 'Estoque de Equipamentos' : CATS[cat].nome, all ? 'Gerencie todos os equipamentos cadastrados' : `Gerencie o estoque de ${CATS[cat].nome.toLowerCase()}`, `<button class="btn primary" id="novo">${ic('plus')}Novo Equipamento</button>`);
    $('#novo').onclick = () => equipForm(null, cat);
    const cols = [
      ...(all ? [{ h: 'Categoria', v: r => CATS[r.cat].sing }] : []),
      { h: 'Patrimônio', v: r => r.patrimonio }, { h: 'Modelo', v: r => r.modelo }, { h: 'Marca', v: r => r.marca }, { h: 'Nº Série', v: r => r.serie },
      { h: 'Setor', v: r => r.setorAtual }, { h: 'Status', v: r => r.status, f: r => pill(r.status) }, { h: 'Usuário', v: r => r.usuario, f: r => esc(r.usuario || '–') },
      { h: 'Ações', cls: 'actions', f: r => btns(r.id) }
    ];
    makeList(v, {
      filters: searchBox('Buscar equipamento...') + selBox('status', 'Todos os status', STATUS.map(s => [s, s])) + selBox('setor', 'Todos os setores', [...setorOpts(), ['Estoque', 'Estoque']]),
      cols, exportName: all ? 'equipamentos' : cat,
      getRows: f => db.equipamentos.filter(e => all || e.cat === cat).map(eqView).filter(e => (!f.status || e.status === f.status) && (!f.setor || e.setorAtual === f.setor) && hit(f.q, [e.patrimonio, e.modelo, e.marca, e.serie, e.usuario])).sort((a, b) => a.patrimonio.localeCompare(b.patrimonio, 'pt', { numeric: true })),
      empty: { titulo: db.equipamentos.length ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado', texto: db.equipamentos.length ? 'Ajuste os filtros para ver outros resultados.' : 'Use “Novo Equipamento” para cadastrar o primeiro item.' },
      onAct: (a, id) => {
        const e = equip(id); if (!e) return;
        if (a === 'edit') equipForm(e);
        if (a === 'del') confirmBox(`Excluir o equipamento ${e.patrimonio}? O histórico de movimentações será mantido.`, 'Excluir', () => { db.equipamentos = db.equipamentos.filter(x => x.id !== id); save(); toast('Equipamento excluído.', 'ok'); route(); });
      }
    });
  }

  /* ---------- movimentações ---------- */
  function movForm(k) {
    const M = MOV[k];
    const eqOpt = filtro => db.equipamentos.map(eqView).filter(filtro).sort((a, b) => a.patrimonio.localeCompare(b.patrimonio, 'pt', { numeric: true })).map(e => [e.id, `${e.patrimonio} — ${e.marca} ${e.modelo}${e.usuario ? ' (' + e.usuario + ')' : ''}`]);
    const ativos = db.colaboradores.filter(c => c.status === 'Ativo').map(c => [c.id, `${c.nome} (${c.setor})`]);
    const lista = k === 'entregas' ? eqOpt(e => e.status === 'Disponível') : eqOpt(e => e.status === 'Em uso');
    const vazio = !lista.length ? `<p class="form-error">${k === 'entregas' ? 'Não há equipamentos disponíveis em estoque.' : 'Não há equipamentos em uso.'} Cadastre ou atualize equipamentos antes de registrar.</p>` : '';
    const body = `${vazio}${field('Equipamento', 'eq', { options: lista, required: true, placeholder: 'Selecione o equipamento' })}
      ${k !== 'devolucoes' ? field(k === 'entregas' ? 'Entregar para' : 'Transferir para', 'to', { options: ativos, required: true, placeholder: 'Selecione o colaborador', hint: ativos.length ? '' : 'Cadastre um colaborador ativo primeiro.' }) : ''}
      ${field('Observações', 'obs', { type: 'textarea', placeholder: 'Opcional' })}`;
    modal({
      title: M.btn, body, submitLabel: 'Registrar',
      onSubmit: x => {
        const e = equip(x.eq); if (!e) return 'Selecione o equipamento.';
        const antes = eqView(e); let usuario, setor, de = '';
        if (k === 'entregas') {
          if (e.status !== 'Disponível') return 'Este equipamento não está disponível.';
          const c = colab(x.to); if (!c || c.status !== 'Ativo') return 'Selecione um colaborador ativo.';
          e.status = 'Em uso'; e.usuarioId = c.id; usuario = c.nome; setor = c.setor;
        } else if (k === 'devolucoes') {
          if (e.status !== 'Em uso') return 'Este equipamento não está em uso.';
          usuario = antes.usuario; setor = antes.setorAtual; e.status = 'Disponível'; e.usuarioId = '';
        } else {
          if (e.status !== 'Em uso') return 'Este equipamento não está em uso.';
          const c = colab(x.to); if (!c || c.status !== 'Ativo') return 'Selecione um colaborador ativo.';
          if (c.id === e.usuarioId) return 'O novo colaborador deve ser diferente do atual.';
          de = antes.usuario; e.usuarioId = c.id; usuario = c.nome; setor = c.setor;
        }
        db.movimentacoes.push({ id: uid(), dataHora: nowLocal(), tipo: M.tipo, equipId: e.id, patrimonio: e.patrimonio, equipamento: eqDesc(e), usuario, setor, de, obs: x.obs, responsavel: session.nome });
        save(); toast(`${M.tipo} registrada.`, 'ok'); route(); return null;
      }
    });
  }
  function pageMov(k) {
    const M = MOV[k]; if (!M) { location.hash = '#/movimentacoes/entregas'; return; }
    const v = shell('movimentacoes', k, M.nome, M.sub, `<button class="btn primary" id="novo">${ic('plus')}${M.btn}</button>`);
    $('#novo').onclick = () => movForm(k);
    const base = db.movimentacoes.filter(m => m.tipo === M.tipo);
    const cols = [
      { h: 'Data/Hora', v: r => fmtDT(r.dataHora) }, { h: 'Equipamento', v: r => r.equipamento }, { h: 'Patrimônio', v: r => r.patrimonio },
      ...(k === 'transferencias' ? [{ h: 'De', v: r => r.de }] : []),
      { h: k === 'devolucoes' ? 'Devolvido por' : 'Usuário', v: r => r.usuario }, { h: 'Setor', v: r => r.setor }, { h: 'Responsável', v: r => r.responsavel }
    ];
    makeList(v, {
      filters: dateBox('de', 'Data inicial') + dateBox('ate', 'Data final') + searchBox('Buscar equipamento ou patrimônio...') + selBox('usuario', 'Todos os usuários', [...new Set(base.map(m => m.usuario))].sort().map(u => [u, u])) + selBox('setor', 'Todos os setores', [...new Set(base.map(m => m.setor))].sort().map(u => [u, u])),
      cols, exportName: k,
      getRows: f => base.filter(m => (!f.de || m.dataHora.slice(0, 10) >= f.de) && (!f.ate || m.dataHora.slice(0, 10) <= f.ate) && (!f.usuario || m.usuario === f.usuario) && (!f.setor || m.setor === f.setor) && hit(f.q, [m.equipamento, m.patrimonio])).sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
      empty: { titulo: base.length ? 'Nenhum registro encontrado' : `Nenhuma ${M.tipo.toLowerCase()} registrada`, texto: base.length ? 'Ajuste os filtros.' : `Use “${M.btn}” para registrar a primeira.` }
    });
  }

  /* ---------- toners e cilindros ---------- */
  const TIPO = { toners: 'Toner', cilindros: 'Cilindro' };
  const situ = s => s.estoque <= 0 ? 'Zerado' : s.estoque <= s.minimo ? 'Baixo' : 'Normal';
  function supForm(tipo, s) {
    modal({
      title: s ? `Editar ${tipo.toLowerCase()}` : `Novo modelo de ${tipo.toLowerCase()}`,
      body: `<div class="form-grid">${field('Modelo', 'modelo', { value: s?.modelo, required: true, maxlength: 40, full: true, placeholder: tipo === 'Toner' ? 'Ex.: TN-0000' : 'Ex.: DR-0000' })}${s ? '' : field('Quantidade inicial', 'estoque', { type: 'number', min: 0, value: 0 })}${field('Estoque mínimo (alerta)', 'minimo', { type: 'number', min: 0, value: s ? s.minimo : 1, required: true })}</div>`,
      onSubmit: x => {
        x.modelo = x.modelo.toUpperCase(); if (!x.modelo) return 'Informe o modelo.';
        if (db.suprimentos.some(o => o.tipo === tipo && o.modelo === x.modelo && o !== s)) return 'Este modelo já está cadastrado.';
        const min = parseInt(x.minimo, 10), est = parseInt(x.estoque || 0, 10);
        if (!(min >= 0) || (!s && !(est >= 0))) return 'Informe quantidades válidas (zero ou mais).';
        if (s) { s.modelo = x.modelo; s.minimo = min; } else db.suprimentos.push({ id: uid(), tipo, modelo: x.modelo, estoque: est, minimo: min });
        save(); toast('Salvo.', 'ok'); route(); return null;
      }
    });
  }
  function entradaForm(tipo, s0) {
    const mods = db.suprimentos.filter(s => s.tipo === tipo);
    modal({
      title: `Registrar entrada de ${tipo.toLowerCase()}`,
      body: `${!mods.length ? '<p class="form-error">Cadastre um modelo antes de registrar entradas.</p>' : ''}${field('Modelo', 'id', { options: mods.map(s => [s.id, `${s.modelo} (estoque: ${s.estoque})`]), value: s0?.id, required: true })}${field('Quantidade', 'qtd', { type: 'number', min: 1, required: true })}`,
      submitLabel: 'Registrar entrada',
      onSubmit: x => {
        const s = db.suprimentos.find(o => o.id === x.id), q = parseInt(x.qtd, 10);
        if (!s) return 'Selecione o modelo.'; if (!(q >= 1)) return 'Informe uma quantidade maior que zero.';
        s.estoque += q; save(); toast('Entrada registrada.', 'ok'); route(); return null;
      }
    });
  }
  function pageSupEstoque(k) {
    const tipo = TIPO[k], plural = k === 'toners' ? 'toners' : 'cilindros';
    const v = shell('suprimentos', k, `Estoque de ${k === 'toners' ? 'Toners' : 'Cilindros'}`, `Controle o estoque de ${plural}`, `<button class="btn ghost" id="ent">${ic('plus')}Registrar entrada</button><button class="btn primary" id="novo">${ic('plus')}Novo modelo</button>`);
    $('#novo').onclick = () => supForm(tipo); $('#ent').onclick = () => entradaForm(tipo);
    makeList(v, {
      filters: searchBox('Buscar modelo...') + selBox('sit', 'Todas as situações', ['Normal', 'Baixo', 'Zerado'].map(s => [s, s])),
      cols: [{ h: 'Modelo', v: r => r.modelo }, { h: 'Em estoque', v: r => r.estoque, cls: 'num' }, { h: 'Mínimo', v: r => r.minimo, cls: 'num' }, { h: 'Situação', v: r => situ(r), f: r => pill(situ(r)) },
      { h: 'Ações', cls: 'actions', f: r => `<button class="icon-btn" data-act="in" data-id="${r.id}" aria-label="Registrar entrada" title="Registrar entrada">${ic('plus')}</button><button class="icon-btn" data-act="edit" data-id="${r.id}" aria-label="Editar" title="Editar">${ic('edit')}</button>` }],
      exportName: 'estoque-' + k,
      getRows: f => db.suprimentos.filter(s => s.tipo === tipo && (!f.sit || situ(s) === f.sit) && hit(f.q, [s.modelo])).sort((a, b) => a.modelo.localeCompare(b.modelo, 'pt', { numeric: true })),
      empty: { titulo: `Nenhum modelo de ${tipo.toLowerCase()} cadastrado`, texto: 'Use “Novo modelo” para começar.' },
      onAct: (a, id) => { const s = db.suprimentos.find(o => o.id === id); if (!s) return; if (a === 'edit') supForm(tipo, s); if (a === 'in') entradaForm(tipo, s); }
    });
  }
  function pageRetirada() {
    const v = shell('suprimentos', 'nova-retirada', 'Nova Retirada de Suprimento', 'Preencha os dados da retirada');
    v.innerHTML = `<form class="panel" id="rf" novalidate><p class="form-error" id="re" role="alert" hidden></p><div class="form-grid">
      ${field('Número do Chamado', 'chamado', { required: true, maxlength: 30, placeholder: 'Ex.: CH-2025-00001' })}
      ${field('Tipo', 'tipo', { required: true, options: [['Toner', 'Toner'], ['Cilindro', 'Cilindro']], placeholder: 'Selecione o tipo' })}
      ${field('Modelo', 'modelo', { required: true, options: [], placeholder: 'Selecione o modelo' })}
      ${field('Quantidade', 'qtd', { type: 'number', min: 1, required: true, placeholder: 'Informe a quantidade' })}
      ${field('Setor', 'setor', { required: true, options: setorOpts(), placeholder: 'Selecione o setor', hint: db.setores.length ? '' : 'Nenhum setor cadastrado. Cadastre em Configurações.' })}
      ${field('Nome da Pessoa que Retirou', 'pessoa', { required: true, maxlength: 80, placeholder: 'Informe o nome' })}
      ${field('Data da Retirada', 'data', { type: 'date', required: true, value: today(), max: today() })}
      <div></div>${field('Observações', 'obs', { type: 'textarea', full: true, placeholder: 'Informações adicionais (opcional)' })}</div>
      <div class="form-actions"><button type="button" class="btn ghost" id="cancel">Cancelar</button><button class="btn primary" type="submit">Salvar Retirada</button></div></form>`;
    const f = $('#rf'), tipo = f.elements.tipo, mod = f.elements.modelo, qtd = f.elements.qtd;
    const err = m => { const e = $('#re'); e.textContent = m; e.hidden = false; e.scrollIntoView({ block: 'nearest' }); };
    tipo.onchange = () => { mod.innerHTML = '<option value="">Selecione o modelo</option>' + db.suprimentos.filter(s => s.tipo === tipo.value).map(s => `<option value="${esc(s.id)}">${esc(s.modelo)} (estoque: ${s.estoque})</option>`).join(''); };
    $('#cancel').onclick = () => { location.hash = '#/suprimentos/historico'; };
    f.onsubmit = e => {
      e.preventDefault();
      const x = Object.fromEntries(new FormData(f)); for (const k in x) x[k] = String(x[k]).trim();
      const s = db.suprimentos.find(o => o.id === x.modelo), q = parseInt(x.qtd, 10);
      if (!x.chamado || !x.tipo || !s || !x.setor || !x.pessoa || !x.data) return err('Preencha todos os campos obrigatórios (*).');
      if (!(q >= 1)) return err('Informe uma quantidade maior que zero.');
      if (x.data > today()) return err('A data da retirada não pode ser futura.');
      if (q > s.estoque) return err(`Estoque insuficiente: há ${s.estoque} unidade(s) do modelo ${s.modelo}.`);
      s.estoque -= q;
      db.retiradas.push({ id: uid(), chamado: x.chamado.toUpperCase(), tipo: s.tipo, modelo: s.modelo, qtd: q, setor: x.setor, pessoa: x.pessoa, data: x.data, obs: x.obs, registradoPor: session.nome, criadoEm: nowLocal() });
      save(); toast('Retirada registrada e estoque atualizado.', 'ok'); location.hash = '#/suprimentos/historico';
    };
  }
  function pageRetHist() {
    const v = shell('suprimentos', 'historico', 'Histórico de Retiradas', 'Consulte o histórico de retiradas de toners e cilindros', `<a class="btn primary" href="#/suprimentos/nova-retirada" style="text-decoration:none">${ic('plus')}Nova Retirada</a>`);
    makeList(v, {
      filters: dateBox('de', 'Data inicial') + dateBox('ate', 'Data final') + searchBox('Buscar chamado, modelo ou pessoa...') + selBox('tipo', 'Todos os tipos', [['Toner', 'Toner'], ['Cilindro', 'Cilindro']]) + selBox('setor', 'Todos os setores', setorOpts()),
      cols: [{ h: 'Chamado', v: r => r.chamado }, { h: 'Tipo', v: r => r.tipo }, { h: 'Modelo', v: r => r.modelo }, { h: 'Quantidade', v: r => r.qtd, cls: 'num' }, { h: 'Setor', v: r => r.setor }, { h: 'Responsável', v: r => r.pessoa }, { h: 'Data', v: r => fmtD(r.data) }, { h: 'Observações', v: r => r.obs }].map(c => c.h === 'Observações' ? { h: c.h, v: c.v, f: r => `<span class="muted">${esc(r.obs || '–')}</span>` } : c),
      exportName: 'retiradas',
      getRows: f => db.retiradas.filter(r => (!f.de || r.data >= f.de) && (!f.ate || r.data <= f.ate) && (!f.tipo || r.tipo === f.tipo) && (!f.setor || r.setor === f.setor) && hit(f.q, [r.chamado, r.modelo, r.pessoa])).sort((a, b) => (b.data + b.criadoEm).localeCompare(a.data + a.criadoEm)),
      empty: { titulo: db.retiradas.length ? 'Nenhuma retirada encontrada' : 'Nenhuma retirada registrada', texto: db.retiradas.length ? 'Ajuste os filtros.' : 'As retiradas registradas aparecerão aqui.' }
    });
  }

  /* ---------- colaboradores ---------- */
  function colabForm(c) {
    const novo = !c, d = c || { status: 'Ativo' };
    modal({
      title: novo ? 'Novo Colaborador' : 'Editar Colaborador', wide: true,
      body: `<div class="form-grid">${field('Nome', 'nome', { value: d.nome, required: true, maxlength: 80, full: true })}${field('Matrícula', 'matricula', { value: d.matricula, required: true, maxlength: 20 })}${field('E-mail', 'email', { type: 'email', value: d.email, required: true, maxlength: 80 })}${field('Setor', 'setor', { options: setorOpts(), value: d.setor, required: true, hint: db.setores.length ? '' : 'Cadastre setores em Configurações.' })}${field('Status', 'status', { options: [['Ativo', 'Ativo'], ['Inativo', 'Inativo']], value: d.status, placeholder: false })}
        ${c && db.users.some(u => u.email.toLowerCase() === String(c.email).toLowerCase()) ? '<p class="hint full muted">Este colaborador já tem acesso ao sistema. Para redefinir a senha, use Configurações.</p>' : `<label class="check full"><input type="checkbox" name="acesso" value="1"> Permitir acesso ao sistema (login com este e-mail)</label><div class="full" id="aw" hidden>${field('Senha provisória', 'senha', { type: 'password', hint: 'Mínimo de 8 caracteres. A pessoa será avisada para trocá-la no primeiro acesso.' })}</div>`}</div>`,
      onOpen: f => { const ck = f.elements.acesso; if (ck) ck.onchange = () => { $('#aw', f).hidden = !ck.checked; }; },
      onSubmit: async x => {
        if (!x.nome || !x.matricula || !x.email || !x.setor) return 'Preencha nome, matrícula, e-mail e setor.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)) return 'Informe um e-mail válido.';
        if (db.colaboradores.some(o => o.matricula === x.matricula && o !== c)) return 'Já existe um colaborador com esta matrícula.';
        if (c && x.status === 'Inativo' && db.equipamentos.some(e => e.status === 'Em uso' && e.usuarioId === c.id)) return 'Este colaborador possui equipamentos vinculados. Registre a devolução antes de inativá-lo.';
        const rec = { nome: x.nome, matricula: x.matricula, email: x.email.toLowerCase(), setor: x.setor, status: x.status };
        let acesso = null;
        if (x.acesso) {
          if ((x.senha || '').length < 8) return 'A senha provisória deve ter no mínimo 8 caracteres.';
          if (db.users.some(u => u.email.toLowerCase() === rec.email)) return 'Já existe um usuário de acesso com este e-mail.';
          acesso = { email: rec.email, nome: rec.nome, hash: await sha(x.senha), padrao: true };
        }
        if (novo) db.colaboradores.push({ id: uid(), ...rec }); else Object.assign(c, rec);
        if (acesso) db.users.push(acesso);
        save(); toast(acesso ? 'Colaborador salvo e acesso criado.' : 'Colaborador salvo.', 'ok'); route(); return null;
      }
    });
  }
  function pageColab() {
    const v = shell('usuarios', 'colaboradores', 'Colaboradores', 'Gerencie os colaboradores do sistema', `<button class="btn primary" id="novo">${ic('plus')}Novo Colaborador</button>`);
    $('#novo').onclick = () => colabForm();
    makeList(v, {
      filters: searchBox('Buscar colaborador...') + selBox('setor', 'Todos os setores', setorOpts()) + selBox('status', 'Todos os status', [['Ativo', 'Ativo'], ['Inativo', 'Inativo']]),
      cols: [{ h: 'Nome', v: r => r.nome }, { h: 'Matrícula', v: r => r.matricula }, { h: 'E-mail', v: r => r.email }, { h: 'Setor', v: r => r.setor }, { h: 'Status', v: r => r.status, f: r => pill(r.status) }, { h: 'Ações', cls: 'actions', f: r => btns(r.id) }],
      exportName: 'colaboradores',
      getRows: f => db.colaboradores.filter(c => (!f.setor || c.setor === f.setor) && (!f.status || c.status === f.status) && hit(f.q, [c.nome, c.matricula, c.email])).sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
      empty: { titulo: db.colaboradores.length ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado', texto: db.colaboradores.length ? 'Ajuste os filtros.' : 'Use “Novo Colaborador” para cadastrar o primeiro.' },
      onAct: (a, id) => {
        const c = colab(id); if (!c) return;
        if (a === 'edit') colabForm(c);
        if (a === 'del') {
          if (db.equipamentos.some(e => e.status === 'Em uso' && e.usuarioId === id)) return toast('Este colaborador possui equipamentos vinculados. Registre a devolução antes de excluir.', 'err');
          confirmBox(`Excluir o colaborador ${c.nome}? O histórico de movimentações será mantido.`, 'Excluir', () => { db.colaboradores = db.colaboradores.filter(x => x.id !== id); save(); toast('Colaborador excluído.', 'ok'); route(); });
        }
      }
    });
  }
  function pageVinc() {
    const v = shell('usuarios', 'vinculados', 'Equipamentos Vinculados', 'Equipamentos em uso por colaborador');
    makeList(v, {
      filters: searchBox('Buscar colaborador ou equipamento...') + selBox('setor', 'Todos os setores', setorOpts()),
      cols: [{ h: 'Colaborador', v: r => r.usuario }, { h: 'Matrícula', v: r => colab(r.usuarioId)?.matricula || '' }, { h: 'Setor', v: r => r.setorAtual }, { h: 'Patrimônio', v: r => r.patrimonio }, { h: 'Equipamento', v: r => eqDesc(r) }],
      exportName: 'equipamentos-vinculados',
      getRows: f => db.equipamentos.map(eqView).filter(e => e.status === 'Em uso' && (!f.setor || e.setorAtual === f.setor) && hit(f.q, [e.usuario, e.patrimonio, e.modelo, e.marca])).sort((a, b) => a.usuario.localeCompare(b.usuario, 'pt')),
      empty: { titulo: 'Nenhum equipamento vinculado', texto: 'Os equipamentos entregues a colaboradores aparecerão aqui.' }
    });
  }
  function pageUsrHist() {
    const v = shell('usuarios', 'historico', 'Histórico', 'Movimentações por colaborador');
    makeList(v, {
      filters: dateBox('de', 'Data inicial') + dateBox('ate', 'Data final') + searchBox('Buscar colaborador ou equipamento...') + selBox('tipo', 'Todos os tipos', Object.values(MOV).map(m => [m.tipo, m.tipo])),
      cols: [{ h: 'Data/Hora', v: r => fmtDT(r.dataHora) }, { h: 'Tipo', v: r => r.tipo }, { h: 'Colaborador', v: r => r.usuario }, { h: 'De', v: r => r.de }, { h: 'Equipamento', v: r => r.equipamento }, { h: 'Patrimônio', v: r => r.patrimonio }, { h: 'Responsável', v: r => r.responsavel }],
      exportName: 'historico-colaboradores',
      getRows: f => db.movimentacoes.filter(m => (!f.de || m.dataHora.slice(0, 10) >= f.de) && (!f.ate || m.dataHora.slice(0, 10) <= f.ate) && (!f.tipo || m.tipo === f.tipo) && hit(f.q, [m.usuario, m.de, m.equipamento, m.patrimonio])).sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
      empty: { titulo: 'Nenhuma movimentação registrada', texto: 'O histórico aparecerá conforme as movimentações forem registradas.' }
    });
  }

  /* ---------- configurações ---------- */
  function pageConfig() {
    const v = shell('configuracoes', null, 'Configurações', 'Conta, setores e dados do sistema');
    v.innerHTML = `<form class="panel" id="pf" novalidate><h3>Alterar senha</h3><p class="form-error" id="pe" role="alert" hidden></p><div class="form-grid">${field('Senha atual', 'atual', { type: 'password', required: true })}<div></div>${field('Nova senha', 'nova', { type: 'password', required: true, hint: 'Mínimo de 8 caracteres.' })}${field('Confirmar nova senha', 'conf', { type: 'password', required: true })}</div><div class="form-actions"><button class="btn primary" type="submit">Salvar senha</button></div></form>
      <section class="panel"><h3>Usuários de acesso</h3><p class="muted" style="margin-bottom:12px">Pessoas que podem entrar no sistema. Quem recebe uma senha provisória é avisado para trocá-la.</p><div class="table-scroll" id="ul"></div><div class="row-btns" style="margin-top:12px"><button class="btn primary" id="nu">${ic('plus')}Novo usuário</button></div></section>
      <section class="panel"><h3>Setores</h3><ul class="list-plain" id="sl">${db.setores.length ? db.setores.map(s => `<li>${esc(s)}</li>`).join('') : '<li class="muted">Nenhum setor cadastrado.</li>'}</ul><form id="sf" class="row-btns" novalidate><input class="input" name="s" placeholder="Nome do novo setor" aria-label="Nome do novo setor" maxlength="40" style="max-width:260px"><button class="btn primary" type="submit">${ic('plus')}Adicionar setor</button></form></section>
      <section class="panel"><h3>Dados</h3><p class="muted" style="margin-bottom:12px">Os dados ficam salvos neste navegador. Faça backups periódicos. O backup não inclui senhas.</p><div class="row-btns"><button class="btn ghost" id="bk">${ic('download')}Exportar backup</button><label class="btn ghost" style="cursor:pointer">Importar backup<input type="file" id="im" accept="application/json" hidden></label><button class="btn danger" id="rs">${ic('trash')}Apagar todos os dados</button></div></section>`;
    const pe = m => { const e = $('#pe'); e.textContent = m; e.hidden = false; };
    $('#pf').onsubmit = async e => {
      e.preventDefault(); const f = e.target, u = db.users.find(x => x.email === session.email);
      if (await sha(f.atual.value) !== u.hash) return pe('A senha atual está incorreta.');
      if (f.nova.value.length < 8) return pe('A nova senha deve ter no mínimo 8 caracteres.');
      if (f.nova.value !== f.conf.value) return pe('A confirmação não confere com a nova senha.');
      if (f.nova.value === 'admin123') return pe('Escolha uma senha diferente da senha padrão.');
      u.hash = await sha(f.nova.value); delete u.padrao; save(); f.reset(); $('#pe').hidden = true; toast('Senha alterada.', 'ok');
    };
    $('#sf').onsubmit = e => {
      e.preventDefault(); const s = e.target.s.value.trim().replace(/\s+/g, ' ');
      if (!s) return toast('Informe o nome do setor.', 'err');
      if (db.setores.some(o => norm(o) === norm(s))) return toast('Este setor já existe.', 'err');
      if (norm(s) === 'estoque') return toast('“Estoque” é reservado pelo sistema.', 'err');
      db.setores.push(s); db.setores.sort((a, b) => a.localeCompare(b, 'pt')); save(); toast('Setor adicionado.', 'ok'); route();
    };
    const drawUsers = () => {
      $('#ul').innerHTML = `<table><thead><tr><th>Nome</th><th>E-mail</th><th class="actions">Ações</th></tr></thead><tbody>${db.users.map(u => `<tr><td>${esc(u.nome)}${u.email === session.email ? ' <span class="pill gray">você</span>' : ''}</td><td>${esc(u.email)}</td><td class="actions"><button class="icon-btn" data-act="pw" data-em="${esc(u.email)}" aria-label="Redefinir senha" title="Redefinir senha">${ic('edit')}</button>${u.email === session.email ? '' : `<button class="icon-btn danger" data-act="rm" data-em="${esc(u.email)}" aria-label="Excluir acesso" title="Excluir acesso">${ic('trash')}</button>`}</td></tr>`).join('')}</tbody></table>`;
    };
    drawUsers();
    const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    $('#nu').onclick = () => modal({
      title: 'Novo usuário de acesso',
      body: `<div class="form-grid">${field('Nome', 'nome', { required: true, maxlength: 80, full: true })}${field('E-mail', 'email', { type: 'email', required: true, maxlength: 80, full: true })}${field('Senha provisória', 'senha', { type: 'password', required: true, full: true, hint: 'Mínimo de 8 caracteres. Informe a senha à pessoa; ela será avisada para trocá-la.' })}</div>`,
      onSubmit: async x => {
        const email = x.email.toLowerCase();
        if (!x.nome || !email || !x.senha) return 'Preencha nome, e-mail e senha.';
        if (!validEmail(email)) return 'Informe um e-mail válido.';
        if (db.users.some(u => u.email.toLowerCase() === email)) return 'Já existe um usuário com este e-mail.';
        if (x.senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
        db.users.push({ email, nome: x.nome, hash: await sha(x.senha), padrao: true });
        save(); toast('Usuário criado.', 'ok'); drawUsers(); return null;
      }
    });
    $('#ul').onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const u = db.users.find(x => x.email === b.dataset.em); if (!u) return;
      if (b.dataset.act === 'rm') {
        if (u.email === session.email || db.users.length < 2) return toast('Não é possível excluir o próprio acesso.', 'err');
        confirmBox(`Excluir o acesso de ${u.nome}?`, 'Excluir', () => { db.users = db.users.filter(x => x !== u); save(); toast('Acesso excluído.', 'ok'); drawUsers(); });
      } else {
        modal({
          title: `Redefinir senha de ${u.nome}`,
          body: field('Nova senha provisória', 'senha', { type: 'password', required: true, hint: 'Mínimo de 8 caracteres. A pessoa será avisada para trocá-la.' }),
          onSubmit: async x => {
            if (x.senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
            u.hash = await sha(x.senha); u.padrao = true; save(); toast('Senha redefinida.', 'ok'); return null;
          }
        });
      }
    };
    $('#bk').onclick = () => {
      const { users, ...dados } = db, a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 1)], { type: 'application/json' })); a.download = `backup-estoque-ti-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
    };
    $('#im').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result), ks = ['setores', 'colaboradores', 'equipamentos', 'movimentacoes', 'suprimentos', 'retiradas'];
          if (!ks.every(k => Array.isArray(d[k]))) throw 0;
          confirmBox('Importar este backup substituirá todos os dados atuais (as senhas são mantidas). Continuar?', 'Importar', () => { ks.forEach(k => db[k] = d[k]); save(); toast('Backup importado.', 'ok'); route(); });
        } catch (x) { toast('Arquivo de backup inválido.', 'err'); }
      };
      r.readAsText(file); e.target.value = '';
    };
    $('#rs').onclick = () => confirmBox('Apagar TODOS os dados (equipamentos, colaboradores, movimentações, suprimentos e retiradas)? Esta ação não pode ser desfeita. Considere exportar um backup antes.', 'Apagar tudo', () => { const u = db.users; db = emptyDB(); db.users = u; save(); toast('Dados apagados.', 'ok'); location.hash = '#/dashboard'; route(); });
  }

  /* ---------- rotas ---------- */
  function route() {
    const [sec, sub] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
    document.querySelectorAll('.overlay,.scrim').forEach(n => n.remove());
    if (!session && sec !== 'login') { location.hash = '#/login'; return; }
    if (session && sec === 'login') { location.hash = '#/dashboard'; return; }
    window.scrollTo(0, 0);
    if (sec === 'login') return renderLogin();
    if (sec === 'dashboard') return pageDashboard();
    if (sec === 'movimentacoes') return pageMov(sub || 'entregas');
    if (sec === 'equipamentos') return pageEquip(sub || 'todos');
    if (sec === 'suprimentos') {
      if (sub === 'cilindros') return pageSupEstoque('cilindros');
      if (sub === 'nova-retirada') return pageRetirada();
      if (sub === 'historico') return pageRetHist();
      return pageSupEstoque('toners');
    }
    if (sec === 'usuarios') {
      if (sub === 'vinculados') return pageVinc();
      if (sub === 'historico') return pageUsrHist();
      return pageColab();
    }
    if (sec === 'configuracoes') return pageConfig();
    location.hash = '#/dashboard';
  }

  (async function boot() {
    load(); await ensureAdmin();
    try { session = JSON.parse(sessionStorage.getItem(SES) || localStorage.getItem(SES) || 'null'); } catch (e) { session = null; }
    if (session && !db.users.some(u => u.email === session.email)) session = null;
    window.addEventListener('hashchange', route);
    route();
  })();
})();
