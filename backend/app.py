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
                created_at TEXT NOT NULL
            );
        """)
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


@app.post("/api/tickets")
def create_ticket():
    data = request.json
    with database_connection() as database:
        cursor = database.execute(
            "INSERT INTO tickets (conversation_id, title, priority, created_at) VALUES (?, ?, ?, ?)",
            (data["conversation_id"], data["title"], data.get("priority", "Média"), datetime.now().isoformat()),
        )
    return {"id": cursor.lastrowid, "message": "Ticket criado."}, 201


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
