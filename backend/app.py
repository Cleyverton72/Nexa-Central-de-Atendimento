"""API local da central de atendimento.

Ela guarda conversas e tickets em um banco SQLite.
O painel React usa esta API quando está rodando em localhost.
"""

from datetime import datetime
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


def prepare_database():
    with connect() as database:
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


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nexa-api"}


@app.get("/api/conversations")
def list_conversations():
    with connect() as database:
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
    with connect() as database:
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
    with connect() as database:
        database.execute("UPDATE conversations SET status = 'humano' WHERE id = ?", (conversation_id,))
    return {"message": "Conversa transferida para a fila humana."}


@app.post("/api/tickets")
def create_ticket():
    data = request.json
    with connect() as database:
        cursor = database.execute(
            "INSERT INTO tickets (conversation_id, title, priority, created_at) VALUES (?, ?, ?, ?)",
            (data["conversation_id"], data["title"], data.get("priority", "Média"), datetime.now().isoformat()),
        )
    return {"id": cursor.lastrowid, "message": "Ticket criado."}, 201


if __name__ == "__main__":
    prepare_database()
    app.run(debug=True, port=5000)
