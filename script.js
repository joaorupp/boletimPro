

// Soma simples de array
const sum = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

// Calcula média ponderada: (n1*p1 + n2*p2) / (p1+p2)
const calcularMediaPonderada = (notas) => {
    const totalPesos = sum(notas.map(n => n.peso));
    const totalValor = sum(notas.map(n => n.valor * n.peso));
    return totalPesos === 0 ? 0 : (totalValor / totalPesos);
};

// Determina o status baseado na média e na regra de negócio
const obterStatus = (media, minimo) => {
    if (media >= minimo) return { texto: "Aprovado", cor: "green", icon: "🟢" };
    if (media >= 5) return { texto: "Recuperação", cor: "orange", icon: "🟠" };
    return { texto: "Reprovado", cor: "red", icon: "🔴" };
};

// Calcula quanto falta para passar (assumindo peso 1 para a próxima prova)
const calcularNotaNecessaria = (notas, mediaAlvo) => {
    const somaAtual = sum(notas.map(n => n.valor * n.peso));
    const pesoAtual = sum(notas.map(n => n.peso));
    const pesoProxima = 1; // Assumimos peso 1 para a próxima prova
    
    // Fórmula inversa da média ponderada
    // Alvo = (SomaAtual + X * PesoProx) / (PesoAtual + PesoProx)
    const notaNecessaria = (mediaAlvo * (pesoAtual + pesoProxima) - somaAtual) / pesoProxima;
    
    return Math.max(0, notaNecessaria); // Não retorna negativo
};


/**
 * ------------------------------------------------
 * 2. STATE MANAGEMENT (Gerenciamento de Estado)
 * O Estado é imutável. As ações criam um NOVO estado.
 * ------------------------------------------------
 */

// Estado inicial
let state = {
    mediaMinima: 7,
    notas: [
        { id: 1, valor: 0, peso: 1 },
        { id: 2, valor: 0, peso: 1 }
    ]
};

// Função "Reducer"-like para atualizar o estado
const setState = (newState) => {
    state = { ...state, ...newState }; // Merge do estado antigo com o novo
    render(); // A UI reage à mudança de estado
};

// Actions (Ações do usuário)
const actions = {
    adicionarNota: () => {
        const novaNota = { id: Date.now(), valor: 0, peso: 1 };
        setState({ notas: [...state.notas, novaNota] });
    },

    removerNota: (idParaRemover) => {
        // Filter cria um novo array sem o item removido (imutabilidade)
        setState({ notas: state.notas.filter(n => n.id !== idParaRemover) });
    },

    atualizarNota: (id, campo, valor) => {
        // Map cria um novo array com o item modificado
        const notasAtualizadas = state.notas.map(nota => 
            nota.id === id ? { ...nota, [campo]: Number(valor) } : nota
        );
        setState({ notas: notasAtualizadas });
    },

    atualizarMediaMinima: (valor) => {
        setState({ mediaMinima: Number(valor) });
    }
};


/**
 * ------------------------------------------------
 * 3. VIEW / DOM (Efeitos Colaterais)
 * Renderiza o HTML baseado puramente no Estado atual.
 * ------------------------------------------------
 */

const renderListaNotas = () => {
    const container = document.getElementById('lista-notas');
    container.innerHTML = ''; // Limpa para redesenhar

    state.notas.forEach(nota => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        
        // Input Nota
        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.placeholder = 'Nota';
        inputNota.value = nota.valor;
        inputNota.oninput = (e) => actions.atualizarNota(nota.id, 'valor', e.target.value);

        // Input Peso
        const inputPeso = document.createElement('input');
        inputPeso.type = 'number';
        inputPeso.placeholder = 'Peso';
        inputPeso.value = nota.peso;
        inputPeso.style.marginLeft = '5px';
        inputPeso.oninput = (e) => actions.atualizarNota(nota.id, 'peso', e.target.value);

        // Botão Remover
        const btnDelete = document.createElement('button');
        btnDelete.innerText = '🗑️';
        btnDelete.type = 'button';
        btnDelete.style.marginLeft = '5px';
        btnDelete.onclick = () => actions.removerNota(nota.id);

        div.append(inputNota, inputPeso, btnDelete);
        container.appendChild(div);
    });
};

const renderResultados = () => {
    const media = calcularMediaPonderada(state.notas);
    const status = obterStatus(media, state.mediaMinima);
    const necessaria = calcularNotaNecessaria(state.notas, state.mediaMinima);

    // Atualiza Painel de Status
    const painel = document.getElementById('resultado-painel');
    painel.innerHTML = `
        <div style="font-family: sans-serif;">
            <div style="font-size: 1.2em; margin-bottom: 5px;">Média Atual: <strong>${media.toFixed(2)}</strong></div>
            <div style="color: ${status.cor}; font-weight: bold;">
                ${status.icon} ${status.texto}
            </div>
        </div>
    `;

    // Atualiza Painel de Previsão ("Quanto preciso tirar")
    const painelPrev = document.getElementById('painel-previsao');
    const textoPrev = document.getElementById('texto-previsao');
    
    // Só mostra a previsão se ainda não passou
    if (media < state.mediaMinima) {
        painelPrev.style.display = 'block';
        textoPrev.innerHTML = `Para atingir ${state.mediaMinima}, sua próxima nota (peso 1) precisa ser: <strong>${necessaria.toFixed(1)}</strong>`;
    } else {
        painelPrev.style.display = 'none';
    }
};

// Função principal de renderização
const render = () => {
    renderListaNotas();
    renderResultados();
};

// Inicialização (Setup dos listeners globais)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-add').onclick = actions.adicionarNota;
    document.getElementById('media-minima').oninput = (e) => actions.atualizarMediaMinima(e.target.value);
    
    // Renderiza a primeira vez
    render();
});