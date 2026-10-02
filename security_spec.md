# Firestore Security Rules — Especificação de Testes

## Invariantes de Segurança e Integridade

1. **Sincronização Direta no Firebase**: Operações em `/workspaces/{workspaceId}` (padrão familiar `familia_carmatch`), `/vehicles/{vehicleId}` e `/config/{configId}` gravam e leem diretamente no Firestore.
2. **Default-deny**: Qualquer coleção não explicitamente permitida é bloqueada (`allow read, write: if false`).
3. **Integridade dos Dados do Veículo**: Veículos devem conter `brand` (string ≤ 100), `model` (string ≤ 100), `yearModel` (number entre 1990–2050) e `powertrain` (string).
4. **Integridade de Preferências**: Preferências devem validar `annualKm` (number ≥ 0), `urbanSharePercent` (number entre 0 e 100) e `gasolinePricePerLiter` (number ≥ 0).
5. **Validação de IDs**: Documentos e workspaces devem usar IDs com formato válido (`^[a-zA-Z0-9_\\-]+$`) e tamanho ≤ 128 caracteres, prevenindo injeções de path.

## Casos de Teste de Validação

| # | Cenário | Operação | Resultado Esperado |
|---|---------|----------|--------------------|
| 1 | Coleção não autorizada | `GET /outra_colecao/doc1` | ❌ DENIED |
| 2 | ID de documento com caracteres inválidos | `CREATE /workspaces/familia_carmatch/vehicles/../hack` | ❌ DENIED |
| 3 | Veículo válido | `CREATE` com `brand`, `model`, `yearModel`, `powertrain` válidos | ✅ ALLOWED |
| 4 | Veículo sem `brand` | `CREATE` sem campo obrigatório `brand` | ❌ DENIED |
| 5 | Veículo sem `model` | `CREATE` sem campo obrigatório `model` | ❌ DENIED |
| 6 | Veículo com `yearModel: 1800` | `CREATE` com ano fora do range 1990–2050 | ❌ DENIED |
| 7 | Veículo com `yearModel: 3000` | `CREATE` com ano fora do range 1990–2050 | ❌ DENIED |
| 8 | Veículo com `brand` de 200 caracteres | `CREATE` com string excedendo 100 chars | ❌ DENIED |
| 9 | Preferências com `annualKm: -5000` | `UPDATE /workspaces/familia_carmatch/config/preferences` | ❌ DENIED |
| 10 | Preferências com `urbanSharePercent: 150` | `UPDATE` com porcentagem > 100 | ❌ DENIED |
| 11 | Preferências válidas | `UPDATE` com dados dentro dos limites | ✅ ALLOWED |
| 12 | Health check de conexão | `GET /test/connection` | ✅ ALLOWED |
