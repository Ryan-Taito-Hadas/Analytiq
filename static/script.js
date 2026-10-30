
async function analisarNotas() {
    const campoNotas = document.getElementById("notas");
    const resultado = document.getElementById("resultado");

    const notas = campoNotas.value
        .split(",")
        .map(nota => Number(nota.trim()));

    if (
        campoNotas.value.trim() === "" ||
        notas.some(nota => !Number.isFinite(nota) || nota < 0 || nota > 100)
    ) {
        resultado.innerText = "Digite notas válidas entre 0 e 100.";
        return;
    }

    try {
        const resposta = await fetch("/notas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ notas: notas })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            resultado.innerText = dados.detail || "Erro ao analisar as notas.";
            return;
        }

        resultado.innerHTML = `
            <h2>Resultado da análise</h2>
            <p>Quantidade de alunos: ${dados.quantidade}</p>
            <p>Notas: ${dados.notas.join(", ")}</p>
            <p>Média da turma: ${dados.media}</p>
            <h3>Desvio padrão: ${dados.desvio_padrao}</h3>
        `;

    } catch (erro) {
        resultado.innerText = "Não foi possível conectar ao servidor.";
    }
}
