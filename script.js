// --- 1. LÓGICA MATEMÁTICA ---
const sum = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

const calcularMediaPonderada = (notas) => {
    const totalPesos = sum(notas.map(n => n.peso));
    const totalValor = sum(notas.map(n => n.valor * n.peso));
    return totalPesos === 0 ? 0 : (totalValor / totalPesos);
};

const obterStatus = (media, minimo) => {
    if (media >= minimo) return { texto: "Aprovado", cor: "green" };
    if (media >= 5) return { texto: "Recuperação", cor: "orange" };
    return { texto: "Reprovado", cor: "red" };
};

const calcularNotaNecessaria = (notas, mediaAlvo) => {
    const somaAtual = sum(notas.map(n => n.valor * n.peso));
    const pesoAtual = sum(notas.map(n => n.peso));
    // Alvo = (Soma + X*1) / (PesoTotal + 1) => X = Alvo*(PesoTotal+1) - Soma
    const notaNecessaria = (mediaAlvo * (pesoAtual + 1) - somaAtual);
    return Math.max(0, notaNecessaria);
};

// --- 2. ESTADO ---
let state = {
    nomeMateria: "",
    mediaMinima: 7,
    notas: [{ id: 1, valor: 0, peso: 1 }],
    materiasSalvas: [] 
};

const setState = (newState) => {
    state = { ...state, ...newState };
    render();
};

// --- 3. AÇÕES ---
const actions = {
    atualizarNome: (txt) => setState({ nomeMateria: txt }),
    
    atualizarMediaMinima: (val) => {
        let v = parseFloat(val);
        if (v > 10) v = 10; // Limite JS
        setState({ mediaMinima: v });
    },

    adicionarNota: () => {
        setState({ notas: [...state.notas, { id: Date.now(), valor: 0, peso: 1 }] });
    },

    removerNota: (id) => {
        setState({ notas: state.notas.filter(n => n.id !== id) });
    },

    atualizarNota: (id, campo, valor, inputElement) => {
        let num = parseFloat(valor);
        
        // --- TRAVA DE LIMITE (O SEGREDO) ---
        // Se o usuário digitou > 10, forçamos o valor para 10
        if (num > 10) {
            num = 10;
            inputElement.value = 10; // Atualiza o visual na hora
        }
        if (num < 0) {
            num = 0;
            inputElement.value = 0;
        }
        // -----------------------------------

        const notasAtualizadas = state.notas.map(nota => 
            nota.id === id ? { ...nota, [campo]: num } : nota
        );
        setState({ notas: notasAtualizadas });
    },

    salvarMateria: () => {
        if (!state.nomeMateria.trim()) return alert("Digite o nome da matéria");
        
        const media = calcularMediaPonderada(state.notas);
        const status = obterStatus(media, state.mediaMinima);

        setState({
            materiasSalvas: [...state.materiasSalvas, {
                id: Date.now(),
                nome: state.nomeMateria,
                media, status
            }],
            // Reset
            nomeMateria: "",
            mediaMinima: 7,
            notas: [{ id: Date.now(), valor: 0, peso: 1 }]
        });
    },

    removerSalva: (id) => {
        setState({ materiasSalvas: state.materiasSalvas.filter(m => m.id !== id) });
    }
};

// --- 4. RENDERIZAÇÃO ---
const renderFormulario = () => {
    // Inputs Estáticos
    const inputNome = document.getElementById('input-nome');
    if (document.activeElement !== inputNome) inputNome.value = state.nomeMateria;
    document.getElementById('media-minima').value = state.mediaMinima;

    // Inputs Dinâmicos (Notas)
    const container = document.getElementById('lista-notas');
    container.innerHTML = ''; 

    state.notas.forEach(nota => {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        
        // INPUT NOTA
        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.placeholder = 'Nota';
        inputNota.style.width = '100px';
        
        // LIMITES HTML
        inputNota.min = "0";
        inputNota.max = "10";
        
        inputNota.value = nota.valor;
        // Passamos o próprio elemento (e.target) para a action poder corrigir o valor visualmente
        inputNota.oninput = (e) => actions.atualizarNota(nota.id, 'valor', e.target.value, e.target);

        // INPUT PESO
        const inputPeso = document.createElement('input');
        inputPeso.type = 'number';
        inputPeso.placeholder = 'Peso';
        inputPeso.style.width = '60px';
        inputPeso.style.marginLeft = '5px';
        
        // LIMITES HTML
        inputPeso.min = "1";
        inputPeso.max = "10";
        
        inputPeso.value = nota.peso;
        inputPeso.oninput = (e) => actions.atualizarNota(nota.id, 'peso', e.target.value, e.target);

        // BOTÃO REMOVER
        const btnDel = document.createElement('button');
        btnDel.innerText = 'X';
        btnDel.type = 'button';
        btnDel.style.marginLeft = '5px';
        btnDel.onclick = () => actions.removerNota(nota.id);

        div.append(inputNota, inputPeso, btnDel);
        container.appendChild(div);
    });
};

const renderResultados = () => {
    const media = calcularMediaPonderada(state.notas);
    const status = obterStatus(media, state.mediaMinima);
    const necessaria = calcularNotaNecessaria(state.notas, state.mediaMinima);

    // Painel Status
    const painel = document.getElementById('resultado-painel');
    painel.innerHTML = `Média: <strong>${media.toFixed(2)}</strong> <br> 
                        <span style="color:${status.cor}">${status.texto}</span>`;

    // Painel Previsão
    const divPrev = document.getElementById('painel-previsao');
    if (media < state.mediaMinima && state.notas.length > 0) {
        divPrev.style.display = 'block';
        document.getElementById('texto-previsao').innerText = necessaria.toFixed(1);
    } else {
        divPrev.style.display = 'none';
    }
};

const renderSalvas = () => {
    const lista = document.getElementById('lista-salvas');
    lista.innerHTML = '';
    if (state.materiasSalvas.length === 0) {
        lista.innerHTML = '<li>Nenhuma matéria salva.</li>';
        return;
    }
    state.materiasSalvas.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${m.nome}</strong>: ${m.media.toFixed(1)} 
                        <button onclick="actions.removerSalva(${m.id})" style="margin-left:10px; cursor:pointer;">x</button>`;
        lista.appendChild(li);
    });
};

const render = () => {
    renderFormulario();
    renderResultados();
    renderSalvas();
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-add').onclick = actions.adicionarNota;
    document.getElementById('btn-salvar').onclick = actions.salvarMateria;
    document.getElementById('input-nome').oninput = (e) => actions.atualizarNome(e.target.value);
    document.getElementById('media-minima').oninput = (e) => actions.atualizarMediaMinima(e.target.value);
    render();
});