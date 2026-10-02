# Meu Próximo Carro

Ferramenta analítica para decisão familiar de compra de carro, pensada para a realidade da Bahia: foco em híbridos, espaço traseiro para cadeirinhas (ISOFIX) e custo total de propriedade (TCO) em 3 anos.

O app transforma visitas a concessionárias em dados comparáveis: cada carro é cadastrado com preço, condições de pagamento, medidas, consumo, segurança e custos; o app elimina os que não atendem aos requisitos da família e ranqueia os restantes por uma nota ponderada ajustável.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Regras de negócio](#regras-de-negócio)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Dados e sincronização](#dados-e-sincronização)
- [Importação e exportação](#importação-e-exportação)
- [Segurança (Firestore)](#segurança-firestore)
- [Limitações conhecidas](#limitações-conhecidas)

## Funcionalidades

| Aba | O que faz |
| --- | --- |
| **Dashboard** | Visão geral da decisão: veículos viáveis, líder do ranking, menor TCO e atalhos. |
| **Veículos** | Lista com filtros, status do funil (Quero visitar, Visitei, Testado, Aguardando proposta, Finalista, Eliminado, Comprado), dimensões comparadas ao carro usado atual. |
| **Testes (Modo Concessionária)** | Tela rápida para usar no showroom: registrar a distância medida entre os pontos ISOFIX e atualizar o carro na hora. |
| **Comparar** | Comparação lado a lado, com opção de exibir apenas as diferenças. |
| **Custos & TCO** | TCO simplificado de 3 anos: IPVA, seguro, revisões e consumo, com memória de cálculo. |
| **Ranking** | Ranking ponderado com simulação de prioridades em tempo real (sliders de peso) e relatório dos finalistas (impressão ou cópia em texto). |
| **Configurações** | Cenários de uso, preços de combustível e energia, carro usado de referência (FIPE e medidas), pesos do ranking e requisitos eliminatórios. |

Recursos transversais:

- **Formulário progressivo** de cadastro com 7 blocos (identificação, preço e negociação, espaço e ISOFIX, porta-malas, motorização e bateria, consumo e segurança, conforto e garantia).
- **Simulador de financiamento**: calcula parcela a partir da taxa, ou a taxa implícita a partir da parcela (busca por bisseção), com uso opcional do carro usado como entrada.
- **Planilha Excel (.xlsx)**: exportar, baixar modelo, editar em lote e reimportar.
- **PWA**: instalável no celular (manifest, ícones, modo standalone), com navegação inferior no mobile.
- **Tema claro e escuro**, respeitando a preferência do sistema.

## Regras de negócio

Todas as regras ficam em `lib/calculations.ts`.

### Eliminação (`checkElimination`)

| Condição | Resultado |
| --- | --- |
| Motorização BEV com "Excluir BEV" ativo | Eliminado |
| Até 4 passageiros | Eliminado |
| 5 passageiros, ISOFIX não medido | Pendente de medição presencial |
| 5 passageiros, ISOFIX < 45 cm | Eliminado |
| 5 passageiros, ISOFIX ≥ 45 cm | Aprovado |
| 6 ou mais passageiros | Aprovado com qualquer distância ISOFIX |

### Classificação ISOFIX (`getIsofixRating`)

`< 43 cm` Crítico · `43 a 44,9` Limítrofe · `45 a 46,9` Viável · `47 a 49,9` Bom · `≥ 50` Excelente.

### TCO de 3 anos (`calculateTCO`)

| Componente | Origem do valor |
| --- | --- |
| IPVA | Valor informado; se vazio, preço da loja × alíquota (padrão BA 2,5%) |
| Seguro | Valor informado; se vazio, 3,5% do preço da loja ao ano |
| Revisões | Valor informado para 3 anos |
| Consumo | Valor informado; se vazio, estimado por km/ano, % urbano, km/l cidade e estrada e preço da gasolina |

### Ranking ponderado (`calculateCategoryScores`)

Cada categoria recebe nota de 0 a 100 e é multiplicada por um peso configurável. Pesos padrão:

| Categoria | Peso |
| --- | --- |
| Espaço familiar e ISOFIX | 30 |
| TCO | 20 |
| Segurança | 15 |
| Motorização e eficiência | 10 |
| Conforto | 10 |
| Garantia e revenda | 10 |
| Tecnologia | 5 |

### Cenários prontos

| Cenário | km/ano | % urbano | Energia |
| --- | --- | --- | --- |
| Padrão Familiar Salvador / RMS | 15.000 | 75% | R$ 0,95/kWh |
| Uso Intenso Bahia | 25.000 | 60% | R$ 0,95/kWh |
| Energia Solar Fotovoltaica | 15.000 | 80% | R$ 0,20/kWh |

## Stack

- **Next.js 15** (App Router, `output: 'standalone'`) e **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**, `lucide-react` (ícones) e `motion` (animações)
- **Firebase** (Firestore) para sincronização em nuvem
- **SheetJS** (`xlsx`) para importação e exportação de planilhas
- Projeto originado no Google AI Studio

## Como rodar

Pré-requisitos: Node.js 20+ e npm ou Bun (o repositório traz `bun.lock`).

```bash
# 1. Instalar dependências
bun install            # ou: npm install

# 2. Variáveis de ambiente (opcional, ver abaixo)
cp .env.example .env.local

# 3. Desenvolvimento
bun run dev            # http://localhost:3000

# 4. Produção
bun run build
bun run start
```

Scripts disponíveis em `package.json`:

| Script | Ação |
| --- | --- |
| `dev` | Servidor de desenvolvimento |
| `build` | Build de produção |
| `start` | Sobe o build de produção |
| `lint` | ESLint |
| `clean` | Limpa artefatos do Next |

### Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Herdada do template do AI Studio. Hoje nenhum código do app chama a API Gemini. |
| `APP_URL` | URL pública do app (injetada pelo AI Studio / Cloud Run). |

A configuração do Firebase não usa variáveis de ambiente: fica em `firebase-applet-config.json`.

## Estrutura do projeto

```
app/
  layout.tsx              Metadados, PWA, viewport
  page.tsx                Shell do app: abas, modais, tema, toast, importação via URL
components/
  navigation/             TopBar (desktop) e BottomNav (mobile)
  views/                  Uma view por aba + VehicleFormModal
  ui/                     Modais (Excel, relatório, memória de cálculo) e StatusBadge
  utilities/PreventZoom   Bloqueia zoom por gesto no mobile
lib/
  calculations.ts         Regras de negócio: eliminação, ISOFIX, financiamento, TCO, ranking
  storage.ts              Hook useCarMatchStore: estado, localStorage e sincronização
  firestore-sync.ts       Leitura e escrita no Firestore
  firebase.ts             Inicialização do Firebase
  excel.ts                Colunas, exportação, modelo e importação de .xlsx
  seed-data.ts            Veículos de exemplo, preferências padrão e cenários
types/vehicle.ts          Modelo de dados (Vehicle, UserPreferences, PaymentCondition...)
public/                   Ícones e manifest.json do PWA
firestore.rules           Regras de segurança do Firestore
firebase-blueprint.json   Esquema das entidades (Workspace, Vehicle, Preferences)
security_spec.md          Especificação de segurança e payloads de teste
```

## Dados e sincronização

O app é **local-first**:

1. Veículos, preferências e cenário ativo ficam no `localStorage` (chaves `meu_proximo_carro_*_v4`).
2. Cada alteração também é gravada no Firestore, no workspace fixo `familia_carmatch`:
   - `workspaces/familia_carmatch/vehicles/{vehicleId}`
   - `workspaces/familia_carmatch/config/preferences`
3. Ao abrir, se a nuvem estiver vazia e houver dados locais, os dados locais sobem automaticamente.
4. Uma assinatura em tempo real mescla os veículos da nuvem com os locais. **Em conflito, o dado local prevalece.**
5. Exclusões ficam registradas em `meu_proximo_carro_deleted_ids` para que o veículo excluído não volte pela nuvem.

Na primeira execução, o app carrega veículos de exemplo (BYD Song Plus, GWM Haval H6, Toyota Corolla Cross) e um carro usado de referência (Jeep Renegade). Em Configurações é possível restaurar esses dados.

## Importação e exportação

- **Excel**: aba "Veículos" com uma linha por carro e aba "Instruções". O modelo para preenchimento pode ser baixado pelo próprio app.
- **JSON**: snapshot completo (veículos, preferências e cenário), com modo substituir ou mesclar.
- **Link de transferência**: abrir o app com `#import=<base64 do JSON>` importa os dados e limpa a URL. Útil para levar os dados do ambiente de desenvolvimento para a versão publicada.

## Segurança (Firestore)

As regras em `firestore.rules`:

- negam tudo por padrão;
- validam IDs (alfanumérico, `_` e `-`, até 128 caracteres);
- validam estrutura mínima de workspace, veículo (marca, modelo, ano entre 1990 e 2050, motorização) e preferências (km/ano, % urbano, preço da gasolina).

A chave `apiKey` em `firebase-applet-config.json` é uma chave web do Firebase, pública por natureza. A proteção real depende das regras do Firestore (ver limitação abaixo).

## Limitações conhecidas

- **Sem autenticação nas regras**: `firestore.rules` não exige `request.auth`, apesar de `security_spec.md` declarar que toda escrita exige autenticação. Qualquer pessoa com a configuração do projeto pode ler e alterar o workspace `familia_carmatch`.
- **Workspace único fixo**: todos os usuários compartilham `familia_carmatch`; não há separação por família.
- **`security_spec.md` desatualizado**: cita campos `make`, `year` e `price`, enquanto o modelo usa `brand`, `yearModel` e `financial.storePrice`.
- **Inconsistência de período**: o cálculo de TCO é de 3 anos, mas alguns rótulos (Ranking, Configurações e Relatório) mencionam 5 anos.
- **Dependência sem uso**: `@google/genai` está instalado, mas não é usado.
- **Premissas fixas da Bahia**: ao importar preferências, estado, alíquota de IPVA (2,5%) e período de TCO (3 anos) são forçados.
- **Sem testes automatizados** e com `eslint.ignoreDuringBuilds` ativo no build.
