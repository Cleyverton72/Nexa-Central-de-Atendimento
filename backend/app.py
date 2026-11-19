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


def classify_message(text):
    message = text.lower()
    if any(word in message for word in ("cobrança", "cartão", "fraude", "estorno", "defeito")):
        return {
            "status": "urgente",
            "mood": "Preocupado",
            "reply": "Entendi. Para cuidar deste caso com atenção, já encaminhei a conversa para uma pessoa do nosso time.",
        }
    if any(word in message for word in ("pedido", "entrega", "rastrear")):
        return {"status": "ia", "mood": "Neutro", "reply": "Encontrei sua solicitação. Vou consultar o andamento do pedido e mostrar a atualização por aqui."}
    if any(word in message for word in ("plano", "assinatura", "mensalidade")):
        return {"status": "ia", "mood": "Neutro", "reply": "Posso ajudar com seu plano. A alteração pode ser feita na área de configurações da conta."}
    return {"status": "ia", "mood": "Neutro", "reply": "Recebi sua mensagem. Vou buscar a informação correta para ajudar você."}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexa-api"}


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
