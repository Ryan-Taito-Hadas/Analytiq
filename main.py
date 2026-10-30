from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from statistics import mean, pstdev
from scipy.stats import shapiro
from math import erf, sqrt

app = FastAPI(title="Analytiq")

app.mount("/static", StaticFiles(directory="static"), name="static")


class DadosAnalise(BaseModel):
    avaliacao: str = Field(min_length=1, max_length=100)
    periodo: str = Field(min_length=1, max_length=50)
    origem: str
    notas: list[float]


def cdf_normal(z):
    return (1 + erf(z / sqrt(2))) / 2


def cdf_normal_limitada(nota, media, desvio):
    inferior = cdf_normal((0 - media) / desvio)
    superior = cdf_normal((10 - media) / desvio)
    valor = cdf_normal((nota - media) / desvio)

    if superior == inferior:
        return None

    return (valor - inferior) / (superior - inferior) * 100


@app.get("/")
def inicio():
    return FileResponse("templates/index.html")


@app.post("/notas")
def analisar(dados: DadosAnalise):
    notas = dados.notas

    if len(notas) < 2:
        raise HTTPException(400, "Informe pelo menos duas notas.")

    if any(nota < 0 or nota > 10 for nota in notas):
        raise HTTPException(400, "As notas devem estar entre 0 e 10.")

    quantidade = len(notas)
    media_turma = mean(notas)
    desvio = pstdev(notas)

    alunos = []

    for indice, nota in enumerate(notas, start=1):
        if desvio == 0:
            escore_z = None
            classificacao = "Na média"
            probabilidade = None
        else:
            escore_z = (nota - media_turma) / desvio

            classificacao = (
                "Acima da média" if escore_z > 0 else
                "Abaixo da média" if escore_z < 0 else
                "Na média"
            )

            probabilidade = None

        alunos.append({
            "aluno": indice,
            "nota": nota,
            "escore_z": round(escore_z, 2) if escore_z is not None else None,
            "classificacao": classificacao,
            "probabilidade": probabilidade
        })

    normalidade = {
        "calculavel": False,
        "estatistica": None,
        "p_valor": None,
        "plausivel": False,
        "mensagem": "São necessárias pelo menos 3 notas e alguma variação entre elas para executar o teste."
    }

    if 3 <= quantidade <= 5000 and desvio > 0:
        estatistica, p_valor = shapiro(notas)
        plausivel = bool(p_valor >= 0.05)

        normalidade = {
            "calculavel": True,
            "estatistica": round(float(estatistica), 4),
            "p_valor": round(float(p_valor), 6),
            "plausivel": plausivel,
            "mensagem": (
                "O teste não encontrou evidências suficientes para rejeitar a hipótese de normalidade. A aproximação pode ser considerada com cautela."
                if plausivel else
                "O teste encontrou evidências contra a normalidade. Não é recomendável usar o modelo normal para estimar probabilidades destes dados."
            )
        }

        if quantidade < 30:
            normalidade["mensagem"] += " A amostra é pequena; o teste pode não detectar desvios da normalidade."

    elif quantidade > 5000:
        normalidade["mensagem"] = "O teste de Shapiro-Wilk é aplicado aqui somente a conjuntos de até 5000 notas."

    if desvio > 0 and normalidade["plausivel"]:
        for aluno in alunos:
            aluno["probabilidade"] = round(
                cdf_normal_limitada(aluno["nota"], media_turma, desvio), 2
            )

    acima = sum(a["classificacao"] == "Acima da média" for a in alunos)
    abaixo = sum(a["classificacao"] == "Abaixo da média" for a in alunos)
    na_media = quantidade - acima - abaixo

    muito_abaixo = sum(
        a["escore_z"] is not None and a["escore_z"] <= -1
        for a in alunos
    )

    percentual_muito_abaixo = muito_abaixo / quantidade * 100

    if desvio == 0:
        interpretacao = "Todas as notas são iguais. Não há dispersão para diferenciar o desempenho pelo escore Z."
        recomendacao = "Analise também os critérios da avaliação, pois as notas não mostram diferenças entre os participantes."

    elif percentual_muito_abaixo >= 20:
        interpretacao = f"{muito_abaixo} aluno(s), ou {percentual_muito_abaixo:.1f}% da turma, ficaram pelo menos um desvio padrão abaixo da média."
        recomendacao = "Vale revisar os conteúdos da avaliação e observar individualmente os alunos com maior dificuldade."

    else:
        interpretacao = f"{muito_abaixo} aluno(s), ou {percentual_muito_abaixo:.1f}% da turma, ficaram pelo menos um desvio padrão abaixo da média."
        recomendacao = "Use os resultados para acompanhar os alunos abaixo da média e identificar conteúdos que merecem reforço."

    if not normalidade["plausivel"]:
        interpretacao += " Como a aproximação normal não foi considerada plausível, as probabilidades do modelo normal foram omitidas."
    else:
        interpretacao += " As probabilidades exibidas são estimativas de um modelo normal limitado ao intervalo de notas de 0 a 10."

    return {
        "avaliacao": dados.avaliacao,
        "periodo": dados.periodo,
        "origem": dados.origem,
        "quantidade": quantidade,
        "media": round(media_turma, 2),
        "desvio_padrao": round(desvio, 2),
        "normalidade": normalidade,
        "classificacao": {
            "acima": acima,
            "abaixo": abaixo,
            "na_media": na_media,
            "muito_abaixo": muito_abaixo,
            "percentual_muito_abaixo": round(percentual_muito_abaixo, 1)
        },
        "interpretacao": interpretacao,
        "recomendacao": recomendacao,
        "alunos": alunos
    }