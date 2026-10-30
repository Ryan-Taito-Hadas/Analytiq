from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from statistics import mean, pstdev
from math import erf, sqrt

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


class DadosNotas(BaseModel):
    notas: list[float]


@app.get("/")
def inicio():
    return FileResponse("templates/index.html")


@app.post("/notas")
def receber_notas(dados: DadosNotas):

    notas = dados.notas

    if len(notas) == 0:
        raise HTTPException(status_code=400, detail="Informe pelo menos uma nota.")

    if any(nota < 0 or nota > 100 for nota in notas):
        raise HTTPException(status_code=400, detail="As notas devem estar entre 0 e 100.")

    quantidade = len(notas)
    media = mean(notas)
    desvio_padrao = pstdev(notas)

    alunos = []

    for indice, nota in enumerate(notas, start=1):

        if desvio_padrao == 0:
            escore_z = None
            probabilidade = None
            classificacao = "Não calculável"

        else:
            escore_z = (nota - media) / desvio_padrao

            probabilidade = (
                (1 + erf(escore_z / sqrt(2))) / 2
            ) * 100

            if escore_z > 0:
                classificacao = "Acima da média"
            elif escore_z < 0:
                classificacao = "Abaixo da média"
            else:
                classificacao = "Na média"

        alunos.append({
            "aluno": indice,
            "nota": nota,
            "escore_z": round(escore_z, 2) if escore_z is not None else None,
            "classificacao": classificacao,
            "probabilidade": round(probabilidade, 2) if probabilidade is not None else None
        })

    return {
        "quantidade": quantidade,
        "notas": notas,
        "media": round(media, 2),
        "desvio_padrao": round(desvio_padrao, 2),
        "alunos": alunos
    }
