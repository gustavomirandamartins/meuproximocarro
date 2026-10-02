<p align="center">
  <img src="public/icon-carmatch.png" alt="Meu Próximo Carro" width="160" />
</p>

<h1 align="center">🚗 Meu Próximo Carro</h1>

<p align="center">
  <strong>Ferramenta analítica e comparativa para decisão familiar de compra automotiva na Bahia</strong><br/>
  Foco em híbridos · Espaço traseiro ISOFIX · TCO de 3 anos
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/PWA-Ready-brightgreen" alt="PWA" />
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Modelo de Dados](#-modelo-de-dados)
- [Regras de Negócio](#-regras-de-negócio)
- [Primeiros Passos](#-primeiros-passos)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Integração Firebase](#-integração-firebase)
- [Importação / Exportação Excel](#-importação--exportação-excel)
- [Cenários Pré-configurados](#-cenários-pré-configurados)
- [PWA & Mobile](#-pwa--mobile)
- [Licença](#-licença)

---

## 🎯 Visão Geral

**Meu Próximo Carro** é uma aplicação web progressiva (PWA) projetada para auxiliar famílias baianas na decisão de compra de um carro novo — especialmente veículos **híbridos (HEV, PHEV, REEV, MHEV)** e **elétricos (BEV)**.

O app resolve três problemas críticos que famílias com crianças pequenas enfrentam ao comparar carros:

1. **Espaço traseiro com ISOFIX** — Será que cabem 2 cadeirinhas + 1 adulto no banco de trás? O app usa a distância interna entre pontos ISOFIX (medida com fita métrica na concessionária) para classificar e até eliminar veículos automaticamente.

2. **Custo Total de Propriedade (TCO)** — O preço do carro é só o começo. O app calcula IPVA (alíquota Bahia 2,5%), seguro, revisões e consumo de combustível/eletricidade em **3 anos** para uma comparação justa.

3. **Decisão estruturada** — Ranking ponderado por 7 categorias com pesos ajustáveis, simulação financeira de parcelas e geração de relatórios para discussão em família.

---

## ✨ Funcionalidades

### 📊 Dashboard Estratégico
Painel "Como está minha decisão?" com KPIs em tempo real: finalistas, líder de pontuação, menor TCO (3 anos), veículos pendentes de medição e alertas de requisitos eliminatórios.

### 🚙 Diretório de Veículos
Lista completa com filtros por status (Viáveis, Eliminados, Finalistas) e tipo de motorização (PHEV, HEV, REEV, BEV, Combustão). Busca em tempo real por marca, modelo ou concessionária. Cards mostram dimensões comparadas ao carro usado e TCO de 3 anos.

### 📏 Modo Concessionária
Interface otimizada para uso no smartphone dentro do showroom. Insira a medida da fita métrica para distância ISOFIX e a quantidade de passageiros, com feedback imediato:

| Classificação | Distância ISOFIX | Significado |
|---|---|---|
| 🔴 Crítico | < 43 cm | Insuficiente para uso familiar |
| 🟡 Limítrofe | 43–44,9 cm | Abaixo do mínimo recomendado |
| 🟢 Viável | 45–46,9 cm | Atende ao requisito mínimo |
| 🔵 Bom | 47–49,9 cm | Confortável |
| 🩵 Excelente | ≥ 50 cm | Referência de espaço |

### ⚖️ Comparação Lado a Lado
Matriz comparativa de 2 a 5 veículos com destaque visual dos melhores valores em cada atributo. Modo "Apenas Diferenças" para focar no que importa.

### 🏆 Ranking Ponderado Interativo
Pontuação de 0 a 100 baseada em 7 categorias com **pesos ajustáveis ao vivo** via sliders. Animações de Motion (Framer Motion) indicam subida/descida de posição em tempo real.

| Categoria | Peso Padrão |
|---|---|
| Espaço Familiar & ISOFIX | 30% |
| TCO & Custos (3 Anos) | 20% |
| Segurança | 15% |
| Motorização & Eficiência | 10% |
| Conforto | 10% |
| Garantia & Custos | 10% |
| Tecnologia | 5% |

### 💰 Simulador Financeiro
Integrado ao cadastro de cada veículo com:
- Cálculo de parcela a partir da **taxa de juros** (fórmula PMT)
- Cálculo da **taxa implícita** a partir do valor da parcela (bisseção numérica)
- Inclusão do carro usado como parte da entrada
- Múltiplas condições de pagamento por veículo

### 💵 Análise TCO de 3 Anos
Custos de propriedade simplificados com 4 componentes:
- **IPVA** (Bahia 2,5%)
- **Seguro** anual
- **Revisões** programadas em 3 anos
- **Consumo** de combustível + eletricidade em 3 anos

### 📄 Relatório Executivo
Gera sumário dos finalistas para impressão ou cópia rápida (ideal para compartilhar no WhatsApp da família).

### 📥📤 Importação & Exportação Excel
Exporta todo o catálogo em planilha `.xlsx` com 7 blocos estruturados. Importa planilhas preenchidas com validação de erros e merge inteligente. Inclui download de template com instruções.

### ⚙️ Configurações
Ajuste de parâmetros regionais (preço do combustível, eletricidade, quilometragem anual), pesos das categorias do ranking, dados do carro usado para comparação e cenários de simulação.

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.4 |
| UI | React + React DOM | 19.2 |
| Linguagem | TypeScript | 5.9 |
| Estilização | Tailwind CSS | 4.1 |
| Animações | Motion (Framer Motion) | 12.23 |
| Ícones | Lucide React | 0.553 |
| Backend / DB | Firebase Firestore (Enterprise) | SDK 12.19 |
| Autenticação | Firebase Auth | SDK 12.19 |
| Planilhas | SheetJS (xlsx) | 0.18 |
| Package Manager | Bun | — |

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────────┐
│                    Next.js App Router                 │
│                     (Single Page)                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐           │
│  │Dashboard│  │ Vehicles │  │  Ranking │  ...       │
│  └────┬────┘  └────┬─────┘  └────┬─────┘           │
│       │             │             │                  │
│       └─────────────┼─────────────┘                  │
│                     ▼                                │
│          ┌─────────────────────┐                     │
│          │  useCarMatchStore   │ ← Hook global       │
│          │  (lib/storage.ts)   │   React State       │
│          └──────────┬──────────┘                     │
│                     │                                │
│                     ▼                                │
│          ┌──────────────────┐                        │
│          │  Cloud Firestore │ ← Fonte de verdade     │
│          │  (real-time sync)│   via onSnapshot       │
│          └──────────────────┘                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Firebase-first**: todos os dados são salvos diretamente no Cloud Firestore. O estado da aplicação é alimentado por listeners em tempo real (`onSnapshot`), garantindo que qualquer alteração seja refletida imediatamente. Operações de escrita usam atualização otimista no React State seguida de gravação no Firestore.

---

## 📐 Modelo de Dados

### Vehicle (Veículo)

Organizado em **7 blocos temáticos**:

| Bloco | Campos Principais |
|---|---|
| **1. Identificação** | marca, modelo, versão, motorização (HEV/PHEV/REEV/MHEV/BEV/Combustão), status, ano fabricação, ano modelo, concessionária, vendedor |
| **2. Preço & Negociação** | preço de tabela, preço da loja, avaliação do usado, condições de pagamento |
| **3. Espaço & ISOFIX** | distância ISOFIX (cm), passageiros, comprimento, largura, entre-eixos, peso |
| **4. Porta-malas** | volume (L), tipo de estepe, abertura elétrica |
| **5. Motorização & Bateria** | potência (cv), torque (kgfm), 0-100 km/h, autonomia total, tração, bateria (kWh), autonomia elétrica (km) |
| **6. Consumo & Segurança** | km/l cidade/estrada, airbags, ADAS, alerta ponto cego, câmera 360° |
| **7. Conforto & Garantia** | garantia geral/bateria (anos), IPVA, seguro, revisões 3 anos, consumo 3 anos, bancos elétricos, saída de ar traseira, CarPlay sem fio, teto panorâmico |

### UserPreferences (Preferências)

- Parâmetros regionais: quilometragem anual, % urbano, preço gasolina/etanol/eletricidade
- Localização fixa: Bahia (IPVA 2,5%)
- Dados do carro usado atual (padrão: Jeep Renegade Longitude 2021)
- Pesos das 7 categorias do ranking

### Funil de Status

```
Quero visitar → Visitei → Testado → Aguardando proposta → Finalista → Comprado
                                                            ↘ Eliminado
```

---

## 📏 Regras de Negócio

### Eliminação Automática por ISOFIX

| Passageiros | Regra |
|---|---|
| ≤ 4 | ❌ Eliminado automaticamente |
| 5 | ✅ Aprovado se ISOFIX ≥ 45 cm · ⏳ Pendente se não medido · ❌ Eliminado se < 45 cm |
| > 5 (6, 7 lugares) | ✅ Aprovado com qualquer ISOFIX |

### TCO Simplificado (3 Anos, Bahia)

```
TCO = IPVA(3a) + Seguro(3a) + Revisões(3a) + Consumo(3a)
```

- **IPVA**: `preço da loja × 2,5% × 3 anos`
- **Seguro**: valor informado ou estimativa
- **Revisões**: custo das revisões programadas em 3 anos
- **Consumo**: combustível + eletricidade em 3 anos

### Pontuação Ponderada (Ranking)

Cada veículo recebe nota de 0 a 100 em 7 categorias, multiplicadas pelos pesos do usuário e normalizadas para uma **pontuação final ponderada**. Todos os valores são arredondados para 2 casas decimais.

---

## 🚀 Primeiros Passos

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+ ou [Bun](https://bun.sh/) 1.0+
- Conta Firebase com Firestore habilitado

### Instalação

```bash
# Clone o repositório
git clone <url-do-repo>
cd Meu-Próximo-Carro

# Instale as dependências
bun install
# ou
npm install
```

### Execução

```bash
# Modo de desenvolvimento
bun dev
# ou
npm run dev

# Acesse http://localhost:3000
```

### Build de Produção

```bash
bun run build
bun start
```

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|---|---|
| `dev` | Inicia o servidor de desenvolvimento Next.js |
| `build` | Gera o build otimizado de produção (standalone) |
| `start` | Inicia o servidor de produção |
| `lint` | Executa o ESLint em todo o projeto |
| `clean` | Limpa o cache do Next.js |

---

## 📁 Estrutura do Projeto

```
Meu-Próximo-Carro/
├── app/
│   ├── globals.css              # Estilos globais (Tailwind v4 + dark mode)
│   ├── layout.tsx               # Layout raiz com PWA metadata
│   └── page.tsx                 # Página principal (SPA com abas)
├── components/
│   ├── navigation/
│   │   ├── TopBar.tsx           # Barra superior desktop
│   │   └── BottomNav.tsx        # Dock inferior mobile
│   ├── ui/
│   │   ├── CalculationModal.tsx # Memória de cálculo detalhada
│   │   ├── ExcelManagerModal.tsx# Import/export Excel
│   │   ├── ReportModal.tsx      # Relatório executivo
│   │   └── StatusBadge.tsx      # Badges de status e ISOFIX
│   ├── utilities/
│   │   └── PreventZoom.tsx      # Anti-zoom iOS
│   └── views/
│       ├── DashboardView.tsx    # Painel estratégico
│       ├── VehiclesView.tsx     # Lista de veículos
│       ├── ComparisonView.tsx   # Comparação lado a lado
│       ├── TcoCostsView.tsx     # Análise de custos TCO (3 anos)
│       ├── DealershipQuickTestView.tsx  # Modo concessionária
│       ├── RankingView.tsx      # Ranking ponderado
│       ├── SettingsView.tsx     # Configurações
│       └── VehicleFormModal.tsx # Formulário de cadastro (7 passos)
├── hooks/
│   └── use-mobile.ts            # Detecção responsiva
├── lib/
│   ├── calculations.ts         # Motor de regras, TCO e scoring
│   ├── excel.ts                # Importador/exportador Excel
│   ├── firebase.ts             # Inicialização Firebase
│   ├── firestore-sync.ts       # Sync em tempo real com Firestore
│   ├── seed-data.ts            # Dados iniciais e cenários
│   ├── storage.ts              # Store global (useCarMatchStore)
│   └── utils.ts                # Utilitário cn()
├── types/
│   └── vehicle.ts              # Tipagem completa TypeScript
├── public/                     # Assets PWA (manifesto, ícones)
├── firebase.json               # Config Firestore
├── firestore.rules             # Regras de segurança (autenticação obrigatória)
└── package.json
```

---

## 🔥 Integração Firebase

### Firestore (Enterprise)

O banco de dados segue a seguinte hierarquia:

```
workspaces/
  └── {workspaceId}/               # Padrão: "familia_carmatch"
      ├── vehicles/
      │   └── {vehicleId}          # Documento completo do veículo
      └── config/
          └── preferences          # Preferências do usuário + pesos
```

### Segurança

- **Autenticação obrigatória**: todas as operações requerem `request.auth != null`
- **Default-deny**: todo acesso é bloqueado por padrão
- Validação de IDs por regex (`^[a-zA-Z0-9_\\-]+$`)
- Validação de tipos e ranges (ano entre 1990–2050, km ≥ 0, porcentagens 0–100)
- Limite de tamanho de strings (≤ 100–128 caracteres)

### Sincronização

- **Fonte de verdade**: Cloud Firestore via `onSnapshot` (real-time listeners)
- **Escrita**: atualização otimista no React State → gravação direta no Firestore
- **Leitura**: listeners em tempo real alimentam o estado da aplicação

---

## 📊 Importação / Exportação Excel

O módulo Excel suporta um fluxo completo:

1. **📥 Download de Template** — Planilha modelo com dados de exemplo e aba de instruções
2. **📤 Exportação** — Gera `.xlsx` com todos os veículos cadastrados em 7 blocos estruturados
3. **📥 Importação** — Lê planilha preenchida, valida campos obrigatórios e cria/atualiza veículos com merge por ID

---

## 🎭 Cenários Pré-configurados

| Cenário | km/ano | % Urbano | Gasolina | Eletricidade |
|---|---|---|---|---|
| **Padrão Familiar Salvador / RMS** | 15.000 | 75% | R\$ 6,20/L | R\$ 0,95/kWh |
| **Uso Intenso Bahia** | 25.000 | 60% | R\$ 6,20/L | R\$ 0,95/kWh |
| **Energia Solar Fotovoltaica** | 15.000 | 80% | R\$ 6,20/L | R\$ 0,20/kWh |

---

## 📱 PWA & Mobile

- **Instalável** como app na tela inicial (iOS e Android)
- **Standalone mode** com tema escuro adaptativo (`#070e20`)
- **Responsivo**: TopBar no desktop, BottomNav (dock flutuante) no mobile
- **Design glassmorphic** inspirado no iOS com malhas cromáticas, blur e bordas translúcidas
- **Anti-zoom** para estabilidade em iOS Safari
- **Áreas seguras** compatíveis com notch e Dynamic Island

---

## 📄 Licença

Projeto privado de uso pessoal/familiar.

---

<p align="center">
  Feito com 💙 para famílias que querem tomar a melhor decisão na hora de trocar de carro.
</p>