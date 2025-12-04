// ------------------------------------
// --- 1. LÓGICA MATEMÁTICA E ÚTEIS ---
// ------------------------------------

const sum = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

/**
 * Calcula a média ponderada a partir de um array de notas.
 * @param {Array<{valor: number, peso: number}>} notas 
 * @returns {number} Média ponderada
 */
const calcularMediaPonderada = (notas) => {
    const totalPesos = sum(notas.map(n => n.peso));
    const totalValor = sum(notas.map(n => n.valor * n.peso));
    return totalPesos === 0 ? 0 : (totalValor / totalPesos);
};

/**
 * Define o status (Aprovado, Recuperação, Reprovado) e cores/classes.
 * Usando a versão do primeiro código, que tem classes e cores mais detalhadas.
 * @param {number} media 
 * @param {number} minimo 
 * @returns {{texto: string, cor: string, class: string}} Status da matéria
 */
const obterStatus = (media, minimo) => {
    if (media >= minimo) return { texto: "Aprovado", cor: "#10b981", class: "status-aprovado" };
    if (media >= 5) return { texto: "Recuperação", cor: "#f59e0b", class: "status-recuperacao" };
    return { texto: "Reprovado", cor: "#ef4444", class: "status-reprovado" };
};

/**
 * Calcula a nota necessária na próxima prova (peso 1) para atingir a média alvo.
 * @param {Array<{valor: number, peso: number}>} notas 
 * @param {number} mediaAlvo 
 * @returns {number} Nota necessária (mínimo 0)
 */
const calcularNotaNecessaria = (notas, mediaAlvo) => {
    const somaAtual = sum(notas.map(n => n.valor * n.peso));
    const pesoAtual = sum(notas.map(n => n.peso));
    // Considerando que a próxima nota terá peso 1:
    // Alvo = (Soma + X*1) / (PesoTotal + 1) => X = Alvo*(PesoTotal+1) - Soma
    const notaNecessaria = (mediaAlvo * (pesoAtual + 1) - somaAtual);
    return Math.max(0, notaNecessaria);
};

// ------------------------------------
// --- 2. ESTADO GLOBAL DA APLICAÇÃO ---
// ------------------------------------

let appState = {
    // Estado do Formulário Atual
    form: {
        nome: "",
        mediaMinima: 7,
        notas: [{ id: 1, valor: 0, peso: 1 }]
    },
    // Estado do Banco de Dados (Matérias Salvas)
    materiasSalvas: []
};

// Função de utilidade para forçar limites de nota/peso (0-10)
const forcarLimite = (valor, limiteMax = 10, limiteMin = 0) => {
    let num = parseFloat(valor);
    if (isNaN(num)) return limiteMin; // Caso a string esteja vazia ou inválida
    if (num > limiteMax) return limiteMax;
    if (num < limiteMin) return limiteMin;
    return num;
};

// ------------------------------------
// --- 3. AÇÕES (ACTIONS) ---
// ------------------------------------

const actions = {
    // Ações do Formulário (Form)
    adicionarNotaInput: () => {
        const novaNota = { id: Date.now(), valor: 0, peso: 1 };
        appState.form.notas.push(novaNota);
        render(); // Renderiza tudo
    },

    removerNotaInput: (id) => {
        appState.form.notas = appState.form.notas.filter(n => n.id !== id);
        render();
    },

    // Ação unificada para atualizar nota/peso e aplicar limites
    atualizarNotaInput: (id, campo, valor, inputElement) => {
        let num = forcarLimite(valor, 10, campo === 'peso' ? 1 : 0);
        
        // Se a correção aconteceu, atualiza o campo de input visualmente
        if (inputElement && parseFloat(inputElement.value) !== num) {
             inputElement.value = num;
        }

        appState.form.notas = appState.form.notas.map(n =>
            n.id === id ? { ...n, [campo]: num } : n
        );
        renderResultadoPrevia(); // Atualiza apenas o preview para performance
    },

    // Ação para atualizar nome e mediaMinima
    atualizarConfigForm: (campo, valor) => {
        if (campo === 'nome') {
             appState.form[campo] = valor;
        } else if (campo === 'mediaMinima') {
            appState.form[campo] = forcarLimite(valor, 10, 0);
            document.getElementById('media-minima').value = appState.form[campo]; // Atualiza o input visual
        }
        renderResultadoPrevia();
    },

    // Ação Principal: SALVAR MATÉRIA
    salvarMateria: () => {
        const nomeInput = document.getElementById('materia-nome');
        if (!nomeInput.value.trim()) return alert("Digite o nome da matéria");

        const mediaFinal = calcularMediaPonderada(appState.form.notas);
        const statusObj = obterStatus(mediaFinal, appState.form.mediaMinima);

        const novaMateria = {
            id: Date.now(),
            nome: nomeInput.value.trim(),
            media: mediaFinal,
            status: statusObj.texto,
            numNotas: appState.form.notas.length,
            cor: statusObj.cor // Adiciona a cor para facilitar a renderização do boletim
        };

        // Salva na lista global
        appState.materiasSalvas.push(novaMateria);

        // Reseta o formulário
        appState.form.notas = [{ id: Date.now(), valor: 0, peso: 1 }];
        appState.form.nome = "";
        nomeInput.value = ""; // Limpa o input visualmente

        // Atualiza TUDO
        render();
    },

    // Ações de Matérias Salvas
    removerMateriaSalva: (id) => {
        appState.materiasSalvas = appState.materiasSalvas.filter(m => m.id !== id);
        renderBoletim();
        renderDashboard();
    },

    limparTudo: () => {
        appState.materiasSalvas = [];
        renderBoletim();
        renderDashboard();
    }
};

// ------------------------------------
// --- 4. RENDERIZAÇÃO (VIEW) ---
// ------------------------------------

/**
 * Renderiza os inputs dinâmicos de Notas/Pesos.
 */
const renderForm = () => {
    const container = document.getElementById('form-lista-notas');
    container.innerHTML = '';
    
    // Atualiza os campos estáticos do formulário
    const inputNome = document.getElementById('materia-nome');
    if (document.activeElement !== inputNome) inputNome.value = appState.form.nome;
    document.getElementById('media-minima').value = appState.form.mediaMinima;

    appState.form.notas.forEach(nota => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;';
        
        // Usei a sintaxe mais verbosa de criar elementos para ter o controle do inputElement no actions.atualizarNotaInput
        // INPUT NOTA
        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.placeholder = 'Nota';
        inputNota.value = nota.valor;
        inputNota.min = "0";
        inputNota.max = "10";
        inputNota.style.flex = '1';
        // Passamos o elemento (e.target) para a action poder corrigir o valor visualmente
        inputNota.oninput = (e) => actions.atualizarNotaInput(nota.id, 'valor', e.target.value, e.target);
        
        // INPUT PESO
        const inputPeso = document.createElement('input');
        inputPeso.type = 'number';
        inputPeso.placeholder = 'Peso';
        inputPeso.value = nota.peso;
        inputPeso.min = "1";
        inputPeso.max = "10";
        inputPeso.style.width = '50px';
        inputPeso.oninput = (e) => actions.atualizarNotaInput(nota.id, 'peso', e.target.value, e.target);
        
        // BOTÃO REMOVER
        const btnDel = document.createElement('button');
        btnDel.innerText = 'X';
        btnDel.type = 'button';
        btnDel.style.cssText = 'background:#fee2e2; border:none; color:red; cursor:pointer;';
        btnDel.onclick = () => actions.removerNotaInput(nota.id);

        div.append(inputNota, inputPeso, btnDel);
        container.appendChild(div);
    });

    renderResultadoPrevia();
};

/**
 * Renderiza o Preview do Cálculo (Média Atual e Nota Necessária).
 */
const renderResultadoPrevia = () => {
    const media = calcularMediaPonderada(appState.form.notas);
    const status = obterStatus(media, appState.form.mediaMinima);
    const necessaria = calcularNotaNecessaria(appState.form.notas, appState.form.mediaMinima);
    
    const painel = document.getElementById('resultado-painel');
    const divPrev = document.getElementById('painel-previsao');

    painel.innerHTML = `Média: <strong style="color: ${status.cor};">${media.toFixed(2)}</strong> <br>
                        <span style="color:${status.cor}">${status.texto}</span>`;
    
    // Exibe ou oculta a nota necessária
    if (media < appState.form.mediaMinima) {
        divPrev.style.display = 'block';
        divPrev.innerHTML = `Falta para passar: <strong>${necessaria.toFixed(1)}</strong> (na prox. prova)`;
    } else {
        divPrev.style.display = 'none';
    }
};


/**
 * Renderiza a Lista de Matérias Salvas (Boletim).
 */
const renderBoletim = () => {
    const container = document.getElementById('lista-boletim');
    if (appState.materiasSalvas.length === 0) {
        container.innerHTML = '<p style="color: #888;">Nenhuma matéria cadastrada.</p>';
        return;
    }

    container.innerHTML = '';
    appState.materiasSalvas.forEach(m => {
        const item = document.createElement('div');
        // Estilo inline básico para parecer uma lista
        item.style.cssText = "background: white; border: 1px solid #eee; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-radius: 4px;";
        
        const corStatus = m.cor; // Já salvo no objeto da matéria
        
        item.innerHTML = `
            <div>
                <strong>${m.nome}</strong><br>
                <small>${m.numNotas} notas lançadas</small>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.2em; font-weight: bold; color: ${corStatus}">${m.media.toFixed(1)}</div>
                <small style="color: ${corStatus}">${m.status}</small>
            </div>
            <button onclick="actions.removerMateriaSalva(${m.id})" style="margin-left: 10px; background: none; border: none; cursor: pointer;">🗑️</button>
        `;
        container.appendChild(item);
    });
};

/**
 * Renderiza o DASHBOARD (Os Cards de Melhores/Piores Médias, Taxa de Aprovação).
 */
const renderDashboard = () => {
    const materias = appState.materiasSalvas;
    
    // Reset se não houver matérias
    if (materias.length === 0) {
        document.getElementById('dash-best-value').innerText = "--";
        document.getElementById('dash-best-name').innerText = "Nenhuma matéria";
        document.getElementById('dash-worst-value').innerText = "--";
        document.getElementById('dash-worst-name').innerText = "Nenhuma matéria";
        document.getElementById('dash-rate-value').innerText = "0%";
        document.getElementById('dash-rate-detail').innerText = "0 de 0 matérias";
        document.getElementById('count-aprovado').innerText = "0";
        document.getElementById('count-recuperacao').innerText = "0";
        document.getElementById('count-reprovado').innerText = "0";
        return;
    }

    // Cálculos
    const melhor = materias.reduce((prev, curr) => (prev.media > curr.media) ? prev : curr);
    const pior = materias.reduce((prev, curr) => (prev.media < curr.media) ? prev : curr);
    
    const aprovados = materias.filter(m => m.status === 'Aprovado').length;
    const recuperacao = materias.filter(m => m.status === 'Recuperação').length;
    const reprovados = materias.filter(m => m.status === 'Reprovado').length;
    const taxa = Math.round((aprovados / materias.length) * 100);

    // Atualiza HTML
    document.getElementById('dash-best-value').innerText = melhor.media.toFixed(1);
    document.getElementById('dash-best-name').innerText = melhor.nome;
    
    document.getElementById('dash-worst-value').innerText = pior.media.toFixed(1);
    document.getElementById('dash-worst-name').innerText = pior.nome;
    
    document.getElementById('dash-rate-value').innerText = `${taxa}%`;
    document.getElementById('dash-rate-detail').innerText = `${aprovados} de ${materias.length} matérias`;
    
    document.getElementById('count-aprovado').innerText = aprovados;
    document.getElementById('count-recuperacao').innerText = recuperacao;
    document.getElementById('count-reprovado').innerText = reprovados;
};

// Função principal de renderização que chama todas as outras
const render = () => {
    renderForm(); // Renderiza o formulário e o preview
    renderBoletim();
    renderDashboard();
};

// ------------------------------------
// --- 5. INICIALIZAÇÃO ---
// ------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Liga os botões/inputs do formulário principal
    document.getElementById('btn-add-nota').onclick = actions.adicionarNotaInput;
    document.getElementById('btn-salvar-materia').onclick = actions.salvarMateria;
    
    // Inputs estáticos (Nome e Média Mínima)
    document.getElementById('materia-nome').oninput = (e) => 
        actions.atualizarConfigForm('nome', e.target.value);
    
    document.getElementById('media-minima').oninput = (e) => 
        actions.atualizarConfigForm('mediaMinima', e.target.value);
        
    // 2. Renderiza o estado inicial
    render();
});