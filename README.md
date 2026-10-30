# Analytiq — Analisador de Desempenho Acadêmico

Aplicação web acadêmica para analisar notas de avaliações e comparar os resultados com conceitos de estatística descritiva, escore Z e distribuição normal.

## Funcionalidades

- Entrada de notas entre 0 e 10.
- Identificação da avaliação, período e origem dos dados.
- Cálculo de média e desvio padrão populacional.
- Cálculo do escore Z e classificação individual.
- Teste de normalidade de Shapiro-Wilk.
- Comparação das frequências observadas com frequências esperadas por um modelo normal.
- Interpretação e recomendação simples dos resultados.

## Requisitos

- Python 3.10 ou superior.
- Conexão com a internet para carregar Chart.js e fontes externas.

## Instalação

No terminal, dentro da pasta do projeto:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload

Notas simuladas para testes:
5.8, 6.2, 6.5, 6.7, 6.8, 7.0, 7.1, 7.2, 7.3, 7.5, 7.8, 8.0, 8.2, 8.5, 8.7

1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 9.0, 9.2, 9.5, 10.0