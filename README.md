# Gerto — ROAS Transfer

**Gerto** é o sistema de gestão (ERP) da **ROAS Transfer**, empresa de transporte executivo e receptivo. Ele centraliza serviços, agenda, frota, motoristas parceiros, intérpretes, clientes, finanças e contratos, substituindo o controle informal feito por mensagens de WhatsApp.

Este repositório contém o **protótipo front-end responsivo** (smartphone, tablet e desktop), desenvolvido de forma *spec-driven* a partir dos documentos em [`docs/`](docs/):

- [`docs/requisitos.md.md`](docs/requisitos.md.md) — visão, requisitos funcionais/não funcionais e critérios de aceitação
- [`docs/casos_de_uso.md.md`](docs/casos_de_uso.md.md) — UC01 a UC15, mensagens `[MSG01]`–`[MSG54]` e histórias de usuário
- [`docs/gertoPlanejamento.pdf`](docs/gertoPlanejamento.pdf) — Design Thinking, Lean Inception e roadmap dos 5 MVPs

> Projeto Integrador I — Análise e Desenvolvimento de Sistemas (UniCEUB/FATECS).

---

## Como executar

Pré-requisito: **Node.js 18+** (testado com Node 26 / npm 11).

```bash
npm install
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`).

Outros comandos:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve o build localmente
```

### Contas de demonstração

| Usuário | E-mail | Senha | Perfil |
| --- | --- | --- | --- |
| Lucas | `lucas@roastransfer.demo` | `Gerto@2026` | Administrador — Chefe e Motorista (CEO) |
| Jaellen | `jaellen@roastransfer.demo` | `Gerto@2026` | Administradora — Coordenadora / Advogada |
| Conta desativada | `inativo@roastransfer.demo` | `Gerto@2026` | Demonstra `[MSG04]` |

As duas contas administrativas têm permissões equivalentes.

### Personas (Design Thinking) refletidas no protótipo

| Persona | Papel no Gerto | Como aparece no protótipo |
| --- | --- | --- |
| [Lucas](docs/personas/persona-lucas.jpg) — Chefe e motorista, 26 anos | Usuário administrador (CEO) | Conta `lucas@…`; também cadastrado como motorista próprio. Dashboard centraliza operação e financeiro para quem lida com alto fluxo de demandas. |
| [Jaellen](docs/personas/persona-jaellen.jpg) — Coordenadora / Advogada / Administradora, 30 anos | Usuária administradora | Conta `jaellen@…`; agenda visual, controle financeiro, contratos com assinatura e painel contábil (recibos/NFS-e). |
| [Junior](docs/personas/persona-junior.jpg) — Motorista freelancer parceiro, 42 anos | Recebe informações (não usa o sistema) | Resumo do WhatsApp com horário, partida, itinerário e **contato da coordenação**; alerta na ficha quando a **diária/repasse do parceiro** ainda não foi lançada. |
| [Deputado Roberto](docs/personas/persona-deputado-roberto.jpg) — Cliente do setor político, 52 anos | Cliente atendido | Cliente VIP com etiqueta **Sigilo**, preferências de atendimento visíveis na ficha e no formulário, rotas aeroporto ↔ Congresso ↔ ministérios ↔ embaixadas e **modo sigiloso** no resumo (oculta cliente e passageiro). |

---

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Framework | React 18 + Vite 5 (JavaScript/JSX) |
| Roteamento | React Router 6 (`HashRouter`, compatível com GitHub Pages) |
| Estilo | Tailwind CSS 3.4 com tokens de cor da paleta oficial e modo escuro por classe |
| Ícones | lucide-react |
| Gráficos | SVG puro (componente `BarChart`), sem dependências extras |
| Persistência | Mock back-end: React Context + `localStorage` com seed de dados fictícios |

### Paleta oficial

| Cor | Hex | Uso principal |
| --- | --- | --- |
| Areia / Bege Suave | `#DDD8C4` | fundos agrupados, detalhes no modo escuro |
| Verde Sálvia Claro | `#A3C9A8` | badges, destaques |
| Verde Menta Acinzentado | `#84B59F` | destaques luminosos no modo escuro |
| Verde-Azulado Médio | `#69A297` | ações secundárias, estados ativos |
| Azul Petróleo Ardósia | `#50808E` | cabeçalhos, botões primários, estrutura |

---

## Arquitetura

```
src/
├── constants/       # messages.js (MSG01–MSG54 oficiais), domínio, navegação
├── data/seed.js     # dados iniciais fictícios da ROAS Transfer (datas relativas ao 1º acesso)
├── services/        # camada de dados — única a tocar no armazenamento
│   ├── storage.js       # adaptador localStorage + evento "storage" (sync entre abas)
│   ├── network.js       # simulação de latência, "Simular Offline" e falha de servidor
│   ├── repository.js    # regras de negócio e gravação (substituível por API REST)
│   └── auth.js          # login, JWT simulado, recuperação de senha
├── context/         # Theme, Toast (alertas iOS), Auth, Data (estado global)
├── hooks/           # usePageLoad (falhas de carregamento por caso de uso)
├── utils/           # regras puras (choque de frota, finanças, tags, resumo, templates), máscaras, CSV
├── components/      # UI reutilizável, layout (Sidebar/Tab Bar), serviços, contratos, cadastros
└── pages/           # uma página por módulo
```

- **Componentes não acessam o `localStorage`.** Toda leitura/escrita passa por `DataContext` → `services/repository.js`. Para integrar uma API REST basta reimplementar `repository.js`/`auth.js` mantendo as assinaturas.
- **Mensagens oficiais centralizadas.** Toasts, alertas e estados de erro consomem `src/constants/messages.js`; o código da mensagem (ex.: `MSG20`) aparece discretamente sob o texto para rastreabilidade.
- **Relacionamentos por ID.** Serviços referenciam cliente, veículo, motorista e intérprete; lançamentos, contratos e documentos fiscais referenciam o serviço. Qualquer alteração reflete em agenda, histórico, financeiro e dashboards.

### Navegação

- **Smartphone (< 768 px):** Tab Bar inferior translúcida — *Início, Agenda, Frota, Financeiro, Mais* — e modais em *bottom sheet*.
- **Tablet/Desktop (≥ 768 px):** Sidebar fixa com as mesmas seções (Geral, Operação, Cadastros, Financeiro, Documentos, Sistema).
- O cabeçalho traz sempre o **indicador de sincronização** (com “Simular Offline”) e o **botão Claro/Escuro**.

---

## Casos de uso implementados

| MVP | UC | Onde testar | Destaques |
| --- | --- | --- | --- |
| 1 | **UC01** Login | `/login` | Validação de e-mail habilita “Entrar”; JWT simulado (8 h); `[MSG01]` `[MSG02]` (offline) `[MSG03]` `[MSG04]`; recuperação de senha (CA 1) com código exibido na tela `[MSG05]` `[MSG06]` |
| 1 | **UC02** Frota e motoristas | Frota › Veículos / Motoristas / Intérpretes | CRUD, busca, máscara de placa Mercosul/antiga, CPF, CNH, telefone; campos obrigatórios em vermelho `[MSG12]`; placa/CNH duplicada `[MSG13]`; inativação `[MSG09]` `[MSG10]` |
| 1 | **UC03** Serviços | Serviços › Novo Serviço / ficha | Criação `[MSG14]`, edição `[MSG15]`, status Agendado → Em Andamento → Concluído/Cancelado com log; bloqueio de data retroativa `[MSG17]`; falha nas listas de apoio `[MSG16]` |
| 2 | **UC04** Calendário | Agenda | Marcadores por status, navegação entre meses (reconsulta), lista do dia, `[MSG19]`, `[MSG18]` offline |
| 2 | **UC05** Choque de frota | Formulário de serviço | Sobreposição de janela (início + duração) por veículo **e** motorista; bloqueia o salvamento com `[MSG20]` detalhado e lista auxiliar de recursos livres (CA 1.1) |
| 2 | **UC06** Etiquetas e filtros | Serviços, Frota, Motoristas, Clientes | Tags (status, Frota Própria, Terceirizada, VIP, Aeroporto…) com filtro combinado “E”; `[MSG21]` + atalho `[MSG22]` |
| 3 | **UC07** Resumo WhatsApp | Ficha do serviço › Gerar Resumo | Pré-visualização, copiar texto, compartilhar via `wa.me` (sem envio automático); `[MSG23]` `[MSG24]` |
| 3 | **UC08** Histórico por cliente | Histórico | Concluídos em ordem cronológica, filtros por cliente e período; `[MSG25]` `[MSG26]` |
| 3 | **UC09** Tempo real | Cabeçalho / Configurações | Indicador de sync, evento `storage` entre abas (`[MSG27]`), “Simular Offline” (`[MSG28]`) e falha de servidor (`[MSG29]`) |
| 4 | **UC10** Financeiro por serviço | Financeiro › Por serviço / ficha | Receitas e despesas (combustível, pedágio, diária…), lucro líquido e margem automáticos; `[MSG30]`–`[MSG33]` |
| 4 | **UC11** Dashboard | Início | Faturamento, despesas, lucro estimado, serviços do dia, próximos atendimentos, gráfico de 6 meses; pull-to-refresh e botão Atualizar; `[MSG34]`–`[MSG36]` |
| 4 | **UC12** Relatórios | Financeiro › Relatórios | Período inicial/final, entradas, saídas, saldo, categorias, detalhamento e CSV; `[MSG37]`–`[MSG39]` |
| 5 | **UC13** Templates | Contratos › Templates | CRUD com variáveis `{{cliente}}`, `{{data}}`, `{{origem}}`, `{{destino}}`, `{{valor}}`…; “Utilizar Modelo” gera contrato; `[MSG40]`–`[MSG45]` |
| 5 | **UC14** Assinatura eletrônica | Contratos › contrato | Pendente → Enviado → Assinado; confirmação por senha, registro de data/hora e hash SHA-256; cancelar mantém status; anexos; impressão/PDF; `[MSG46]`–`[MSG50]` |
| 5 | **UC15** Dashboard contábil | Financeiro › Contábil | Indicadores do mês, status de recibos/NFS-e com registro de emissão, exportação **CSV real**; `[MSG51]`–`[MSG54]` |

### Roteiro rápido de demonstração

1. Entre com **Lucas** (`lucas@roastransfer.demo` / `Gerto@2026`).
2. **Choque de frota:** *Serviços › Novo Serviço* para **amanhã às 09:15**, veículo **Corolla Altis Hybrid (RTA1B23)** e motorista **Lucas** → o sistema exibe `[MSG20]` com o serviço em conflito e sugere veículos/motoristas livres.
3. **Data retroativa:** informe um horário já passado de hoje → `[MSG17]`.
4. **WhatsApp:** abra um serviço do **Deputado Roberto** (filtro *Sigilo* em Serviços) e clique em **Gerar Resumo** — o modo sigiloso já vem ativado.
5. **Financeiro:** na ficha, lance uma despesa de *Pedágio* e veja o lucro líquido e o Dashboard atualizarem.
6. **Sincronização:** abra o Gerto em **duas abas**, altere um registro em uma delas e veja a outra atualizar com `[MSG27]`.
7. **Offline:** ative *Simular Offline* no indicador do cabeçalho e tente salvar (`[MSG28]`), abrir módulos ou fazer login (`[MSG02]`).
8. **Contratos:** *Contratos › Templates › Utilizar Modelo*, gere o contrato e **Assine Eletronicamente** (senha `Gerto@2026`).
9. **Contábil:** *Financeiro › Contábil › Exportar CSV*.

Para recomeçar do zero use *Configurações › Restaurar dados de demonstração*.

---

## Limites desta entrega (funcionalidades simuladas)

- Autenticação e JWT são **simulados**; não há segurança real nem back-end.
- O `localStorage` não é um banco de dados seguro e não sincroniza entre dispositivos; a sincronização via evento `storage` ocorre **apenas entre abas do mesmo navegador**.
- A **assinatura eletrônica** é demonstrativa, sem certificação ICP-Brasil nem validade jurídica.
- O **painel contábil** não se integra a sistemas fiscais nem emite notas oficiais — a emissão é apenas registrada.
- O compartilhamento via **WhatsApp** apenas abre o aplicativo com o texto; o envio depende do usuário.
- A recuperação de senha não envia e-mail: o código é exibido na tela.
- A especificação original prevê app iOS em Flutter + API C#/PostgreSQL; este protótipo web valida fluxos, regras e interface antes dessa implementação.

## Pendências e próximos passos

- Testes automatizados (unitários das regras em `utils/rules.js`, e2e dos fluxos) e pipeline no GitHub Actions (CA-05).
- As personas já foram incorporadas (ver tabela acima). As demais figuras do planejamento (jornadas, mapa de stakeholders, visão do produto, "É / Não é", brainstorm e sequenciador de MVPs) ainda não foram analisadas.
- Mensagens para situações não cobertas pelo tópico 4 dos casos de uso (ex.: e-mail não encontrado na recuperação de senha, período inválido no relatório) são exibidas como validação inline do campo, sem criar novos códigos `MSG`. Recomenda-se que a equipe defina códigos oficiais para elas.
- Integração com a API REST real substituindo `services/repository.js` e `services/auth.js`.
