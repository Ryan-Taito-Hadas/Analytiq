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

        const linhas = dados.alunos.map(aluno => `
            <tr>
                <td>${aluno.aluno}</td>
                <td>${aluno.nota}</td>
                <td>${aluno.escore_z ?? "Não calculável"}</td>
                <td>${aluno.classificacao}</td>
                <td>${aluno.probabilidade !== null ? aluno.probabilidade + "%" : "Não calculável"}</td>
            </tr>
        `).join("");

        resultado.innerHTML = `
            <h2>Resultado da análise</h2>

            <p>Quantidade de alunos: ${dados.quantidade}</p>
            <p>Média da turma: ${dados.media}</p>
            <p>Desvio padrão: ${dados.desvio_padrao}</p>

            <h3>Desempenho individual</h3>

            <table border="1" cellpadding="8">
                <tr>
                    <th>Aluno</th>
                    <th>Nota</th>
                    <th>Escore Z</th>
                    <th>Classificação</th>
                    <th>Percentual abaixo da nota</th>
                </tr>
                ${linhas}
            </table>
        `;

    } catch (erro) {
        resultado.innerText = "Não foi possível conectar ao servidor.";
    }
}
