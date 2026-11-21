"""API local da central de atendimento.

Ela guarda conversas e tickets em um banco SQLite.
O painel React usa esta API quando está rodando em localhost.
"""

from datetime import datetime
from contextlib import contextmanager
import json
import sqlite3

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
DATABASE = "atendimento.db"


def connect():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


@contextmanager
def database_connection():
    database = connect()
    try:
        yield database
        database.commit()
    finally:
        database.close()


def prepare_database():
    with database_connection() as database:
        database.executescript("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                channel TEXT NOT NULL,
                preview TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ia',
                messages TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                priority TEXT NOT NULL,
                assignee TEXT NOT NULL DEFAULT 'Fila geral',
                status TEXT NOT NULL DEFAULT 'aberto',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS knowledge_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                excerpt TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                uses INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                team TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'offline',
                active_conversations INTEGER NOT NULL DEFAULT 0,
                resolved_today INTEGER NOT NULL DEFAULT 0,
                satisfaction TEXT NOT NULL DEFAULT '—'
            );
            CREATE TABLE IF NOT EXISTS automation_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                trigger_text TEXT NOT NULL,
                action_text TEXT NOT NULL,
                channel TEXT NOT NULL DEFAULT 'Todos os canais',
                active INTEGER NOT NULL DEFAULT 1,
                runs INTEGER NOT NULL DEFAULT 0,
                last_run TEXT NOT NULL DEFAULT 'Ainda não executada'
            );
            CREATE TABLE IF NOT EXISTS channel_integrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                account TEXT NOT NULL,
                connected INTEGER NOT NULL DEFAULT 0,
                last_sync TEXT NOT NULL DEFAULT 'Nunca',
                messages_today INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                actor TEXT NOT NULL,
                event_type TEXT NOT NULL,
                level TEXT NOT NULL DEFAULT 'info',
                date_text TEXT NOT NULL,
                time_text TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS support_queues (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                team TEXT NOT NULL,
                waiting INTEGER NOT NULL DEFAULT 0,
                agents INTEGER NOT NULL DEFAULT 0,
                sla_minutes INTEGER NOT NULL DEFAULT 5,
                oldest_minutes INTEGER NOT NULL DEFAULT 0,
                within_percent INTEGER NOT NULL DEFAULT 100,
                handled_today INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'healthy'
            );
            CREATE TABLE IF NOT EXISTS customer_reviews (
                id INTEGER PRIMARY KEY,
                customer TEXT NOT NULL,
                initials TEXT NOT NULL,
                rating INTEGER NOT NULL,
                channel TEXT NOT NULL,
                topic TEXT NOT NULL,
                comment TEXT NOT NULL,
                date_text TEXT NOT NULL,
                replied INTEGER NOT NULL DEFAULT 0,
                response TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS app_notifications (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                detail TEXT NOT NULL,
                time_text TEXT NOT NULL,
                event_type TEXT NOT NULL,
                target TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS quick_replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                shortcut TEXT NOT NULL UNIQUE,
                message TEXT NOT NULL,
                uses INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS channel_events (
                id INTEGER PRIMARY KEY,
                channel TEXT NOT NULL,
                event TEXT NOT NULL,
                detail TEXT NOT NULL,
                status TEXT NOT NULL,
                time_text TEXT NOT NULL,
                reference TEXT NOT NULL UNIQUE
            );
        """)
        ticket_columns = {row["name"] for row in database.execute("PRAGMA table_info(tickets)").fetchall()}
        if "assignee" not in ticket_columns:
            database.execute("ALTER TABLE tickets ADD COLUMN assignee TEXT NOT NULL DEFAULT 'Fila geral'")
        if "status" not in ticket_columns:
            database.execute("ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'aberto'")
        count = database.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        if count == 0:
            messages = json.dumps([
                {"from": "customer", "text": "Quero acompanhar meu pedido #4821.", "time": "10:42"},
                {"from": "ai", "text": "Ele saiu para entrega e deve chegar até 18h.", "time": "10:42"},
            ])
            database.execute(
                "INSERT INTO conversations (name, channel, preview, status, messages) VALUES (?, ?, ?, ?, ?)",
                ("Marina Costa", "whatsapp", "Quero acompanhar meu pedido #4821", "ia", messages),
            )
        database.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES ('preferences', ?)",
            (json.dumps({"whatsapp": True, "email": True, "telegram": False, "autoReply": True, "humanTransfer": True, "tone": "Acolhedor", "confidence": 75, "start": "08:00", "end": "18:00", "days": ["Seg", "Ter", "Qua", "Qui", "Sex"]}),),
        )
        article_count = database.execute("SELECT COUNT(*) FROM knowledge_articles").fetchone()[0]
        if article_count == 0:
            database.executemany(
                "INSERT INTO knowledge_articles (title, category, excerpt, active, uses, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
                [
                    ("Como acompanhar um pedido", "Entregas", "Orienta o cliente a consultar o código de rastreio e o prazo previsto.", 84, datetime.now().isoformat()),
                    ("Troca de produto com defeito", "Trocas", "Explica os prazos, documentos e etapas para solicitar uma troca.", 57, datetime.now().isoformat()),
                    ("Cobrança não reconhecida", "Financeiro", "Informa os cuidados de segurança e transfere o caso para o time financeiro.", 39, datetime.now().isoformat()),
                ],
            )
        member_count = database.execute("SELECT COUNT(*) FROM team_members").fetchone()[0]
        if member_count == 0:
            database.executemany(
                "INSERT INTO team_members (name, email, role, team, status, active_conversations, resolved_today, satisfaction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    ("Ana Silva", "ana@acmestore.com", "Administradora", "Geral", "online", 4, 38, "4,9"),
                    ("Marcos Santos", "marcos@acmestore.com", "Atendente", "Financeiro", "ocupado", 6, 31, "4,8"),
                    ("Júlia Mendes", "julia@acmestore.com", "Atendente", "Entregas", "online", 3, 42, "4,9"),
                    ("Pedro Rocha", "pedro@acmestore.com", "Supervisor", "Trocas", "offline", 0, 27, "4,7"),
                ],
            )
        rule_count = database.execute("SELECT COUNT(*) FROM automation_rules").fetchone()[0]
        if rule_count == 0:
            database.executemany(
                "INSERT INTO automation_rules (name, trigger_text, action_text, channel, active, runs, last_run) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    ("Cobrança ou possível fraude", "Mensagem contém cobrança, fraude ou estorno", "Transferir para Financeiro", "Todos os canais", 1, 18, "Há 7 min"),
                    ("Pedido sem atualização", "Cliente pede rastreio e o pedido está atrasado", "Criar ticket de alta prioridade", "WhatsApp", 1, 12, "Há 19 min"),
                    ("Atendimento fora do horário", "Mensagem recebida após as 18h", "Responder com prazo da equipe", "Todos os canais", 1, 27, "Ontem, 22:14"),
                    ("Baixa confiança da IA", "Confiança da resposta menor que 75%", "Transferir para fila humana", "Todos os canais", 0, 9, "18 nov., 15:42"),
                ],
            )
        integration_count = database.execute("SELECT COUNT(*) FROM channel_integrations").fetchone()[0]
        if integration_count == 0:
            database.executemany(
                "INSERT INTO channel_integrations (channel, name, account, connected, last_sync, messages_today) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    ("whatsapp", "WhatsApp Business", "+55 11 98765-4321", 1, "Agora", 86),
                    ("email", "E-mail", "atendimento@acmestore.com", 1, "Há 2 min", 41),
                    ("telegram", "Telegram", "Nenhuma conta conectada", 0, "Nunca", 0),
                ],
            )
        audit_count = database.execute("SELECT COUNT(*) FROM audit_events").fetchone()[0]
        if audit_count == 0:
            database.executemany(
                "INSERT INTO audit_events (title, description, actor, event_type, level, date_text, time_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    ("Caso delicado transferido", "A conversa de Rafael Lima foi encaminhada ao time Financeiro.", "Nexa IA", "ia", "warning", "Hoje", "10:37"),
                    ("Ticket #1042 criado", "Um ticket urgente foi criado para acompanhar uma possível fraude.", "Automação", "ticket", "warning", "Hoje", "10:38"),
                    ("Resposta automática enviada", "A IA informou a previsão de entrega do pedido #4821.", "Nexa IA", "ia", "success", "Hoje", "10:42"),
                    ("Disponibilidade atualizada", "Pedro Rocha alterou sua situação para disponível.", "Pedro Rocha", "humano", "info", "Hoje", "09:54"),
                    ("Integração sincronizada", "A caixa de e-mail foi sincronizada sem erros.", "Sistema", "sistema", "success", "Hoje", "09:31"),
                ],
            )
        queue_count = database.execute("SELECT COUNT(*) FROM support_queues").fetchone()[0]
        if queue_count == 0:
            database.executemany(
                "INSERT INTO support_queues (id, name, team, waiting, agents, sla_minutes, oldest_minutes, within_percent, handled_today, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (1, "Fila geral", "Atendimento", 4, 3, 5, 7, 78, 64, "attention"),
                    (2, "Financeiro", "Cobranças e pagamentos", 3, 2, 4, 9, 62, 28, "critical"),
                    (3, "Entregas", "Pedidos e rastreio", 2, 2, 8, 3, 93, 47, "healthy"),
                    (4, "Trocas", "Devoluções e defeitos", 3, 1, 10, 12, 74, 31, "attention"),
                ],
            )
        review_count = database.execute("SELECT COUNT(*) FROM customer_reviews").fetchone()[0]
        if review_count == 0:
            database.executemany(
                "INSERT INTO customer_reviews (id, customer, initials, rating, channel, topic, comment, date_text, replied, response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (1, "Marina Costa", "MC", 5, "whatsapp", "Entrega", "A resposta chegou rápido e consegui acompanhar meu pedido.", "Hoje, 10:50", 1, "Que bom que ajudamos, Marina! Obrigada pela avaliação."),
                    (2, "Rafael Lima", "RL", 2, "email", "Financeiro", "Meu caso foi transferido, mas ainda estou preocupado com a cobrança.", "Hoje, 10:44", 0, ""),
                    (3, "Camila Oliveira", "CO", 5, "telegram", "Conta", "Encontrei onde trocar o plano e deu tudo certo.", "Hoje, 10:31", 1, "Ficamos felizes com o resultado, Camila!"),
                    (4, "João Pedro", "JP", 3, "whatsapp", "Trocas", "O atendimento foi educado, mas ainda aguardo a troca do produto.", "Hoje, 10:26", 0, ""),
                    (5, "Beatriz Souza", "BS", 5, "email", "Atendimento", "Resolveram minha dúvida com muita atenção. Obrigada!", "Hoje, 10:18", 1, "Obrigada pelo carinho, Beatriz! Conte com a gente."),
                ],
            )
        notification_count = database.execute("SELECT COUNT(*) FROM app_notifications").fetchone()[0]
        if notification_count == 0:
            database.executemany(
                "INSERT INTO app_notifications (id, title, detail, time_text, event_type, target, read) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    (1, "Financeiro ultrapassou o prazo", "Há 3 clientes aguardando atendimento humano.", "Agora", "queue", "queues", 0),
                    (2, "Nova avaliação de 2 estrelas", "Rafael ainda está preocupado com uma cobrança.", "Há 6 min", "review", "reviews", 0),
                    (3, "Ticket urgente criado", "O ticket #1042 precisa do time Financeiro.", "Há 12 min", "ticket", "tickets", 0),
                    (4, "E-mail sincronizado", "41 mensagens foram processadas hoje.", "Há 24 min", "integration", "integrations", 1),
                ],
            )
        quick_reply_count = database.execute("SELECT COUNT(*) FROM quick_replies").fetchone()[0]
        if quick_reply_count == 0:
            database.executemany(
                "INSERT INTO quick_replies (title, category, shortcut, message, uses) VALUES (?, ?, ?, ?, ?)",
                [
                    ("Pedido em transporte", "Entregas", "/rastreio", "Seu pedido já está em transporte. Vou consultar a previsão atualizada para você.", 84),
                    ("Caso enviado ao Financeiro", "Financeiro", "/financeiro", "Para cuidar deste caso com segurança, encaminhei sua solicitação ao nosso time Financeiro.", 57),
                    ("Orientação para troca", "Trocas", "/troca", "Vou ajudar com a troca. Por favor, envie uma foto do produto e informe o número do pedido.", 46),
                    ("Atendimento fora do horário", "Atendimento", "/horario", "Nossa equipe humana retorna às 8h. A IA continuará registrando suas informações por aqui.", 39),
                    ("Agradecimento final", "Encerramento", "/obrigado", "Fico feliz em ajudar! Se precisar de mais alguma coisa, conte com a gente.", 71),
                ],
            )
        channel_event_count = database.execute("SELECT COUNT(*) FROM channel_events").fetchone()[0]
        if channel_event_count == 0:
            database.executemany(
                "INSERT INTO channel_events (id, channel, event, detail, status, time_text, reference) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    (1, "whatsapp", "Mensagem recebida", "Pedido #4821 enviado por Marina Costa", "success", "Agora", "msg_4821"),
                    (2, "email", "Caso encaminhado", "Cobrança suspeita enviada ao Financeiro", "success", "Há 4 min", "mail_1042"),
                    (3, "telegram", "Resposta automática", "Orientação sobre alteração de plano", "success", "Há 9 min", "tg_8831"),
                    (4, "whatsapp", "Confirmação aguardando", "Provedor ainda processa a entrega da resposta", "processing", "Há 12 min", "msg_4817"),
                    (5, "telegram", "Falha no envio", "O bot não confirmou o recebimento da mensagem", "failed", "Há 18 min", "tg_8824"),
                ],
            )


def classify_message(text):
    message = text.lower()
    if any(word in message for word in ("cobrança", "cartão", "fraude", "estorno", "defeito")):
        return {
            "status": "urgente",
            "mood": "Preocupado",
            "topic": "Caso delicado",
            "confidence": 98,
            "reply": "Entendi. Para cuidar deste caso com atenção, já encaminhei a conversa para uma pessoa do nosso time.",
        }
    if any(word in message for word in ("pedido", "entrega", "rastrear")):
        return {"status": "ia", "mood": "Neutro", "topic": "Entrega", "confidence": 92, "reply": "Encontrei sua solicitação. Vou consultar o andamento do pedido e mostrar a atualização por aqui."}
    if any(word in message for word in ("plano", "assinatura", "mensalidade")):
        return {"status": "ia", "mood": "Neutro", "topic": "Plano", "confidence": 94, "reply": "Posso ajudar com seu plano. A alteração pode ser feita na área de configurações da conta."}
    return {"status": "ia", "mood": "Neutro", "topic": "Dúvida geral", "confidence": 68, "reply": "Recebi sua mensagem. Vou buscar a informação correta para ajudar você."}


def calculate_capacity(waiting, agents, duration):
    total_work = waiting * duration
    estimated_wait = -(-total_work // agents)
    load_per_agent = round(waiting / agents, 1)
    if estimated_wait <= 10:
        status = "healthy"
        label = "Capacidade equilibrada"
        recommendation = "A equipe atual consegue absorver a fila dentro de um prazo saudável."
    elif estimated_wait <= 25:
        status = "attention"
        label = "Atenção à fila"
        recommendation = "Redistribua casos ou acompanhe a espera antes que o prazo seja ultrapassado."
    else:
        status = "critical"
        label = "Reforço necessário"
        recommendation = "Acione mais atendentes ou priorize os casos com maior tempo de espera."
    return {
        "estimated_wait": estimated_wait,
        "load_per_agent": load_per_agent,
        "total_work": total_work,
        "status": status,
        "label": label,
        "recommendation": recommendation,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexa-api"}


@app.post("/api/ai/simulate")
def simulate_ai_response():
    data = request.json or {}
    message = data.get("message", "").strip()
    channel = data.get("channel", "whatsapp")
    if not message:
        return {"error": "Escreva uma mensagem para testar."}, 400
    if channel not in ("whatsapp", "email", "telegram"):
        return {"error": "Canal inválido."}, 400
    result = classify_message(message)
    return {
        **result,
        "channel": channel,
        "action": "Transferir para uma pessoa" if result["status"] == "urgente" else "Responder automaticamente",
    }


@app.post("/api/capacity/calculate")
def calculate_queue_capacity():
    data = request.json or {}
    try:
        waiting = int(data.get("waiting", 0))
        agents = int(data.get("agents", 0))
        duration = int(data.get("duration", 0))
    except (TypeError, ValueError):
        return {"error": "Informe números inteiros nos três campos."}, 400
    if waiting < 0 or waiting > 500:
        return {"error": "A quantidade de clientes precisa ficar entre 0 e 500."}, 400
    if agents < 1 or agents > 100:
        return {"error": "A quantidade de atendentes precisa ficar entre 1 e 100."}, 400
    if duration < 1 or duration > 240:
        return {"error": "A duração precisa ficar entre 1 e 240 minutos."}, 400
    return calculate_capacity(waiting, agents, duration)


@app.get("/api/settings")
def get_settings():
    with database_connection() as database:
        row = database.execute("SELECT value FROM settings WHERE key = 'preferences'").fetchone()
    return json.loads(row["value"]) if row else {}


@app.put("/api/settings")
def update_settings():
    data = request.json or {}
    allowed = {"whatsapp", "email", "telegram", "autoReply", "humanTransfer", "tone", "confidence", "start", "end", "days"}
    preferences = {key: value for key, value in data.items() if key in allowed}
    with database_connection() as database:
        database.execute(
            "INSERT INTO settings (key, value) VALUES ('preferences', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (json.dumps(preferences),),
        )
    return preferences


@app.get("/api/dashboard")
def dashboard_summary():
    with database_connection() as database:
        conversations = database.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        automated = database.execute("SELECT COUNT(*) FROM conversations WHERE status IN ('ia', 'resolvido')").fetchone()[0]
        human_queue = database.execute("SELECT COUNT(*) FROM conversations WHERE status IN ('urgente', 'humano')").fetchone()[0]
        open_tickets = database.execute("SELECT COUNT(*) FROM tickets WHERE status = 'aberto'").fetchone()[0]
        channel_rows = database.execute("SELECT channel, COUNT(*) AS total FROM conversations GROUP BY channel").fetchall()
    return {
        "conversations": conversations,
        "automation_rate": round((automated / conversations) * 100) if conversations else 0,
        "human_queue": human_queue,
        "open_tickets": open_tickets,
        "channels": {row["channel"]: row["total"] for row in channel_rows},
    }


@app.get("/api/knowledge")
def list_knowledge_articles():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM knowledge_articles ORDER BY id DESC").fetchall()
    return jsonify([{**dict(row), "active": bool(row["active"])} for row in rows])


@app.post("/api/knowledge")
def create_knowledge_article():
    data = request.json or {}
    title = data.get("title", "").strip()
    excerpt = data.get("excerpt", "").strip()
    if not title or not excerpt:
        return {"error": "Título e resposta são obrigatórios."}, 400
    with database_connection() as database:
        cursor = database.execute(
            "INSERT INTO knowledge_articles (title, category, excerpt, active, uses, updated_at) VALUES (?, ?, ?, 1, 0, ?)",
            (title, data.get("category", "Atendimento"), excerpt, datetime.now().isoformat()),
        )
    return {"id": cursor.lastrowid, "title": title, "active": True}, 201


@app.patch("/api/knowledge/<int:article_id>")
def update_knowledge_article(article_id):
    active = (request.json or {}).get("active")
    if not isinstance(active, bool):
        return {"error": "O campo active precisa ser verdadeiro ou falso."}, 400
    with database_connection() as database:
        cursor = database.execute("UPDATE knowledge_articles SET active = ?, updated_at = ? WHERE id = ?", (int(active), datetime.now().isoformat(), article_id))
        if cursor.rowcount == 0:
            return {"error": "Artigo não encontrado."}, 404
    return {"id": article_id, "active": active}


@app.get("/api/team")
def list_team_members():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM team_members ORDER BY name").fetchall()
    members = []
    for row in rows:
        member = dict(row)
        member["initials"] = "".join(part[0] for part in member["name"].split()[:2]).upper()
        members.append(member)
    return jsonify(members)


@app.post("/api/team")
def create_team_member():
    data = request.json or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    if not name or not email:
        return {"error": "Nome e e-mail são obrigatórios."}, 400
    try:
        with database_connection() as database:
            cursor = database.execute(
                "INSERT INTO team_members (name, email, role, team) VALUES (?, ?, ?, ?)",
                (name, email, data.get("role", "Atendente"), data.get("team", "Geral")),
            )
    except sqlite3.IntegrityError:
        return {"error": "Este e-mail já pertence a uma pessoa da equipe."}, 409
    return {"id": cursor.lastrowid, "name": name, "email": email, "status": "offline"}, 201


@app.patch("/api/team/<int:member_id>")
def update_team_member(member_id):
    status = (request.json or {}).get("status")
    if status not in ("online", "ocupado", "offline"):
        return {"error": "Disponibilidade inválida."}, 400
    with database_connection() as database:
        cursor = database.execute("UPDATE team_members SET status = ? WHERE id = ?", (status, member_id))
        if cursor.rowcount == 0:
            return {"error": "Pessoa não encontrada."}, 404
    return {"id": member_id, "status": status}


@app.get("/api/automations")
def list_automation_rules():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM automation_rules ORDER BY id DESC").fetchall()
    rules = []
    for row in rows:
        rule = dict(row)
        rule["active"] = bool(rule["active"])
        rules.append(rule)
    return jsonify(rules)


@app.post("/api/automations")
def create_automation_rule():
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return {"error": "O nome da regra é obrigatório."}, 400
    with database_connection() as database:
        cursor = database.execute(
            "INSERT INTO automation_rules (name, trigger_text, action_text, channel) VALUES (?, ?, ?, ?)",
            (name, data.get("trigger", "Mensagem contém uma palavra"), data.get("action", "Transferir para fila humana"), data.get("channel", "Todos os canais")),
        )
    return {"id": cursor.lastrowid, "name": name, "active": True}, 201


@app.patch("/api/automations/<int:rule_id>")
def update_automation_rule(rule_id):
    active = (request.json or {}).get("active")
    if not isinstance(active, bool):
        return {"error": "O campo active precisa ser verdadeiro ou falso."}, 400
    with database_connection() as database:
        cursor = database.execute("UPDATE automation_rules SET active = ? WHERE id = ?", (int(active), rule_id))
        if cursor.rowcount == 0:
            return {"error": "Regra não encontrada."}, 404
    return {"id": rule_id, "active": active}


@app.get("/api/integrations")
def list_channel_integrations():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM channel_integrations ORDER BY id").fetchall()
    return jsonify([{**dict(row), "connected": bool(row["connected"])} for row in rows])


@app.put("/api/integrations/<channel>")
def update_channel_integration(channel):
    if channel not in ("whatsapp", "email", "telegram"):
        return {"error": "Canal inválido."}, 400
    data = request.json or {}
    connected = data.get("connected")
    if not isinstance(connected, bool):
        return {"error": "O campo connected precisa ser verdadeiro ou falso."}, 400
    account = data.get("account", "").strip() if connected else "Nenhuma conta conectada"
    if connected and not account:
        return {"error": "Informe a conta que será conectada."}, 400
    last_sync = "Agora" if connected else "Nunca"
    with database_connection() as database:
        cursor = database.execute(
            "UPDATE channel_integrations SET account = ?, connected = ?, last_sync = ? WHERE channel = ?",
            (account, int(connected), last_sync, channel),
        )
        if cursor.rowcount == 0:
            return {"error": "Integração não encontrada."}, 404
    return {"channel": channel, "account": account, "connected": connected, "last_sync": last_sync}


@app.get("/api/audit")
def list_audit_events():
    event_type = request.args.get("type", "todos")
    query = request.args.get("q", "").strip()
    clauses = []
    values = []
    if event_type != "todos":
        if event_type not in ("ia", "humano", "ticket", "sistema"):
            return {"error": "Tipo de evento inválido."}, 400
        clauses.append("event_type = ?")
        values.append(event_type)
    if query:
        clauses.append("(title LIKE ? OR description LIKE ? OR actor LIKE ?)")
        term = f"%{query}%"
        values.extend([term, term, term])
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with database_connection() as database:
        rows = database.execute(f"SELECT * FROM audit_events {where} ORDER BY id DESC", values).fetchall()
    return jsonify([dict(row) for row in rows])


@app.get("/api/queues")
def list_support_queues():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM support_queues ORDER BY id").fetchall()
    return jsonify([dict(row) for row in rows])


@app.patch("/api/queues/<int:queue_id>")
def update_support_queue(queue_id):
    data = request.json or {}
    with database_connection() as database:
        row = database.execute("SELECT * FROM support_queues WHERE id = ?", (queue_id,)).fetchone()
        if row is None:
            return {"error": "Fila não encontrada."}, 404
        waiting = row["waiting"]
        oldest = row["oldest_minutes"]
        sla = row["sla_minutes"]
        if data.get("redistribute") is True:
            waiting = max(waiting - 1, 0)
            oldest = max(oldest - 2, 0)
        if "sla" in data:
            try:
                sla = int(data["sla"])
            except (TypeError, ValueError):
                return {"error": "O prazo precisa ser um número inteiro."}, 400
            if sla < 1 or sla > 60:
                return {"error": "O prazo precisa ficar entre 1 e 60 minutos."}, 400
        ratio = oldest / sla
        status = "healthy" if ratio <= 1 else "attention" if ratio <= 2 else "critical"
        database.execute(
            "UPDATE support_queues SET waiting = ?, oldest_minutes = ?, sla_minutes = ?, status = ? WHERE id = ?",
            (waiting, oldest, sla, status, queue_id),
        )
        updated = database.execute("SELECT * FROM support_queues WHERE id = ?", (queue_id,)).fetchone()
    return jsonify(dict(updated))


@app.get("/api/reviews")
def list_customer_reviews():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM customer_reviews ORDER BY id").fetchall()
    return jsonify([{**dict(row), "replied": bool(row["replied"])} for row in rows])


@app.patch("/api/reviews/<int:review_id>")
def reply_customer_review(review_id):
    response = (request.json or {}).get("response", "").strip()
    if not response:
        return {"error": "Escreva uma resposta antes de enviar."}, 400
    with database_connection() as database:
        cursor = database.execute(
            "UPDATE customer_reviews SET replied = 1, response = ? WHERE id = ?",
            (response, review_id),
        )
        if cursor.rowcount == 0:
            return {"error": "Avaliação não encontrada."}, 404
        updated = database.execute("SELECT * FROM customer_reviews WHERE id = ?", (review_id,)).fetchone()
    item = dict(updated)
    item["replied"] = bool(item["replied"])
    return jsonify(item)


@app.get("/api/notifications")
def list_notifications():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM app_notifications ORDER BY id").fetchall()
    return jsonify([{**dict(row), "read": bool(row["read"])} for row in rows])


@app.patch("/api/notifications/read-all")
def read_all_notifications():
    with database_connection() as database:
        database.execute("UPDATE app_notifications SET read = 1")
    return {"updated": True}


@app.patch("/api/notifications/<int:notification_id>")
def update_notification(notification_id):
    read = (request.json or {}).get("read")
    if not isinstance(read, bool):
        return {"error": "O campo read precisa ser verdadeiro ou falso."}, 400
    with database_connection() as database:
        cursor = database.execute("UPDATE app_notifications SET read = ? WHERE id = ?", (int(read), notification_id))
        if cursor.rowcount == 0:
            return {"error": "Notificação não encontrada."}, 404
        updated = database.execute("SELECT * FROM app_notifications WHERE id = ?", (notification_id,)).fetchone()
    item = dict(updated)
    item["read"] = bool(item["read"])
    return jsonify(item)


@app.get("/api/quick-replies")
def list_quick_replies():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM quick_replies ORDER BY id").fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/quick-replies")
def create_quick_reply():
    data = request.json or {}
    title = data.get("title", "").strip()
    category = data.get("category", "").strip()
    shortcut = data.get("shortcut", "").strip().lower()
    message = data.get("message", "").strip()
    if not title or not category or not shortcut or not message:
        return {"error": "Preencha nome, categoria, atalho e mensagem."}, 400
    if not shortcut.startswith("/"):
        shortcut = f"/{shortcut}"
    try:
        with database_connection() as database:
            cursor = database.execute(
                "INSERT INTO quick_replies (title, category, shortcut, message) VALUES (?, ?, ?, ?)",
                (title, category, shortcut, message),
            )
            created = database.execute("SELECT * FROM quick_replies WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        return {"error": "Este atalho já está em uso."}, 409
    return jsonify(dict(created)), 201


@app.patch("/api/quick-replies/<int:reply_id>/use")
def register_quick_reply_use(reply_id):
    with database_connection() as database:
        cursor = database.execute("UPDATE quick_replies SET uses = uses + 1 WHERE id = ?", (reply_id,))
        if cursor.rowcount == 0:
            return {"error": "Resposta rápida não encontrada."}, 404
        updated = database.execute("SELECT * FROM quick_replies WHERE id = ?", (reply_id,)).fetchone()
    return jsonify(dict(updated))


@app.get("/api/channel-events")
def list_channel_events():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM channel_events ORDER BY id").fetchall()
    return jsonify([{**dict(row), "time": row["time_text"]} for row in rows])


@app.patch("/api/channel-events/<int:event_id>/retry")
def retry_channel_event(event_id):
    with database_connection() as database:
        cursor = database.execute(
            "UPDATE channel_events SET event = ?, detail = ?, status = ?, time_text = ? WHERE id = ? AND status = 'failed'",
            ("Evento reprocessado", "A mensagem foi entregue após uma nova tentativa", "success", "Agora", event_id),
        )
        if cursor.rowcount == 0:
            return {"error": "Evento com falha não encontrado."}, 404
        updated = database.execute("SELECT * FROM channel_events WHERE id = ?", (event_id,)).fetchone()
    return jsonify({**dict(updated), "time": updated["time_text"]})


@app.get("/api/reports/summary")
def reports_summary():
    with database_connection() as database:
        total = database.execute("SELECT COUNT(*) FROM conversations").fetchone()[0]
        automated = database.execute("SELECT COUNT(*) FROM conversations WHERE status IN ('ia', 'resolvido')").fetchone()[0]
        open_tickets = database.execute("SELECT COUNT(*) FROM tickets WHERE status = 'aberto'").fetchone()[0]
        channel_rows = database.execute("SELECT channel, COUNT(*) AS total FROM conversations GROUP BY channel").fetchall()
    return {
        "total_conversations": total,
        "automation_rate": round((automated / total) * 100) if total else 0,
        "open_tickets": open_tickets,
        "channels": {row["channel"]: row["total"] for row in channel_rows},
    }


@app.get("/api/customers")
def list_customers():
    with database_connection() as database:
        rows = database.execute("""
            SELECT conversations.id, conversations.name, conversations.channel,
                   conversations.status, COUNT(tickets.id) AS tickets
            FROM conversations
            LEFT JOIN tickets ON tickets.conversation_id = conversations.id
            GROUP BY conversations.id
            ORDER BY conversations.name
        """).fetchall()
    customers = []
    for index, row in enumerate(rows):
        item = dict(row)
        item.update({
            "email": f"cliente{item['id']}@email.com",
            "phone": "+55 11 90000-0000",
            "orders": (index % 5) + 1,
            "segment": "Fiel" if index % 5 >= 3 else "Recorrente" if index % 5 >= 1 else "Novo",
        })
        customers.append(item)
    return jsonify(customers)


@app.get("/api/conversations")
def list_conversations():
    with database_connection() as database:
        rows = database.execute("SELECT * FROM conversations ORDER BY id DESC").fetchall()
    items = []
    for row in rows:
        item = dict(row)
        item["messages"] = json.loads(item["messages"])
        item.update({"initials": "".join(part[0] for part in item["name"].split()[:2]), "time": "Agora", "unread": 0, "mood": "Neutro", "email": "cliente@email.com", "phone": "+55 11 90000-0000", "orders": 1})
        items.append(item)
    return jsonify(items)


@app.post("/api/conversations/<int:conversation_id>/messages")
def add_message(conversation_id):
    text = request.json.get("text", "").strip()
    if not text:
        return {"error": "A mensagem está vazia."}, 400
    with database_connection() as database:
        row = database.execute("SELECT messages FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
        if row is None:
            return {"error": "Conversa não encontrada."}, 404
        messages = json.loads(row["messages"])
        message = {"from": "human", "text": text, "time": datetime.now().strftime("%H:%M")}
        messages.append(message)
        database.execute("UPDATE conversations SET messages = ?, preview = ? WHERE id = ?", (json.dumps(messages), text, conversation_id))
    return message, 201


@app.post("/api/conversations/<int:conversation_id>/transfer")
def transfer(conversation_id):
    with database_connection() as database:
        database.execute("UPDATE conversations SET status = 'humano' WHERE id = ?", (conversation_id,))
    return {"message": "Conversa transferida para a fila humana."}


@app.get("/api/tickets")
def list_tickets():
    with database_connection() as database:
        rows = database.execute("""
            SELECT tickets.*, COALESCE(conversations.name, 'Cliente') AS customer
            FROM tickets
            LEFT JOIN conversations ON conversations.id = tickets.conversation_id
            ORDER BY tickets.id DESC
        """).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/tickets")
def create_ticket():
    data = request.json or {}
    if not data.get("title", "").strip():
        return {"error": "O título é obrigatório."}, 400
    with database_connection() as database:
        cursor = database.execute(
            "INSERT INTO tickets (conversation_id, title, priority, assignee, status, created_at) VALUES (?, ?, ?, ?, 'aberto', ?)",
            (data["conversation_id"], data["title"].strip(), data.get("priority", "Média"), data.get("assignee", "Fila geral"), datetime.now().isoformat()),
        )
    return {"id": cursor.lastrowid, "message": "Ticket criado."}, 201


@app.patch("/api/tickets/<int:ticket_id>")
def update_ticket(ticket_id):
    status = (request.json or {}).get("status")
    if status not in ("aberto", "resolvido"):
        return {"error": "Status inválido."}, 400
    with database_connection() as database:
        cursor = database.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
        if cursor.rowcount == 0:
            return {"error": "Ticket não encontrado."}, 404
    return {"id": ticket_id, "status": status}


@app.post("/api/incoming")
def receive_incoming():
    data = request.json or {}
    name = data.get("name", "").strip()
    text = data.get("message", "").strip()
    channel = data.get("channel", "whatsapp")
    if not name or not text:
        return {"error": "Nome e mensagem são obrigatórios."}, 400
    if channel not in ("whatsapp", "email", "telegram"):
        return {"error": "Canal inválido."}, 400
    result = classify_message(text)
    current_time = datetime.now().strftime("%H:%M")
    messages = [
        {"from": "customer", "text": text, "time": current_time},
        {"from": "ai", "text": result["reply"], "time": current_time},
    ]
    with database_connection() as database:
        cursor = database.execute(
            "INSERT INTO conversations (name, channel, preview, status, messages) VALUES (?, ?, ?, ?, ?)",
            (name, channel, text, result["status"], json.dumps(messages)),
        )
    return {
        "id": cursor.lastrowid,
        "name": name,
        "initials": "".join(part[0] for part in name.split()[:2]).upper(),
        "channel": channel,
        "time": "Agora",
        "preview": text,
        "unread": 1,
        "status": result["status"],
        "mood": result["mood"],
        "email": "novo.cliente@email.com",
        "phone": "+55 11 90000-0000",
        "orders": 0,
        "messages": messages,
    }, 201


if __name__ == "__main__":
    prepare_database()
    app.run(debug=True, port=5000)
