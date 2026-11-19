import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, Bell, Bot, Check, ChevronDown, CircleUserRound, Clock3,
  Headphones, Inbox, LayoutDashboard, Mail, Menu, MessageCircle,
  MoreHorizontal, Plus, Search, Send, Settings, Sparkles, Tag,
  TicketCheck, UserRound, UsersRound, X, Zap
} from "lucide-react";
import "./styles.css";

const channelMeta = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, className: "whatsapp" },
  email: { label: "E-mail", icon: Mail, className: "email" },
  telegram: { label: "Telegram", icon: Send, className: "telegram" }
};

const seedConversations = [
  {
    id: 1, name: "Marina Costa", initials: "MC", channel: "whatsapp", time: "Agora",
    preview: "Quero acompanhar meu pedido #4821", unread: 2, status: "ia", mood: "Neutro",
    email: "marina.costa@email.com", phone: "+55 11 98842-1234", orders: 3,
    messages: [
      { from: "customer", text: "Olá! Quero acompanhar meu pedido #4821.", time: "10:42" },
      { from: "ai", text: "Oi, Marina! Encontrei seu pedido. Ele saiu para entrega hoje às 09:18 e deve chegar até 18h.", time: "10:42" },
      { from: "customer", text: "Perfeito. Consigo mudar o endereço de entrega?", time: "10:43" }
    ]
  },
  {
    id: 2, name: "Rafael Lima", initials: "RL", channel: "email", time: "5 min",
    preview: "Não reconheço uma cobrança no cartão", unread: 1, status: "urgente", mood: "Preocupado",
    email: "rafael.lima@email.com", phone: "+55 21 99118-3050", orders: 1,
    messages: [
      { from: "customer", text: "Recebi uma cobrança que não reconheço. Podem verificar?", time: "10:36" },
      { from: "ai", text: "Sinto muito por isso, Rafael. Para sua segurança, sinalizei o caso como urgente e vou transferir para nosso time financeiro.", time: "10:37" }
    ]
  },
  {
    id: 3, name: "Camila Oliveira", initials: "CO", channel: "telegram", time: "12 min",
    preview: "Como altero o plano da minha conta?", unread: 0, status: "ia", mood: "Positivo",
    email: "camila.o@email.com", phone: "+55 31 98870-4421", orders: 5,
    messages: [
      { from: "customer", text: "Como altero o plano da minha conta?", time: "10:28" },
      { from: "ai", text: "Você pode trocar em Configurações > Plano. A mudança entra em vigor no próximo ciclo.", time: "10:29" }
    ]
  },
  {
    id: 4, name: "João Pedro", initials: "JP", channel: "whatsapp", time: "18 min",
    preview: "Meu produto chegou com defeito", unread: 3, status: "humano", mood: "Insatisfeito",
    email: "joao.pedro@email.com", phone: "+55 41 99802-7710", orders: 2,
    messages: [
      { from: "customer", text: "Meu produto chegou com defeito e preciso trocar.", time: "10:20" },
      { from: "ai", text: "Entendi, João. Vou encaminhar sua solicitação para uma pessoa do nosso time de trocas.", time: "10:21" }
    ]
  },
  {
    id: 5, name: "Beatriz Souza", initials: "BS", channel: "email", time: "24 min",
    preview: "Obrigada pelo atendimento!", unread: 0, status: "resolvido", mood: "Positivo",
    email: "bia.souza@email.com", phone: "+55 51 98761-9902", orders: 4,
    messages: [
      { from: "customer", text: "Obrigada pelo atendimento! Deu tudo certo.", time: "10:14" },
      { from: "ai", text: "Que bom saber disso, Beatriz! Conte com a gente quando precisar.", time: "10:15" }
    ]
  }
];

const seedTickets = [
  { id: 1042, title: "Cobrança não reconhecida", customer: "Rafael Lima", priority: "Urgente", assignee: "Time financeiro", status: "aberto", created: "Há 8 min" },
  { id: 1041, title: "Produto entregue com defeito", customer: "João Pedro", priority: "Alta", assignee: "Time de trocas", status: "aberto", created: "Há 22 min" },
  { id: 1040, title: "Alteração de endereço", customer: "Marina Costa", priority: "Média", assignee: "Fila geral", status: "aberto", created: "Há 34 min" },
  { id: 1039, title: "Mudança de plano concluída", customer: "Camila Oliveira", priority: "Baixa", assignee: "Ana Silva", status: "resolvido", created: "Ontem" }
];

const statusLabel = {
  ia: ["IA respondendo", "violet"], urgente: ["Urgente", "red"],
  humano: ["Com atendente", "blue"], resolvido: ["Resolvido", "green"]
};

function classifyIncoming(text) {
  const message = text.toLowerCase();
  if (["cobrança", "cartão", "fraude", "estorno", "defeito"].some(word => message.includes(word))) {
    return { status: "urgente", mood: "Preocupado", topic: "Caso delicado", reply: "Entendi. Para cuidar deste caso com atenção, já encaminhei a conversa para uma pessoa do nosso time." };
  }
  if (["pedido", "entrega", "rastrear"].some(word => message.includes(word))) {
    return { status: "ia", mood: "Neutro", topic: "Entrega", reply: "Encontrei sua solicitação. Vou consultar o andamento do pedido e mostrar a atualização por aqui." };
  }
  if (["plano", "assinatura", "mensalidade"].some(word => message.includes(word))) {
    return { status: "ia", mood: "Neutro", topic: "Plano", reply: "Posso ajudar com seu plano. A alteração pode ser feita na área de configurações da conta." };
  }
  return { status: "ia", mood: "Neutro", topic: "Dúvida geral", reply: "Recebi sua mensagem. Vou buscar a informação correta para ajudar você." };
}

function ChannelBadge({ channel, compact = false }) {
  const meta = channelMeta[channel];
  const Icon = meta.icon;
  return <span className={`channel-badge ${meta.className} ${compact ? "compact" : ""}`}><Icon size={14} />{!compact && meta.label}</span>;
}

function Sidebar({ open, onClose, activeView, onViewChange }) {
  const nav = [
    [LayoutDashboard, "Visão geral"], [Inbox, "Conversas", "12"],
    [TicketCheck, "Tickets", "5"], [UsersRound, "Clientes"],
    [Activity, "Relatórios"], [Settings, "Configurações"]
  ];
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand"><span className="brand-mark"><Zap size={20} fill="currentColor" /></span><span>Nexa</span><button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X /></button></div>
    <div className="workspace"><span className="workspace-avatar">AC</span><div><b>Acme Store</b><small>Plano profissional</small></div><ChevronDown size={16} /></div>
    <nav>
      <p className="nav-title">ATENDIMENTO</p>
      {nav.slice(0, 4).map(([Icon, label, count]) => <button key={label} className={(label === "Conversas" && activeView === "conversations") || (label === "Tickets" && activeView === "tickets") ? "active" : ""} onClick={() => { if (label === "Conversas") onViewChange("conversations"); if (label === "Tickets") onViewChange("tickets"); onClose(); }}><Icon size={19} /><span>{label}</span>{count && <em>{count}</em>}</button>)}
      <p className="nav-title">GESTÃO</p>
      {nav.slice(4).map(([Icon, label]) => <button key={label}><Icon size={19} /><span>{label}</span></button>)}
    </nav>
    <div className="ai-card"><div><Sparkles size={18} /><b>Agente de IA</b></div><span className="online"><i />Ativo agora</span><p>87% das conversas resolvidas automaticamente.</p></div>
    <div className="profile"><span className="profile-avatar">AS</span><div><b>Ana Silva</b><small>Administradora</small></div><MoreHorizontal size={19} /></div>
  </aside>;
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function ConversationList({ conversations, selectedId, onSelect, filter, setFilter, search, setSearch, onNew }) {
  const channels = ["todos", "whatsapp", "email", "telegram"];
  return <section className="conversation-list">
    <div className="list-heading"><div><h2>Conversas</h2><span>{conversations.length} em andamento</span></div><button aria-label="Nova conversa" onClick={onNew}><Plus size={20} /></button></div>
    <label className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..." /></label>
    <div className="channel-tabs">
      {channels.map(ch => <button key={ch} className={filter === ch ? "active" : ""} onClick={() => setFilter(ch)}>{ch === "todos" ? "Todos" : channelMeta[ch].label}</button>)}
    </div>
    <div className="conversation-scroll">
      {conversations.map(item => {
        const [label, color] = statusLabel[item.status];
        return <button className={`conversation-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => onSelect(item.id)} key={item.id}>
          <span className="avatar">{item.initials}<i className={`channel-dot ${item.channel}`} /></span>
          <span className="conversation-copy"><span className="name-line"><b>{item.name}</b><small>{item.time}</small></span><span className="preview-line"><span>{item.preview}</span>{item.unread > 0 && <em>{item.unread}</em>}</span><span className={`status-pill ${color}`}><i />{label}</span></span>
        </button>;
      })}
      {conversations.length === 0 && <div className="empty"><Search size={26} /><b>Nenhuma conversa encontrada</b><span>Tente buscar outro nome ou canal.</span></div>}
    </div>
  </section>;
}

function Chat({ conversation, onSend, onTransfer, onTicket, transferred, onBack }) {
  const [text, setText] = useState("");
  if (!conversation) return <section className="chat empty-chat"><Inbox size={36} /><h2>Escolha uma conversa</h2></section>;
  const submit = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); };
  return <section className="chat">
    <header className="chat-header"><button className="chat-back" onClick={onBack} aria-label="Voltar para conversas">‹</button><div className="chat-person"><span className="avatar large">{conversation.initials}</span><div><h2>{conversation.name}</h2><span><ChannelBadge channel={conversation.channel} /> · {conversation.mood}</span></div></div><div className="header-actions"><button onClick={onTicket}><TicketCheck size={18} /><span>Criar ticket</span></button><button className="primary" onClick={onTransfer} disabled={transferred}><UserRound size={18} /><span>{transferred ? "Transferido" : "Transferir"}</span></button><button aria-label="Mais opções"><MoreHorizontal size={20} /></button></div></header>
    <div className="messages">
      <div className="day-divider"><span>Hoje</span></div>
      {conversation.messages.map((msg, index) => <div className={`message-row ${msg.from}`} key={`${msg.time}-${index}`}>
        {msg.from === "ai" && <span className="bot-avatar"><Bot size={17} /></span>}
        <div><div className="message-label">{msg.from === "customer" ? conversation.name : msg.from === "human" ? "Você" : "Nexa IA"}</div><div className="bubble">{msg.text}</div><small>{msg.time}{msg.from !== "customer" && <Check size={13} />}</small></div>
      </div>)}
      {transferred && <div className="system-note"><Headphones size={16} />Conversa transferida para a fila humana</div>}
    </div>
    <div className="composer"><div className="ai-suggestion"><Sparkles size={16} /><span>Sugestão da IA:</span><button onClick={() => setText("Posso atualizar o endereço se o pedido ainda não estiver em rota. Vou verificar para você.")}>Usar resposta sugerida</button></div><div className="composer-box"><textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Digite sua mensagem..." /><div><span>Enter para enviar · Shift + Enter para nova linha</span><button onClick={submit} aria-label="Enviar mensagem"><Send size={18} /></button></div></div></div>
  </section>;
}

function CustomerPanel({ conversation }) {
  if (!conversation) return null;
  return <aside className="customer-panel"><div className="customer-top"><span className="avatar customer-avatar">{conversation.initials}</span><h3>{conversation.name}</h3><ChannelBadge channel={conversation.channel} /><button aria-label="Fechar detalhes"><X size={18} /></button></div>
    <div className="panel-section"><h4>Informações</h4><p><Mail size={16} /><span><small>E-mail</small>{conversation.email}</span></p><p><MessageCircle size={16} /><span><small>Telefone</small>{conversation.phone}</span></p></div>
    <div className="panel-section"><h4>Resumo da IA</h4><div className="summary-box"><Sparkles size={16} /><p>Cliente entrou em contato sobre <b>{conversation.preview.toLowerCase()}</b>. Sentimento atual: {conversation.mood.toLowerCase()}.</p></div></div>
    <div className="panel-section"><h4>Dados do cliente</h4><div className="data-row"><span>Pedidos</span><b>{conversation.orders}</b></div><div className="data-row"><span>Tickets abertos</span><b>{conversation.status === "urgente" ? 2 : 0}</b></div><div className="data-row"><span>Cliente desde</span><b>Fev. 2024</b></div></div>
    <div className="panel-section"><h4>Etiquetas</h4><div className="tags"><span><Tag size={13} />Cliente ativo</span><button><Plus size={14} />Adicionar</button></div></div>
  </aside>;
}

function TicketModal({ conversation, onClose, onCreate }) {
  const [title, setTitle] = useState(conversation?.preview || "");
  const [priority, setPriority] = useState("Média");
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="modal-title"><span><TicketCheck size={20} /></span><div><h2>Novo ticket</h2><p>Registre o caso para acompanhar até a solução.</p></div><button onClick={onClose} aria-label="Fechar"><X /></button></div><label>Título<input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Prioridade<select value={priority} onChange={e => setPriority(e.target.value)}><option>Baixa</option><option>Média</option><option>Alta</option><option>Urgente</option></select></label><label>Responsável<select><option>Fila geral</option><option>Time financeiro</option><option>Time de entregas</option><option>Time de trocas</option></select></label><div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="primary" disabled={!title.trim()} onClick={() => onCreate({ title, priority })}>Criar ticket</button></div></div></div>;
}

function IncomingModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const analysis = message.trim() ? classifyIncoming(message) : null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="modal-title"><span><MessageCircle size={20} /></span><div><h2>Simular mensagem recebida</h2><p>Veja como a central classifica e encaminha um novo contato.</p></div><button onClick={onClose} aria-label="Fechar"><X /></button></div><label>Nome do cliente<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Lucas Mendes" /></label><label>Canal<select value={channel} onChange={e => setChannel(e.target.value)}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="telegram">Telegram</option></select></label><label>Mensagem<textarea className="modal-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ex.: Não reconheço uma cobrança no cartão." /></label>{analysis && <div className={`routing-result ${analysis.status === "urgente" ? "human" : "auto"}`}><Bot size={17} /><div><b>{analysis.status === "urgente" ? "Encaminhar para uma pessoa" : "A IA pode responder"}</b><span>Assunto identificado: {analysis.topic}</span></div></div>}<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="primary" disabled={!name.trim() || !message.trim()} onClick={() => onCreate({ name: name.trim(), channel, message: message.trim() })}>Receber mensagem</button></div></div></div>;
}

function TicketBoard({ tickets, onResolve, onBack }) {
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const visible = tickets.filter(ticket => (filter === "todos" || ticket.status === filter) && `${ticket.title} ${ticket.customer} ${ticket.id}`.toLowerCase().includes(query.toLowerCase()));
  const openCount = tickets.filter(ticket => ticket.status === "aberto").length;
  const urgentCount = tickets.filter(ticket => ticket.status === "aberto" && ticket.priority === "Urgente").length;
  return <section className="tickets-page"><div className="tickets-summary"><article><span className="ticket-summary-icon purple"><TicketCheck size={20} /></span><div><small>Tickets abertos</small><strong>{openCount}</strong></div></article><article><span className="ticket-summary-icon orange"><Zap size={20} /></span><div><small>Urgentes</small><strong>{urgentCount}</strong></div></article><article><span className="ticket-summary-icon green"><Check size={20} /></span><div><small>Resolvidos</small><strong>{tickets.length - openCount}</strong></div></article></div><div className="ticket-panel"><header><div><h2>Todos os tickets</h2><p>Acompanhe cada solicitação até a solução.</p></div><button className="secondary-action" onClick={onBack}><MessageCircle size={17} />Ver conversas</button></header><div className="ticket-toolbar"><div className="ticket-tabs"><button className={filter === "todos" ? "active" : ""} onClick={() => setFilter("todos")}>Todos</button><button className={filter === "aberto" ? "active" : ""} onClick={() => setFilter("aberto")}>Abertos</button><button className={filter === "resolvido" ? "active" : ""} onClick={() => setFilter("resolvido")}>Resolvidos</button></div><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar ticket..." /></label></div><div className="ticket-table"><div className="ticket-table-head"><span>Ticket</span><span>Cliente</span><span>Prioridade</span><span>Responsável</span><span>Status</span><span>Ação</span></div>{visible.map(ticket => <article className="ticket-row" key={ticket.id}><div><b>#{ticket.id} · {ticket.title}</b><small>{ticket.created}</small></div><span>{ticket.customer}</span><span><em className={`priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</em></span><span>{ticket.assignee}</span><span><em className={`ticket-status ${ticket.status}`}>{ticket.status === "aberto" ? "Aberto" : "Resolvido"}</em></span><span>{ticket.status === "aberto" ? <button className="resolve-button" onClick={() => onResolve(ticket.id)}><Check size={15} />Resolver</button> : <button className="resolved-button" disabled><Check size={15} />Concluído</button>}</span></article>)}</div></div></section>;
}

function App() {
  const [activeView, setActiveView] = useState("conversations");
  const [conversations, setConversations] = useState(seedConversations);
  const [tickets, setTickets] = useState(seedTickets);
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [incomingOpen, setIncomingOpen] = useState(false);
  const [transferred, setTransferred] = useState([]);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);

  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      fetch("http://127.0.0.1:5000/api/conversations").then(r => r.ok ? r.json() : Promise.reject()).then(data => data.length && setConversations(data)).catch(() => {});
    }
  }, []);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2800); return () => clearTimeout(timer); }, [toast]);

  const visible = useMemo(() => conversations.filter(c => (filter === "todos" || c.channel === filter) && `${c.name} ${c.preview}`.toLowerCase().includes(search.toLowerCase())), [conversations, filter, search]);
  const selected = conversations.find(c => c.id === selectedId);
  const time = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sendMessage = text => setConversations(items => items.map(c => c.id === selectedId ? { ...c, preview: text, time: "Agora", messages: [...c.messages, { from: "human", text, time: time() }] } : c));
  const transfer = () => { setTransferred(ids => [...ids, selectedId]); setConversations(items => items.map(c => c.id === selectedId ? { ...c, status: "humano" } : c)); setToast("Conversa enviada para a fila humana."); };
  const createTicket = ticket => {
    const newTicket = { id: Math.max(...tickets.map(item => item.id), 1000) + 1, title: ticket.title, customer: selected?.name || "Cliente", priority: ticket.priority, assignee: "Fila geral", status: "aberto", created: "Agora" };
    setTickets(items => [newTicket, ...items]);
    setTicketOpen(false);
    setToast(`Ticket #${newTicket.id} criado com prioridade ${ticket.priority.toLowerCase()}.`);
  };
  const resolveTicket = id => { setTickets(items => items.map(ticket => ticket.id === id ? { ...ticket, status: "resolvido" } : ticket)); setToast(`Ticket #${id} marcado como resolvido.`); };
  const receiveIncoming = async draft => {
    const fallback = () => {
      const result = classifyIncoming(draft.message);
      const id = Math.max(...conversations.map(item => item.id), 0) + 1;
      return { id, name: draft.name, initials: draft.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase(), channel: draft.channel, time: "Agora", preview: draft.message, unread: 1, status: result.status, mood: result.mood, email: "novo.cliente@email.com", phone: "+55 11 90000-0000", orders: 0, messages: [{ from: "customer", text: draft.message, time: time() }, { from: "ai", text: result.reply, time: time() }] };
    };
    let incoming;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/incoming", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!response.ok) throw new Error("API unavailable");
        incoming = await response.json();
      } catch { incoming = fallback(); }
    } else { incoming = fallback(); }
    setConversations(items => [incoming, ...items]);
    setSelectedId(incoming.id);
    setIncomingOpen(false);
    setMobileChat(true);
    setToast(incoming.status === "urgente" ? "Caso delicado enviado para a fila humana." : "A IA classificou e respondeu à nova mensagem.");
  };

  return <div className="app-shell">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeView={activeView} onViewChange={setActiveView} />
    {menuOpen && <button className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button><div><h1>{activeView === "tickets" ? "Gestão de tickets" : "Central de atendimento"}</h1><p>{activeView === "tickets" ? "Organize prioridades e acompanhe a solução dos chamados." : "Acompanhe e gerencie todos os canais em um só lugar."}</p></div><div className="top-actions"><button className="availability"><i />Disponível<ChevronDown size={15} /></button><button className="icon-button" aria-label="Notificações"><Bell size={20} /><i /></button><span className="top-avatar">AS</span></div></header>
      {activeView === "conversations" ? <><section className="stats-grid"><StatCard icon={MessageCircle} label="Atendimentos hoje" value="148" detail="↑ 12% vs. ontem" tone="purple" /><StatCard icon={Bot} label="Resolvidos pela IA" value="87%" detail="129 conversas" tone="teal" /><StatCard icon={UsersRound} label="Na fila humana" value="12" detail="3 aguardando há +5 min" tone="orange" /><StatCard icon={Clock3} label="Tempo médio" value="2m 14s" detail="↓ 18s esta semana" tone="blue" /></section><section className={`inbox-layout ${mobileChat ? "mobile-chat" : ""}`}><ConversationList conversations={visible} selectedId={selectedId} onSelect={id => { setSelectedId(id); setMobileChat(true); }} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onNew={() => setIncomingOpen(true)} /><Chat conversation={selected} onSend={sendMessage} onTransfer={transfer} onTicket={() => setTicketOpen(true)} transferred={transferred.includes(selectedId)} onBack={() => setMobileChat(false)} /><CustomerPanel conversation={selected} /></section></> : <TicketBoard tickets={tickets} onResolve={resolveTicket} onBack={() => setActiveView("conversations")} />}
    </main>
    {ticketOpen && <TicketModal conversation={selected} onClose={() => setTicketOpen(false)} onCreate={createTicket} />}
    {incomingOpen && <IncomingModal onClose={() => setIncomingOpen(false)} onCreate={receiveIncoming} />}
    {toast && <div className="toast"><Check size={18} />{toast}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
