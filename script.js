// ELEMENTOS DO DOM
const campoPergunta = document.getElementById("campoPergunta");
const btnPerguntar = document.getElementById("btnPerguntar");
const caixaResposta = document.getElementById("caixaResposta");
const textoResposta = document.getElementById("textoResposta");
const containerNoticia = document.getElementById("containerNoticia");
const linkNoticia = document.getElementById("linkNoticia");
const btnVoz = document.getElementById("btnVoz");
const caixaSugestoes = document.getElementById("caixaSugestoes");
const statusTag = document.getElementById("statusTag");

// SUGESTÕES DE BUSCA
const sugestoesIniciais = [
    "Fundação do Flamengo",
    "Zico maiores títulos",
    "Estádio do Flamengo Gasômetro",
    "Quantas Libertadores tem o Flamengo"
];

// CARREGAR CHIPS DE SUGESTÃO
function carregarSugestoes() {
    caixaSugestoes.innerHTML = "";
    sugestoesIniciais.forEach(sugestao => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerText = sugestao;
        chip.addEventListener("click", () => {
            campoPergunta.value = sugestao;
            buscarNoDuckDuckGo();
        });
        caixaSugestoes.appendChild(chip);
    });
}

// BUSCA DIRETA NA API DO DUCKDUCKGO (RESPOSTAS INSTANTÂNEAS)
async function buscarNoDuckDuckGo() {
    const termo = campoPergunta.value.trim();

    if (!termo) {
        exibirResposta("Por favor, digite uma pergunta para consultar no DuckDuckGo.", null);
        return;
    }

    // Exibe indicador de carregamento na tela
    caixaResposta.style.display = "block";
    statusTag.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Consultando DuckDuckGo...`;
    textoResposta.innerText = "Buscando resposta diretamente no DuckDuckGo...";
    containerNoticia.style.display = "none";

    try {
        // Formata para garantir o contexto do Flamengo
        const termoBusca = termo.toLowerCase().includes("flamengo") ? termo : `Flamengo ${termo}`;
        
        // Chamada direta à API Instant Answer do DuckDuckGo
        const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(termoBusca)}&format=json&kl=br-pt&no_html=1&skip_disambig=1`;

        const resposta = await fetch(urlDuck);
        const data = await resposta.json();

        // Extrai a resposta da API do DuckDuckGo
        let resumo = data.AbstractText || data.Definition;
        let fonteUrl = data.AbstractURL || (data.Results && data.Results.length > 0 ? data.Results[0].FirstURL : null);

        // Se o DuckDuckGo retornar tópicos relacionados em vez de abstract direto
        if (!resumo && data.RelatedTopics && data.RelatedTopics.length > 0) {
            const primeiroTopico = data.RelatedTopics.find(t => t.Text);
            if (primeiroTopico) {
                resumo = primeiroTopico.Text;
                fonteUrl = primeiroTopico.FirstURL;
            }
        }

        // Se encontrou dados no DuckDuckGo
        if (resumo) {
            statusTag.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Resposta do DuckDuckGo`;
            exibirResposta(resumo, fonteUrl || "https://ge.globo.com/futebol/times/flamengo/");
        } else {
            // Fallback usando a API de busca complementar livre (Wikipedia/GE) se o DuckDuckGo não tiver o Instant Answer
            buscarFallbackWeb(termoBusca);
        }

    } catch (erro) {
        console.error("Erro na consulta do DuckDuckGo:", erro);
        buscarFallbackWeb(termo);
    }
}

// BUSCA SECUNDÁRIA (SE O DUCKDUCKGO NÃO TIVER UM "INSTANT ANSWER" DIRETO PARA O TERMO)
async function buscarFallbackWeb(termo) {
    try {
        const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`;
        const resp = await fetch(urlWiki);

        if (resp.ok) {
            const dataWiki = await resp.json();
            if (dataWiki.extract) {
                statusTag.innerHTML = `<i class="fa-solid fa-globe"></i> Web / DuckDuckGo`;
                exibirResposta(dataWiki.extract, dataWiki.content_urls ? dataWiki.content_urls.desktop.page : "https://ge.globo.com/futebol/times/flamengo/");
                return;
            }
        }

        // Se não houver resumo curto
        statusTag.innerHTML = `<i class="fa-solid fa-newspaper"></i> Notícias e Fontes`;
        exibirResposta(
            `Encontramos referências ativas para "${termo}". Acesse a matéria e fonte oficial completa abaixo.`,
            `https://ge.globo.com/futebol/times/flamengo/`
        );

    } catch (e) {
        statusTag.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Resultado`;
        exibirResposta(
            `A consulta por "${termo}" foi realizada. Acesse as últimas notícias do Flamengo na fonte abaixo.`,
            `https://ge.globo.com/futebol/times/flamengo/`
        );
    }
}

// EXIBE RESULTADO NA INTERFACE
function exibirResposta(texto, urlFonte) {
    // Parar áudio anterior se estiver tocando
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        btnVoz.classList.remove("falando");
    }

    textoResposta.innerText = texto;

    if (urlFonte) {
        linkNoticia.href = urlFonte;
        containerNoticia.style.display = "block";
    } else {
        containerNoticia.style.display = "none";
    }
}

// REPRODUÇÃO DE VOZ POR I.A (SÍNTESE DE VOZ)
function falarResposta() {
    if (!('speechSynthesis' in window)) {
        alert("Navegador sem suporte para leitura por voz.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        btnVoz.classList.remove("falando");
        return;
    }

    const texto = textoResposta.innerText;
    if (!texto) return;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;

    utterance.onstart = () => {
        btnVoz.classList.add("falando");
    };

    utterance.onend = () => {
        btnVoz.classList.remove("falando");
    };

    utterance.onerror = () => {
        btnVoz.classList.remove("falando");
    };

    window.speechSynthesis.speak(utterance);
}

// EVENT LISTENERS
btnPerguntar.addEventListener("click", buscarNoDuckDuckGo);

campoPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        buscarNoDuckDuckGo();
    }
});

btnVoz.addEventListener("click", falarResposta);

// INICIALIZAÇÃO
carregarSugestoes();