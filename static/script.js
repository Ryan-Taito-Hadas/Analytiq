async function analisarNotas() {
    const campoNotas = document.getElementById("notas");
    const resultado = document.getElementById("resultado");

    const notas = campoNotas.value
        .split(",")
        .map(nota => Number(nota.trim()));

    if (notas.length === 0 || notas.some(nota => isNaN(nota) || nota < 0 || nota > 100)) {
        resultado.innerText = "Digite notas válidas entre 0 e 100.";
        return;
    }

    const resposta = await fetch("/notas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ notas: notas })
    });

    const dados = await resposta.json();

    resultado.innerText = `Recebemos ${dados.quantidade} notas: ${dados.notas.join(", ")}`;
}
