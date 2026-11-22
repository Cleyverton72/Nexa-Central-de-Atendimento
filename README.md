# Nexa — Central de Atendimento

Protótipo de um atendimento automatizado para WhatsApp, e-mail e Telegram.

## O que já funciona

- painel responsivo com indicadores;
- visão geral com fila humana, canais e atividades recentes;
- busca e filtro por canal;
- leitura e envio de mensagens;
- sugestão de resposta da IA;
- criação de tickets;
- painel de tickets com busca, filtros e prioridades;
- mudança de ticket aberto para resolvido;
- cadastro de clientes com busca, segmentos e histórico;
- relatórios de volume, canais, automação e satisfação;
- configurações de canais, IA e horário de atendimento;
- base de conhecimento com busca, categorias e novos artigos;
- gestão da equipe com disponibilidade, carga de trabalho e cadastro de atendentes;
- gestão das filas humanas com SLA, capacidade e redistribuição de casos;
- avaliações dos clientes com filtros, respostas e acompanhamento de notas baixas;
- central de notificações com avisos, atalhos e controle de leitura;
- respostas rápidas com categorias, atalhos e contador de uso;
- calculadora de capacidade com tempo previsto e recomendação operacional;
- regras de automação com condições, ações e ativação individual;
- painel de integrações para WhatsApp, e-mail e Telegram;
- ambiente de teste para classificação, resposta e transferência da IA;
- auditoria com pesquisa, filtros, detalhes e exportação CSV;
- transferência para a fila humana;
- simulação de novas mensagens recebidas;
- simulador multicanal com prévia da classificação, rota e resposta da IA;
- monitor de eventos dos canais com filtros e reprocessamento de falhas;
- fila de treinamento da IA para aprovar ou corrigir respostas reais;
- classificação automática de casos delicados;
- API Python com banco SQLite para uso local.

## Rodar o painel React

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite no navegador.

## Rodar a API Python

Em outro terminal:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

A API ficará em `http://127.0.0.1:5000`.

## Próxima etapa para produção

Trocar os dados de demonstração pelas APIs oficiais dos canais e conectar um provedor de IA. As credenciais devem ficar no servidor e nunca no código do navegador.
