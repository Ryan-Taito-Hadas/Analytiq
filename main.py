from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


class DadosNotas(BaseModel):
    notas: list[float]


@app.get("/")
def inicio():
    return FileResponse("templates/index.html")


@app.post("/notas")
def receber_notas(dados: DadosNotas):
    return {
        "quantidade": len(dados.notas),
        "notas": dados.notas
    }
