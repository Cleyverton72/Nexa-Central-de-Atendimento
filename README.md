# Nexa — Central de Atendimento

Protótipo de um atendimento automatizado para WhatsApp, e-mail e Telegram.

## Status do projeto

**Versão 1.0 — protótipo funcional finalizado.**

O painel, a API local, o banco SQLite e o fluxo automatizado estão conectados. Para uso comercial, ainda é necessário contratar ou configurar as APIs oficiais dos canais e um provedor de IA.

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
- escalas semanais com jornadas, pausas e cobertura por dia;
- gestão das filas humanas com SLA, capacidade e redistribuição de casos;
- avaliações dos clientes com filtros, respostas e acompanhamento de notas baixas;
- central de notificações com avisos, atalhos e controle de leitura;
- respostas rápidas com categorias, atalhos e contador de uso;
- calculadora de capacidade com tempo previsto e recomendação operacional;
- regras de automação com condições, ações e ativação individual;
- roteamento inteligente por palavras, canal, fila e prioridade;
- triagem configurável antes da transferência para atendimento humano;
- painel de integrações para WhatsApp, e-mail e Telegram;
- ambiente de teste para classificação, resposta e transferência da IA;
- auditoria com pesquisa, filtros, detalhes e exportação CSV;
- transferência para a fila humana;
- simulação de novas mensagens recebidas;
- simulador multicanal com fluxo completo: IA, roteamento, triagem, ticket e transferência humana;
- monitor de eventos dos canais com filtros e reprocessamento de falhas;
- fila de treinamento da IA para aprovar ou corrigir respostas reais;
- controle de permissões por função para administradores, supervisores e atendentes;
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

## Rodar os testes automáticos

Com o ambiente Python ativado:

```bash
cd backend
python -m unittest test_app.py -v
```

Os testes conferem cobrança urgente, acompanhamento de entrega e validação de mensagem vazia.

## Próxima etapa para produção

Trocar os dados de demonstração pelas APIs oficiais dos canais e conectar um provedor de IA. As credenciais devem ficar no servidor e nunca no código do navegador.
