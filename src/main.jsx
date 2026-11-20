import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, Bell, BookOpen, Bot, Check, ChevronDown, CircleUserRound, Clock3, FileText,
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

const seedArticles = [
  { id: 1, title: "Como acompanhar um pedido", category: "Entregas", excerpt: "Orienta o cliente a consultar o código de rastreio e o prazo previsto.", updated: "Hoje, 09:18", active: true, uses: 84 },
  { id: 2, title: "Troca de produto com defeito", category: "Trocas", excerpt: "Explica os prazos, documentos e etapas para solicitar uma troca.", updated: "Ontem, 16:42", active: true, uses: 57 },
  { id: 3, title: "Cobrança não reconhecida", category: "Financeiro", excerpt: "Informa os cuidados de segurança e transfere o caso para o time financeiro.", updated: "18 nov., 11:05", active: true, uses: 39 },
  { id: 4, title: "Alteração de plano", category: "Conta", excerpt: "Mostra onde trocar o plano e quando a mudança entra em vigor.", updated: "17 nov., 14:30", active: true, uses: 63 },
  { id: 5, title: "Atendimento fora do horário", category: "Atendimento", excerpt: "Coleta os dados do cliente e informa o próximo horário da equipe.", updated: "15 nov., 08:20", active: false, uses: 21 }
];

const seedAgents = [
  { id: 1, name: "Ana Silva", initials: "AS", email: "ana@acmestore.com", role: "Administradora", team: "Geral", status: "online", active: 4, resolved: 38, satisfaction: "4,9" },
  { id: 2, name: "Marcos Santos", initials: "MS", email: "marcos@acmestore.com", role: "Atendente", team: "Financeiro", status: "ocupado", active: 6, resolved: 31, satisfaction: "4,8" },
  { id: 3, name: "Júlia Mendes", initials: "JM", email: "julia@acmestore.com", role: "Atendente", team: "Entregas", status: "online", active: 3, resolved: 42, satisfaction: "4,9" },
  { id: 4, name: "Pedro Rocha", initials: "PR", email: "pedro@acmestore.com", role: "Supervisor", team: "Trocas", status: "offline", active: 0, resolved: 27, satisfaction: "4,7" }
];

const seedAutomationRules = [
  { id: 1, name: "Cobrança ou possível fraude", trigger: "Mensagem contém cobrança, fraude ou estorno", action: "Transferir para Financeiro", channel: "Todos os canais", active: true, runs: 18, last: "Há 7 min" },
  { id: 2, name: "Pedido sem atualização", trigger: "Cliente pede rastreio e o pedido está atrasado", action: "Criar ticket de alta prioridade", channel: "WhatsApp", active: true, runs: 12, last: "Há 19 min" },
  { id: 3, name: "Atendimento fora do horário", trigger: "Mensagem recebida após as 18h", action: "Responder com prazo da equipe", channel: "Todos os canais", active: true, runs: 27, last: "Ontem, 22:14" },
  { id: 4, name: "Baixa confiança da IA", trigger: "Confiança da resposta menor que 75%", action: "Transferir para fila humana", channel: "Todos os canais", active: false, runs: 9, last: "18 nov., 15:42" }
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
    [BookOpen, "Base de conhecimento"], [Zap, "Automações"], [UserRound, "Equipe"], [Activity, "Relatórios"], [Settings, "Configurações"]
  ];
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand"><span className="brand-mark"><Zap size={20} fill="currentColor" /></span><span>Nexa</span><button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X /></button></div>
    <div className="workspace"><span className="workspace-avatar">AC</span><div><b>Acme Store</b><small>Plano profissional</small></div><ChevronDown size={16} /></div>
    <nav>
      <p className="nav-title">ATENDIMENTO</p>
      {nav.slice(0, 4).map(([Icon, label, count]) => <button key={label} className={(label === "Visão geral" && activeView === "dashboard") || (label === "Conversas" && activeView === "conversations") || (label === "Tickets" && activeView === "tickets") || (label === "Clientes" && activeView === "customers") ? "active" : ""} onClick={() => { if (label === "Visão geral") onViewChange("dashboard"); if (label === "Conversas") onViewChange("conversations"); if (label === "Tickets") onViewChange("tickets"); if (label === "Clientes") onViewChange("customers"); onClose(); }}><Icon size={19} /><span>{label}</span>{count && <em>{count}</em>}</button>)}
      <p className="nav-title">GESTÃO</p>
      {nav.slice(4).map(([Icon, label]) => <button key={label} className={(label === "Base de conhecimento" && activeView === "knowledge") || (label === "Automações" && activeView === "automations") || (label === "Equipe" && activeView === "team") || (label === "Relatórios" && activeView === "reports") || (label === "Configurações" && activeView === "settings") ? "active" : ""} onClick={() => { if (label === "Base de conhecimento") onViewChange("knowledge"); if (label === "Automações") onViewChange("automations"); if (label === "Equipe") onViewChange("team"); if (label === "Relatórios") onViewChange("reports"); if (label === "Configurações") onViewChange("settings"); onClose(); }}><Icon size={19} /><span>{label}</span></button>)}
    </nav>
    <div className="ai-card"><div><Sparkles size={18} /><b>Agente de IA</b></div><span className="online"><i />Ativo agora</span><p>87% das conversas resolvidas automaticamente.</p></div>
    <div className="profile"><span className="profile-avatar">AS</span><div><b>Ana Silva</b><small>Administradora</small></div><MoreHorizontal size={19} /></div>
  </aside>;
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function DashboardPage({ conversations, tickets, onOpenConversation, onOpenTickets, onOpenConversations }) {
  const [period, setPeriod] = useState("Hoje");
  const multipliers = { Hoje: 1, "7 dias": 6.4, "30 dias": 26.2 };
  const multiplier = multipliers[period];
  const volume = [42, 58, 51, 74, 63, 88, 69, 92, 78, 84, 65, 53];
  const openTickets = tickets.filter(ticket => ticket.status === "aberto");
  const queue = conversations.filter(item => item.status === "urgente" || item.status === "humano");
  const channelCounts = ["whatsapp", "email", "telegram"].map(channel => ({ channel, total: conversations.filter(item => item.channel === channel).length }));
  return <section className="dashboard-page"><div className="dashboard-welcome"><div><span><Sparkles size={20} /></span><div><h2>Olá, Ana! Sua operação está saudável.</h2><p>A IA resolveu 87% dos atendimentos e existem {queue.length} casos aguardando atenção humana.</p></div></div><label>Período<select value={period} onChange={event => setPeriod(event.target.value)}><option>Hoje</option><option>7 dias</option><option>30 dias</option></select></label></div><div className="dashboard-stats"><StatCard icon={MessageCircle} label="Atendimentos" value={Math.round(148 * multiplier).toLocaleString("pt-BR")} detail="↑ 12% no período" tone="purple" /><StatCard icon={Bot} label="Resolvidos pela IA" value="87%" detail={`${Math.round(129 * multiplier).toLocaleString("pt-BR")} conversas`} tone="teal" /><StatCard icon={UsersRound} label="Fila humana" value={queue.length} detail="Casos que precisam de atenção" tone="orange" /><StatCard icon={Clock3} label="Tempo médio" value="2m 14s" detail="↓ 18s no período" tone="blue" /></div><div className="dashboard-grid"><article className="dashboard-card dashboard-volume"><header><div><h3>Movimento dos atendimentos</h3><p>Conversas recebidas ao longo do dia.</p></div><span>+12%</span></header><div className="dashboard-bars">{volume.map((value, index) => <i key={index} style={{ height: `${value}%` }} title={`${value} atendimentos`} />)}</div><div className="dashboard-hours"><span>08h</span><span>10h</span><span>12h</span><span>14h</span><span>16h</span><span>18h</span></div></article><article className="dashboard-card queue-card"><header><div><h3>Fila humana</h3><p>Casos que precisam de uma pessoa.</p></div><button onClick={onOpenConversations}>Ver fila</button></header><div className="queue-list">{queue.map(item => <button key={item.id} onClick={() => onOpenConversation(item.id)}><span className="avatar">{item.initials}</span><span><b>{item.name}</b><small>{item.preview}</small></span><em className={item.status}>{item.status === "urgente" ? "Urgente" : "Em atendimento"}</em></button>)}{queue.length === 0 && <p className="queue-empty">Nenhum caso aguardando.</p>}</div></article><article className="dashboard-card channels-health"><header><div><h3>Canais ativos</h3><p>Distribuição das conversas atuais.</p></div></header><div>{channelCounts.map(item => { const meta = channelMeta[item.channel]; const Icon = meta.icon; return <section key={item.channel}><span className={`setting-channel ${meta.className}`}><Icon size={18} /></span><div><b>{meta.label}</b><small>Operando normalmente</small></div><strong>{item.total}</strong></section>; })}</div></article><article className="dashboard-card recent-card"><header><div><h3>Atividades recentes</h3><p>Últimas movimentações da central.</p></div><button onClick={onOpenTickets}>Ver tickets</button></header><div className="activity-list"><p><span className="activity-icon green"><Check size={15} /></span><span><b>Atendimento resolvido pela IA</b><small>Beatriz Souza · há 4 min</small></span></p><p><span className="activity-icon red"><Zap size={15} /></span><span><b>Ticket urgente criado</b><small>Rafael Lima · há 8 min</small></span></p><p><span className="activity-icon blue"><Headphones size={15} /></span><span><b>Conversa transferida</b><small>João Pedro · há 18 min</small></span></p><p><span className="activity-icon purple"><Bot size={15} /></span><span><b>Plano explicado automaticamente</b><small>Camila Oliveira · há 24 min</small></span></p></div></article></div><div className="dashboard-footer-note"><Activity size={17} /><span>Todos os sistemas estão funcionando normalmente.</span><i />Atualizado agora</div></section>;
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

function ReportsPage() {
  const [period, setPeriod] = useState("7 dias");
  const volume = [{ label: "Seg", value: 62 }, { label: "Ter", value: 78 }, { label: "Qua", value: 54 }, { label: "Qui", value: 86 }, { label: "Sex", value: 96 }, { label: "Sáb", value: 48 }, { label: "Dom", value: 38 }];
  const channels = [{ name: "WhatsApp", value: 58, color: "#7658df" }, { name: "E-mail", value: 27, color: "#ec7d67" }, { name: "Telegram", value: 15, color: "#3d9ddd" }];
  return <section className="reports-page"><div className="reports-controls"><div><h2>Desempenho do atendimento</h2><p>Dados de demonstração atualizados para o período selecionado.</p></div><label>Período<select value={period} onChange={event => setPeriod(event.target.value)}><option>7 dias</option><option>30 dias</option><option>90 dias</option></select></label></div><div className="report-stats"><StatCard icon={MessageCircle} label="Total de conversas" value={period === "7 dias" ? "462" : period === "30 dias" ? "1.842" : "5.319"} detail="↑ 14% no período" tone="purple" /><StatCard icon={Bot} label="Taxa de automação" value="87%" detail="403 resolvidas pela IA" tone="teal" /><StatCard icon={Clock3} label="Primeira resposta" value="42s" detail="↓ 11s no período" tone="blue" /><StatCard icon={Activity} label="Satisfação" value="4,8" detail="de 5 estrelas" tone="orange" /></div><div className="reports-grid"><article className="report-card volume-card"><header><div><h3>Conversas por dia</h3><p>Volume recebido nos últimos {period}.</p></div><span className="trend-positive">+14%</span></header><div className="bar-chart">{volume.map(day => <div className="bar-column" key={day.label}><span className="bar-value">{day.value}</span><div className="bar-track"><i style={{ height: `${day.value}%` }} /></div><small>{day.label}</small></div>)}</div></article><article className="report-card channel-card"><header><div><h3>Canais de entrada</h3><p>Participação por canal.</p></div></header><div className="channel-content"><div className="donut-chart"><span>462<small>conversas</small></span></div><div className="channel-legend">{channels.map(channel => <div key={channel.name}><i style={{ background: channel.color }} /><span>{channel.name}</span><b>{channel.value}%</b></div>)}</div></div></article><article className="report-card"><header><div><h3>Desempenho da IA</h3><p>Resultados da automação.</p></div></header><div className="progress-list"><div><span>Resolvidas sem humano <b>87%</b></span><i><em style={{ width: "87%" }} /></i></div><div><span>Respostas aceitas <b>82%</b></span><i><em style={{ width: "82%" }} /></i></div><div><span>Classificação correta <b>94%</b></span><i><em style={{ width: "94%" }} /></i></div></div></article><article className="report-card satisfaction-card"><header><div><h3>Satisfação dos clientes</h3><p>Avaliações após o atendimento.</p></div></header><div className="satisfaction-score"><strong>4,8</strong><div><span>★★★★★</span><small>312 avaliações</small></div></div><div className="rating-row"><span>5 estrelas</span><i><em style={{ width: "84%" }} /></i><b>84%</b></div><div className="rating-row"><span>4 estrelas</span><i><em style={{ width: "11%" }} /></i><b>11%</b></div><div className="rating-row"><span>1–3 estrelas</span><i><em style={{ width: "5%" }} /></i><b>5%</b></div></article></div></section>;
}

function CustomersPage({ customers, onOpenConversation }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("todos");
  const profiles = customers.map((customer, index) => ({
    ...customer,
    segment: customer.orders >= 4 ? "Fiel" : customer.orders >= 2 ? "Recorrente" : "Novo",
    satisfaction: customer.mood === "Positivo" ? "5,0" : customer.mood === "Insatisfeito" ? "2,8" : customer.mood === "Preocupado" ? "3,6" : "4,4",
    since: ["Fev. 2024", "Mai. 2024", "Ago. 2023", "Jan. 2025", "Nov. 2023"][index % 5]
  }));
  const visible = profiles.filter(customer => (segment === "todos" || customer.segment === segment) && `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()));
  const loyalCount = profiles.filter(customer => customer.segment === "Fiel").length;
  const averageOrders = profiles.length ? (profiles.reduce((total, customer) => total + customer.orders, 0) / profiles.length).toFixed(1).replace(".", ",") : "0";
  return <section className="customers-page"><div className="customer-summary"><StatCard icon={UsersRound} label="Clientes cadastrados" value={profiles.length} detail="Base ativa da central" tone="purple" /><StatCard icon={Activity} label="Clientes fiéis" value={loyalCount} detail="4 ou mais pedidos" tone="teal" /><StatCard icon={TicketCheck} label="Média de pedidos" value={averageOrders} detail="por cliente" tone="orange" /></div><div className="customers-panel"><header><div><h2>Base de clientes</h2><p>Consulte contatos e abra o histórico de atendimento.</p></div></header><div className="customers-toolbar"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar nome, e-mail ou telefone..." /></label><select value={segment} onChange={event => setSegment(event.target.value)} aria-label="Filtrar por segmento"><option value="todos">Todos os segmentos</option><option>Fiel</option><option>Recorrente</option><option>Novo</option></select></div><div className="customers-table"><div className="customers-table-head"><span>Cliente</span><span>Canal preferido</span><span>Segmento</span><span>Pedidos</span><span>Satisfação</span><span>Histórico</span></div>{visible.map(customer => <article className="customer-row" key={customer.id}><div className="customer-identity"><span className="avatar">{customer.initials}</span><div><b>{customer.name}</b><small>{customer.email}</small><small>{customer.phone}</small></div></div><span><ChannelBadge channel={customer.channel} /></span><span><em className={`customer-segment ${customer.segment.toLowerCase()}`}>{customer.segment}</em><small className="customer-since">Desde {customer.since}</small></span><strong>{customer.orders}</strong><span className="customer-rating"><b>★ {customer.satisfaction}</b><small>{customer.mood}</small></span><button className="history-button" onClick={() => onOpenConversation(customer.id)}><MessageCircle size={15} />Abrir conversa</button></article>)}{visible.length === 0 && <div className="customers-empty"><Search size={26} /><b>Nenhum cliente encontrado</b><span>Tente outro nome ou segmento.</span></div>}</div></div></section>;
}

function AutomationsPage({ rules, onAdd, onToggle }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todas");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", trigger: "Mensagem contém uma palavra", action: "Transferir para fila humana", channel: "Todos os canais" });
  const visible = rules.filter(rule => (status === "todas" || (status === "ativas" ? rule.active : !rule.active)) && `${rule.name} ${rule.trigger} ${rule.action}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = rules.filter(rule => rule.active).length;
  const totalRuns = rules.reduce((total, rule) => total + rule.runs, 0);
  const submit = () => { if (!draft.name.trim()) return; onAdd({ ...draft, name: draft.name.trim() }); setDraft({ name: "", trigger: "Mensagem contém uma palavra", action: "Transferir para fila humana", channel: "Todos os canais" }); setCreating(false); };
  const actionIcon = action => action.includes("ticket") ? TicketCheck : action.includes("Responder") ? Bot : Headphones;
  return <section className="automation-page"><div className="automation-hero"><div><span><Zap size={23} /></span><div><h2>Regras que trabalham junto com a equipe</h2><p>Defina quando responder, criar ticket ou transferir uma conversa.</p></div></div><button onClick={() => setCreating(true)}><Plus size={18} />Nova regra</button></div><div className="automation-stats"><StatCard icon={Zap} label="Regras ativas" value={activeCount} detail={`de ${rules.length} regras cadastradas`} tone="purple" /><StatCard icon={Activity} label="Execuções hoje" value={totalRuns} detail="Ações feitas automaticamente" tone="teal" /><StatCard icon={Headphones} label="Transferências" value="27" detail="Casos enviados para humanos" tone="orange" /></div><div className="automation-panel"><header><div><h3>Fluxos automáticos</h3><p>Acompanhe cada condição e a ação que será executada.</p></div></header><div className="automation-toolbar"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar regra..." /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filtrar regras"><option value="todas">Todas as regras</option><option value="ativas">Ativas</option><option value="inativas">Inativas</option></select></div><div className="rules-list">{visible.map(rule => { const ActionIcon = actionIcon(rule.action); return <article className="rule-card" key={rule.id}><div className="rule-heading"><span className="rule-icon"><Zap size={18} /></span><div><h4>{rule.name}</h4><p>{rule.channel}</p></div><button className={`switch ${rule.active ? "on" : ""}`} role="switch" aria-checked={rule.active} aria-label={`${rule.active ? "Desativar" : "Ativar"} ${rule.name}`} onClick={() => onToggle(rule.id)}><i /></button></div><div className="rule-flow"><span><small>SE</small><b>{rule.trigger}</b></span><em>então</em><span><small>FAZER</small><b><ActionIcon size={15} />{rule.action}</b></span></div><footer><span><Activity size={14} />{rule.runs} execuções hoje</span><span>Última: {rule.last}</span></footer></article>; })}{visible.length === 0 && <div className="automation-empty"><Search size={26} /><b>Nenhuma regra encontrada</b><span>Tente outro nome ou situação.</span></div>}</div></div>{creating && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreating(false)}><div className="modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-title"><span><Zap size={20} /></span><div><h2>Nova regra</h2><p>Escolha quando e como a central deve agir.</p></div><button onClick={() => setCreating(false)} aria-label="Fechar"><X /></button></div><label>Nome da regra<input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="Ex.: Cliente pede cancelamento" /></label><label>Quando acontecer<select value={draft.trigger} onChange={event => setDraft(current => ({ ...current, trigger: event.target.value }))}><option>Mensagem contém uma palavra</option><option>Confiança da IA menor que 75%</option><option>Mensagem recebida fora do horário</option><option>Cliente demonstra insatisfação</option></select></label><label>A central deve<select value={draft.action} onChange={event => setDraft(current => ({ ...current, action: event.target.value }))}><option>Transferir para fila humana</option><option>Criar ticket de alta prioridade</option><option>Responder com prazo da equipe</option><option>Enviar para o Financeiro</option></select></label><label>Canal<select value={draft.channel} onChange={event => setDraft(current => ({ ...current, channel: event.target.value }))}><option>Todos os canais</option><option>WhatsApp</option><option>E-mail</option><option>Telegram</option></select></label><div className="modal-actions"><button onClick={() => setCreating(false)}>Cancelar</button><button className="primary" disabled={!draft.name.trim()} onClick={submit}>Criar regra</button></div></div></div>}</section>;
}

function TeamPage({ agents, onAdd, onStatusChange }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", team: "Geral", role: "Atendente" });
  const visible = agents.filter(agent => (status === "todos" || agent.status === status) && `${agent.name} ${agent.email} ${agent.team}`.toLowerCase().includes(query.toLowerCase()));
  const online = agents.filter(agent => agent.status === "online").length;
  const activeTotal = agents.reduce((total, agent) => total + agent.active, 0);
  const submit = () => { if (!draft.name.trim() || !draft.email.trim()) return; onAdd(draft); setDraft({ name: "", email: "", team: "Geral", role: "Atendente" }); setCreating(false); };
  return <section className="team-page"><div className="team-hero"><div><span><UsersRound size={23} /></span><div><h2>Equipe humana conectada à automação</h2><p>Acompanhe disponibilidade, carga de trabalho e desempenho.</p></div></div><button onClick={() => setCreating(true)}><Plus size={18} />Adicionar pessoa</button></div><div className="team-stats"><StatCard icon={UsersRound} label="Pessoas na equipe" value={agents.length} detail="Atendentes cadastrados" tone="purple" /><StatCard icon={Activity} label="Disponíveis agora" value={online} detail="Prontos para receber casos" tone="teal" /><StatCard icon={Headphones} label="Conversas em atendimento" value={activeTotal} detail="Distribuídas entre a equipe" tone="orange" /></div><div className="team-panel"><header><div><h3>Atendentes</h3><p>Consulte a situação de cada pessoa.</p></div></header><div className="team-toolbar"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar nome, e-mail ou time..." /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filtrar disponibilidade"><option value="todos">Todas as situações</option><option value="online">Disponíveis</option><option value="ocupado">Ocupados</option><option value="offline">Offline</option></select></div><div className="agents-grid">{visible.map(agent => <article className="agent-card" key={agent.id}><div className="agent-card-top"><span className="agent-avatar">{agent.initials}<i className={agent.status} /></span><div><h4>{agent.name}</h4><p>{agent.role} · {agent.team}</p></div><select value={agent.status} onChange={event => onStatusChange(agent.id, event.target.value)} aria-label={`Disponibilidade de ${agent.name}`}><option value="online">Disponível</option><option value="ocupado">Ocupado</option><option value="offline">Offline</option></select></div><p className="agent-email"><Mail size={15} />{agent.email}</p><div className="agent-workload"><span>Capacidade em uso <b>{agent.active}/8</b></span><i><em style={{ width: `${Math.min(agent.active / 8 * 100, 100)}%` }} /></i></div><div className="agent-results"><span><small>Resolvidos hoje</small><b>{agent.resolved}</b></span><span><small>Satisfação</small><b>★ {agent.satisfaction}</b></span></div></article>)}{visible.length === 0 && <div className="team-empty"><Search size={26} /><b>Ninguém encontrado</b><span>Tente outro nome ou situação.</span></div>}</div></div>{creating && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreating(false)}><div className="modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-title"><span><UserRound size={20} /></span><div><h2>Adicionar pessoa</h2><p>Cadastre um atendente na equipe.</p></div><button onClick={() => setCreating(false)} aria-label="Fechar"><X /></button></div><label>Nome<input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="Ex.: Lucas Mendes" /></label><label>E-mail<input type="email" value={draft.email} onChange={event => setDraft(current => ({ ...current, email: event.target.value }))} placeholder="lucas@empresa.com" /></label><label>Time<select value={draft.team} onChange={event => setDraft(current => ({ ...current, team: event.target.value }))}><option>Geral</option><option>Financeiro</option><option>Entregas</option><option>Trocas</option></select></label><label>Função<select value={draft.role} onChange={event => setDraft(current => ({ ...current, role: event.target.value }))}><option>Atendente</option><option>Supervisor</option><option>Administrador</option></select></label><div className="modal-actions"><button onClick={() => setCreating(false)}>Cancelar</button><button className="primary" disabled={!draft.name.trim() || !draft.email.trim()} onClick={submit}>Adicionar à equipe</button></div></div></div>}</section>;
}

function KnowledgePage({ articles, onAdd, onToggle }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "Entregas", content: "" });
  const categories = ["Todas", ...new Set(articles.map(article => article.category))];
  const visible = articles.filter(article => (category === "Todas" || article.category === category) && `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = articles.filter(article => article.active).length;
  const totalUses = articles.reduce((total, article) => total + article.uses, 0);
  const submit = () => { if (!draft.title.trim() || !draft.content.trim()) return; onAdd({ title: draft.title.trim(), category: draft.category, excerpt: draft.content.trim() }); setDraft({ title: "", category: "Entregas", content: "" }); setCreating(false); };
  return <section className="knowledge-page"><div className="knowledge-hero"><div><span><BookOpen size={23} /></span><div><h2>Ensine a IA com respostas confiáveis</h2><p>Cadastre informações que o agente pode usar durante os atendimentos.</p></div></div><button onClick={() => setCreating(true)}><Plus size={18} />Novo artigo</button></div><div className="knowledge-stats"><StatCard icon={FileText} label="Artigos cadastrados" value={articles.length} detail="Conteúdos da empresa" tone="purple" /><StatCard icon={Check} label="Artigos ativos" value={activeCount} detail="Disponíveis para a IA" tone="teal" /><StatCard icon={Bot} label="Respostas utilizadas" value={totalUses} detail="Neste mês" tone="blue" /></div><div className="knowledge-panel"><header><div><h3>Conteúdos da base</h3><p>Pesquise, filtre e escolha o que a IA pode consultar.</p></div></header><div className="knowledge-toolbar"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar artigo..." /></label><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filtrar categoria">{categories.map(item => <option key={item}>{item}</option>)}</select></div><div className="articles-grid">{visible.map(article => <article className="article-card" key={article.id}><div className="article-top"><span><FileText size={19} /></span><em>{article.category}</em><button className={`switch ${article.active ? "on" : ""}`} role="switch" aria-checked={article.active} aria-label={`${article.active ? "Desativar" : "Ativar"} ${article.title}`} onClick={() => onToggle(article.id)}><i /></button></div><h4>{article.title}</h4><p>{article.excerpt}</p><footer><span>Atualizado {article.updated}</span><b><Bot size={14} />{article.uses} usos</b></footer></article>)}{visible.length === 0 && <div className="knowledge-empty"><Search size={26} /><b>Nenhum artigo encontrado</b><span>Tente outro termo ou categoria.</span></div>}</div></div>{creating && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreating(false)}><div className="modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-title"><span><BookOpen size={20} /></span><div><h2>Novo artigo</h2><p>Adicione uma resposta para a IA consultar.</p></div><button onClick={() => setCreating(false)} aria-label="Fechar"><X /></button></div><label>Título<input value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Ex.: Como alterar o endereço" /></label><label>Categoria<select value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))}><option>Entregas</option><option>Trocas</option><option>Financeiro</option><option>Conta</option><option>Atendimento</option></select></label><label>Resposta<textarea className="modal-textarea" value={draft.content} onChange={event => setDraft(current => ({ ...current, content: event.target.value }))} placeholder="Escreva a informação que a IA poderá usar." /></label><div className="modal-actions"><button onClick={() => setCreating(false)}>Cancelar</button><button className="primary" disabled={!draft.title.trim() || !draft.content.trim()} onClick={submit}>Criar artigo</button></div></div></div>}</section>;
}

function SettingsPage({ onSaved }) {
  const defaults = { whatsapp: true, email: true, telegram: false, autoReply: true, humanTransfer: true, tone: "Acolhedor", confidence: 75, start: "08:00", end: "18:00", days: ["Seg", "Ter", "Qua", "Qui", "Sex"] };
  const [preferences, setPreferences] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("nexa-settings") || "{}") }; }
    catch { return defaults; }
  });
  const channels = [{ key: "whatsapp", label: "WhatsApp", description: "Mensagens e atualizações em tempo real" }, { key: "email", label: "E-mail", description: "Caixa de entrada do atendimento" }, { key: "telegram", label: "Telegram", description: "Bot conectado à central" }];
  const update = (key, value) => setPreferences(current => ({ ...current, [key]: value }));
  const save = async () => {
    localStorage.setItem("nexa-settings", JSON.stringify(preferences));
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try { await fetch("http://127.0.0.1:5000/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) }); }
      catch {}
    }
    onSaved();
  };
  return <section className="settings-page"><div className="settings-intro"><div><span className="settings-icon"><Settings size={22} /></span><div><h2>Preferências da central</h2><p>Escolha como os canais e o agente de IA devem trabalhar.</p></div></div><button className="save-settings" onClick={save}><Check size={17} />Salvar alterações</button></div><div className="settings-grid"><article className="settings-card channels-settings"><header><h3>Canais conectados</h3><p>Ative os canais que sua equipe utiliza.</p></header>{channels.map(channel => { const meta = channelMeta[channel.key]; const Icon = meta.icon; return <div className="setting-row" key={channel.key}><span className={`setting-channel ${meta.className}`}><Icon size={19} /></span><div><b>{channel.label}</b><small>{channel.description}</small></div><button className={`switch ${preferences[channel.key] ? "on" : ""}`} role="switch" aria-checked={preferences[channel.key]} aria-label={`${preferences[channel.key] ? "Desativar" : "Ativar"} ${channel.label}`} onClick={() => update(channel.key, !preferences[channel.key])}><i /></button></div>; })}</article><article className="settings-card ai-settings"><header><h3>Comportamento da IA</h3><p>Defina quando a automação pode agir.</p></header><div className="setting-row"><span className="setting-channel ai"><Bot size={19} /></span><div><b>Resposta automática</b><small>A IA responde dúvidas conhecidas.</small></div><button className={`switch ${preferences.autoReply ? "on" : ""}`} role="switch" aria-checked={preferences.autoReply} aria-label="Alternar resposta automática" onClick={() => update("autoReply", !preferences.autoReply)}><i /></button></div><div className="setting-row"><span className="setting-channel human"><Headphones size={19} /></span><div><b>Transferência inteligente</b><small>Casos delicados seguem para uma pessoa.</small></div><button className={`switch ${preferences.humanTransfer ? "on" : ""}`} role="switch" aria-checked={preferences.humanTransfer} aria-label="Alternar transferência inteligente" onClick={() => update("humanTransfer", !preferences.humanTransfer)}><i /></button></div><label className="settings-field"><span>Tom das respostas</span><select value={preferences.tone} onChange={event => update("tone", event.target.value)}><option>Acolhedor</option><option>Objetivo</option><option>Descontraído</option><option>Formal</option></select></label><label className="confidence-field"><span>Confiança mínima da IA <b>{preferences.confidence}%</b></span><input type="range" min="50" max="95" step="5" value={preferences.confidence} onChange={event => update("confidence", Number(event.target.value))} /><small>Abaixo deste valor, a conversa é encaminhada para a equipe.</small></label></article><article className="settings-card hours-settings"><header><h3>Horário de atendimento</h3><p>Informe quando a equipe humana está disponível.</p></header><div className="hours-grid"><label className="settings-field"><span>Início</span><input type="time" value={preferences.start} onChange={event => update("start", event.target.value)} /></label><label className="settings-field"><span>Fim</span><input type="time" value={preferences.end} onChange={event => update("end", event.target.value)} /></label></div><div className="business-days"><span>Dias ativos</span><div>{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <button className={preferences.days.includes(day) ? "active" : ""} key={day} onClick={() => update("days", preferences.days.includes(day) ? preferences.days.filter(item => item !== day) : [...preferences.days, day])}>{day}</button>)}</div></div><div className="after-hours"><Clock3 size={18} /><div><b>Fora do horário</b><p>A IA coleta os dados e informa quando uma pessoa responderá.</p></div></div></article></div></section>;
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [conversations, setConversations] = useState(seedConversations);
  const [tickets, setTickets] = useState(seedTickets);
  const [articles, setArticles] = useState(seedArticles);
  const [agents, setAgents] = useState(seedAgents);
  const [automationRules, setAutomationRules] = useState(seedAutomationRules);
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
  const addArticle = article => { setArticles(items => [...items, { ...article, id: Math.max(...items.map(item => item.id), 0) + 1, updated: "Agora", active: true, uses: 0 }]); setToast("Artigo criado e disponibilizado para a IA."); };
  const toggleArticle = id => { setArticles(items => items.map(article => article.id === id ? { ...article, active: !article.active } : article)); setToast("Disponibilidade do artigo atualizada."); };
  const addAgent = agent => { const initials = agent.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase(); setAgents(items => [...items, { ...agent, id: Math.max(...items.map(item => item.id), 0) + 1, initials, status: "offline", active: 0, resolved: 0, satisfaction: "—" }]); setToast(`${agent.name} foi adicionado à equipe.`); };
  const changeAgentStatus = (id, status) => { setAgents(items => items.map(agent => agent.id === id ? { ...agent, status } : agent)); setToast("Disponibilidade atualizada."); };
  const addAutomationRule = rule => { setAutomationRules(items => [{ ...rule, id: Math.max(...items.map(item => item.id), 0) + 1, active: true, runs: 0, last: "Ainda não executada" }, ...items]); setToast("Nova regra de automação criada."); };
  const toggleAutomationRule = id => { setAutomationRules(items => items.map(rule => rule.id === id ? { ...rule, active: !rule.active } : rule)); setToast("Situação da automação atualizada."); };
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
  const viewTitle = activeView === "dashboard" ? "Visão geral" : activeView === "tickets" ? "Gestão de tickets" : activeView === "customers" ? "Clientes" : activeView === "knowledge" ? "Base de conhecimento" : activeView === "automations" ? "Automações" : activeView === "team" ? "Equipe" : activeView === "reports" ? "Relatórios" : activeView === "settings" ? "Configurações" : "Central de atendimento";
  const viewDescription = activeView === "dashboard" ? "Acompanhe tudo o que está acontecendo na sua operação." : activeView === "tickets" ? "Organize prioridades e acompanhe a solução dos chamados." : activeView === "customers" ? "Conheça o histórico e o perfil de cada cliente." : activeView === "knowledge" ? "Organize as informações usadas nas respostas da IA." : activeView === "automations" ? "Crie regras para a central agir no momento certo." : activeView === "team" ? "Acompanhe disponibilidade e desempenho dos atendentes." : activeView === "reports" ? "Acompanhe resultados e encontre oportunidades de melhoria." : activeView === "settings" ? "Controle canais, automações e horários da sua operação." : "Acompanhe e gerencie todos os canais em um só lugar.";
  const openCustomerConversation = id => { setSelectedId(id); setActiveView("conversations"); setMobileChat(true); };

  return <div className="app-shell">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeView={activeView} onViewChange={setActiveView} />
    {menuOpen && <button className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button><div><h1>{viewTitle}</h1><p>{viewDescription}</p></div><div className="top-actions"><button className="availability"><i />Disponível<ChevronDown size={15} /></button><button className="icon-button" aria-label="Notificações"><Bell size={20} /><i /></button><span className="top-avatar">AS</span></div></header>
      {activeView === "dashboard" ? <DashboardPage conversations={conversations} tickets={tickets} onOpenConversation={openCustomerConversation} onOpenTickets={() => setActiveView("tickets")} onOpenConversations={() => setActiveView("conversations")} /> : activeView === "conversations" ? <><section className="stats-grid"><StatCard icon={MessageCircle} label="Atendimentos hoje" value="148" detail="↑ 12% vs. ontem" tone="purple" /><StatCard icon={Bot} label="Resolvidos pela IA" value="87%" detail="129 conversas" tone="teal" /><StatCard icon={UsersRound} label="Na fila humana" value="12" detail="3 aguardando há +5 min" tone="orange" /><StatCard icon={Clock3} label="Tempo médio" value="2m 14s" detail="↓ 18s esta semana" tone="blue" /></section><section className={`inbox-layout ${mobileChat ? "mobile-chat" : ""}`}><ConversationList conversations={visible} selectedId={selectedId} onSelect={id => { setSelectedId(id); setMobileChat(true); }} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onNew={() => setIncomingOpen(true)} /><Chat conversation={selected} onSend={sendMessage} onTransfer={transfer} onTicket={() => setTicketOpen(true)} transferred={transferred.includes(selectedId)} onBack={() => setMobileChat(false)} /><CustomerPanel conversation={selected} /></section></> : activeView === "tickets" ? <TicketBoard tickets={tickets} onResolve={resolveTicket} onBack={() => setActiveView("conversations")} /> : activeView === "customers" ? <CustomersPage customers={conversations} onOpenConversation={openCustomerConversation} /> : activeView === "knowledge" ? <KnowledgePage articles={articles} onAdd={addArticle} onToggle={toggleArticle} /> : activeView === "automations" ? <AutomationsPage rules={automationRules} onAdd={addAutomationRule} onToggle={toggleAutomationRule} /> : activeView === "team" ? <TeamPage agents={agents} onAdd={addAgent} onStatusChange={changeAgentStatus} /> : activeView === "settings" ? <SettingsPage onSaved={() => setToast("Configurações salvas com sucesso.")} /> : <ReportsPage />}
    </main>
    {ticketOpen && <TicketModal conversation={selected} onClose={() => setTicketOpen(false)} onCreate={createTicket} />}
    {incomingOpen && <IncomingModal onClose={() => setIncomingOpen(false)} onCreate={receiveIncoming} />}
    {toast && <div className="toast"><Check size={18} />{toast}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
