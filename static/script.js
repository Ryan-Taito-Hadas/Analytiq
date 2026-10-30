let grafico = null;

async function analisarNotas() {
    const resultado = document.getElementById("resultado");
    const avaliacao = document.getElementById("avaliacao").value.trim();
    const periodo = document.getElementById("periodo").value.trim();
    const origem = document.getElementById("origem").value;
    const texto = document.getElementById("notas").value.trim();

    if (!avaliacao || !periodo || !texto) {
        resultado.innerHTML = '<p class="error">Preencha a avaliação, o período e as notas.</p>';
        return;
    }

    const valores = texto.split(",").map(item => item.trim());

    if (valores.some(item => item === "")) {
        resultado.innerHTML = '<p class="error">Verifique se existem notas vazias.</p>';
        return;
    }

    const notas = valores.map(Number);

    if (notas.length < 2 || notas.some(nota => !Number.isFinite(nota) || nota < 0 || nota > 10)) {
        resultado.innerHTML = '<p class="error">Informe pelo menos duas notas válidas entre 0 e 10.</p>';
        return;
    }

    resultado.innerHTML = '<p class="loading">Analisando notas...</p>';

    try {
        const resposta = await fetch("/notas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ avaliacao, periodo, origem, notas })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            resultado.innerHTML = `<p class="error">${dados.detail}</p>`;
            return;
        }

        const n = dados.normalidade;
        const c = dados.classificacao;

        const linhas = dados.alunos.map(aluno => {
            let classe = "average";

            if (aluno.classificacao === "Acima da média") {
                classe = "above";
            }

            if (aluno.classificacao === "Abaixo da média") {
                classe = "below";
            }

            return `
                <tr>
                    <td>Participante ${aluno.aluno}</td>
                    <td>${aluno.nota.toFixed(2)}</td>
                    <td>${aluno.escore_z === null ? "—" : aluno.escore_z}</td>
                    <td><span class="status ${classe}">${aluno.classificacao}</span></td>
                    <td>${aluno.probabilidade === null ? "Não disponível" : aluno.probabilidade + "%"}</td>
                </tr>
            `;
        }).join("");

        resultado.innerHTML = `
            <div class="analysis-heading">
                <div>
                    <span class="tag">ANÁLISE</span>
                    <h3>${escapar(dados.avaliacao)}</h3>
                    <p>${escapar(dados.periodo)} · ${escapar(dados.origem)}</p>
                </div>
            </div>

            <div class="metrics">
                <div class="metric">
                    <span>Participantes</span>
                    <strong>${dados.quantidade}</strong>
                </div>

                <div class="metric">
                    <span>Média</span>
                    <strong>${dados.media.toFixed(2)}</strong>
                </div>

                <div class="metric">
                    <span>Desvio padrão</span>
                    <strong>${dados.desvio_padrao.toFixed(2)}</strong>
                </div>
            </div>

            <div class="normality ${n.plausivel ? "positive" : "negative"}">
                <h3>Verificação da distribuição normal</h3>

                <strong>
                    ${n.plausivel
                        ? "Não houve evidência suficiente contra a normalidade"
                        : "A aproximação normal não foi validada"}
                </strong>

                <p>${n.mensagem}</p>

                ${n.calculavel
                    ? `<p>Shapiro-Wilk: W = ${n.estatistica} · valor-p = ${n.p_valor}</p>`
                    : ""}

                <small>
                    O teste não prova que os dados são normais.
                    Foi adotado nível de significância de 5% (0,05).
                </small>
            </div>

            <div class="distribution">
                <h3>Classificação dos participantes</h3>

                <div class="count-grid">
                    <span>Acima da média <strong>${c.acima}</strong></span>
                    <span>Abaixo da média <strong>${c.abaixo}</strong></span>
                    <span>Na média <strong>${c.na_media}</strong></span>
                    <span>1 ou mais desvios abaixo <strong>${c.muito_abaixo} (${c.percentual_muito_abaixo}%)</strong></span>
                </div>
            </div>

            <div class="chart-section">
                <h3>Notas observadas e modelo normal</h3>

                <div class="chart-container">
                    <canvas id="graficoNotas"></canvas>
                </div>

                <p class="table-note">
                    ${n.plausivel
                        ? "A curva representa frequências esperadas por um modelo normal limitado ao intervalo de 0 a 10."
                        : "A curva normal não foi exibida porque a aproximação não foi considerada plausível."}
                </p>
            </div>

            <div class="interpretation">
                <h3>Interpretação</h3>
                <p>${dados.interpretacao}</p>

                <h3>Recomendação</h3>
                <p>${dados.recomendacao}</p>
            </div>

            <div class="table-section">
                <h3>Desempenho individual</h3>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Participante</th>
                                <th>Nota</th>
                                <th>Escore Z</th>
                                <th>Classificação</th>
                                <th>Estimativa abaixo</th>
                            </tr>
                        </thead>

                        <tbody>${linhas}</tbody>
                    </table>
                </div>

                <p class="table-note">
                    A estimativa abaixo é calculada pelo modelo normal limitado a notas entre 0 e 10.
                    Não é a porcentagem real de participantes com nota inferior.
                </p>
            </div>
        `;

        criarGrafico(dados);

    } catch (erro) {
        resultado.innerHTML = '<p class="error">Não foi possível conectar ao servidor. Confira se o FastAPI está em execução.</p>';
        console.error(erro);
    }
}


function escapar(valor) {
    return valor.replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


function cdf(z) {
    return (1 + erfAproximacao(z / Math.sqrt(2))) / 2;
}


function erfAproximacao(x) {
    const sinal = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1 / (1 + 0.3275911 * x);

    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);

    return sinal * y;
}


function criarGrafico(dados) {
    const contexto = document.getElementById("graficoNotas");

    if (grafico) {
        grafico.destroy();
    }

    const limites = [0, 2, 4, 6, 8, 10];
    const labels = ["0–2", "2–4", "4–6", "6–8", "8–10"];

    const observadas = labels.map((_, indice) =>
        dados.alunos.filter(a => {
            const nota = a.nota;

            return indice === 4
                ? nota >= limites[indice] && nota <= limites[indice + 1]
                : nota >= limites[indice] && nota < limites[indice + 1];
        }).length
    );

    const datasets = [{
        type: "bar",
        label: "Participantes observados",
        data: observadas,
        backgroundColor: "#2563eb",
        borderRadius: 5
    }];

    if (dados.normalidade.plausivel && dados.desvio_padrao > 0) {
        const media = dados.media;
        const desvio = dados.desvio_padrao;

        const inferior = cdf((0 - media) / desvio);
        const superior = cdf((10 - media) / desvio);

        const esperado = [];

        for (let i = 0; i < 5; i++) {
            const p1 = (cdf((limites[i] - media) / desvio) - inferior) / (superior - inferior);
            const p2 = (cdf((limites[i + 1] - media) / desvio) - inferior) / (superior - inferior);

            esperado.push(Math.max(0, (p2 - p1) * dados.quantidade));
        }

        datasets.push({
            type: "line",
            label: "Frequência esperada pelo modelo normal",
            data: esperado,
            borderColor: "#f59e0b",
            backgroundColor: "#f59e0b",
            tension: 0.3,
            pointRadius: 4
        });
    }

    grafico = new Chart(contexto, {
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#cbd5e1"
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8" },
                    grid: { color: "#26364d" },
                    title: {
                        display: true,
                        text: "Faixa de notas",
                        color: "#94a3b8"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#94a3b8",
                        precision: 0
                    },
                    grid: { color: "#26364d" },
                    title: {
                        display: true,
                        text: "Quantidade de participantes",
                        color: "#94a3b8"
                    }
                }
            }
        }
    });
}