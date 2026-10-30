
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from statistics import mean, pstdev

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

    return {
        "quantidade": quantidade,
        "notas": notas,
        "media": round(media, 2),
        "desvio_padrao": round(desvio_padrao, 2)
    }
