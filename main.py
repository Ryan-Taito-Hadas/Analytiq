from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/", response_class=HTMLResponse)
def inicio():
    return """
    <h1>Analisador de Desempenho Acadêmico</h1>
    <p>Sistema funcionando!</p>
    """
