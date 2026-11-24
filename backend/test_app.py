import os
import tempfile
import unittest

import app as service


class ServiceJourneyTests(unittest.TestCase):
    def setUp(self):
        handle, self.database_path = tempfile.mkstemp(suffix=".db")
        os.close(handle)
        os.unlink(self.database_path)
        self.original_database = service.DATABASE
        service.DATABASE = self.database_path
        service.prepare_database()
        self.client = service.app.test_client()

    def tearDown(self):
        service.DATABASE = self.original_database
        if os.path.exists(self.database_path):
            os.unlink(self.database_path)

    def test_charge_case_goes_to_finance_team(self):
        response = self.client.post("/api/journey/simulate", json={
            "name": "Rafael Lima",
            "channel": "email",
            "message": "Não reconheço esta cobrança no meu cartão",
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["routing"]["queue"], "Financeiro")
        self.assertEqual(response.json["routing"]["priority"], "Urgente")
        self.assertEqual(response.json["triage"]["fieldCount"], 4)
        self.assertTrue(response.json["ticket"]["created"])
        self.assertEqual(response.json["outcome"]["type"], "human")

    def test_delivery_case_stays_with_ai(self):
        response = self.client.post("/api/journey/simulate", json={
            "name": "Lucas Mendes",
            "channel": "whatsapp",
            "message": "Quero acompanhar meu pedido #4821",
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["routing"]["queue"], "Entregas")
        self.assertFalse(response.json["ticket"]["created"])
        self.assertEqual(response.json["outcome"]["type"], "automatic")

    def test_empty_message_is_rejected(self):
        response = self.client.post("/api/journey/simulate", json={
            "name": "",
            "channel": "whatsapp",
            "message": "",
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["error"], "Nome e mensagem são obrigatórios.")


if __name__ == "__main__":
    unittest.main()
