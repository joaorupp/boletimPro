// --- LÓGICA MATEMÁTICA ---
const sum = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

const calcularMediaPonderada = (notas) => {
    const totalPesos = sum(notas.map(n => n.peso));
    const totalValor = sum(notas.map(n => n.valor * n.peso));
    return totalPesos === 0 ? 0 : (totalValor / totalPesos);
};

// Define status e cor
const obterStatus = (media, minimo) => {
    if (media >= minimo) return { texto: "Aprovado", cor: "#10b981", class: "status-aprovado" };
    if (media >= 5) return { texto: "Recuperação", cor: "#f59e0b", class: "status-recuperacao" };
    return { texto: "Reprovado", cor: "#ef4444", class: "status-reprovado" };
};

const calcularNotaNecessaria = (notas, mediaAlvo) => {
    const somaAtual = sum(notas.map(n => n.valor * n.peso));
    const pesoAtual = sum(notas.map(n => n.peso));
    const pesoProxima = 1; 
    const notaNecessaria = (mediaAlvo * (pesoAtual + pesoProxima) - somaAtual) / pesoProxima;
    return Math.max(0, notaNecessaria);
};

// --- ESTADO GLOBAL DA APLICAÇÃO ---
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

// --- AÇÕES (ACTIONS) ---
const actions = {
    // 1. Ações do Formulário
    adicionarNotaInput: () => {
        const novaNota = { id: Date.now(), valor: 0, peso: 1 };
        appState.form.notas.push(novaNota);
        renderForm();
    },
    removerNotaInput: (id) => {
        appState.form.notas = appState.form.notas.filter(n => n.id !== id);
        renderForm();
    },
    atualizarNotaInput: (id, campo, valor) => {
        appState.form.notas = appState.form.notas.map(n => 
            n.id === id ? { ...n, [campo]: Number(valor) } : n
        );
        renderResultadoPrevia(); // Atualiza só o preview
    },
    atualizarConfigForm: (campo, valor) => {
        appState.form[campo] = valor;
        renderResultadoPrevia();
    },

    // 2. Ação Principal: SALVAR MATÉRIA
    salvarMateria: () => {
        const nome = document.getElementById('materia-nome').value || "Sem Nome";
        const mediaFinal = calcularMediaPonderada(appState.form.notas);
        const statusObj = obterStatus(mediaFinal, appState.form.mediaMinima);

        const novaMateria = {
            id: Date.now(),
            nome: nome,
            media: mediaFinal,
            status: statusObj.texto,
            numNotas: appState.form.notas.length
        };

        // Salva na lista global
        appState.materiasSalvas.push(novaMateria);
        
        // Reseta o formulário
        appState.form.notas = [{ id: Date.now(), valor: 0, peso: 1 }];
        document.getElementById('materia-nome').value = "";
        
        // Atualiza TUDO
        renderForm();
        renderBoletim();
        renderDashboard(); // <--- AQUI A MÁGICA DOS CARDS ACONTECE
    },

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

// --- RENDERIZAÇÃO (VIEW) ---

// 1. Renderiza os Inputs de Notas (Formulário)
const renderForm = () => {
    const container = document.getElementById('form-lista-notas');
    container.innerHTML = '';
    
    appState.form.notas.forEach(nota => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.marginBottom = '5px';
        
        div.innerHTML = `
            <input type="number" placeholder="Nota" value="${nota.valor}" 
                oninput="actions.atualizarNotaInput(${nota.id}, 'valor', this.value)" style="flex:1;">
            <input type="number" placeholder="Peso" value="${nota.peso}" 
                oninput="actions.atualizarNotaInput(${nota.id}, 'peso', this.value)" style="width: 50px;">
            <button onclick="actions.removerNotaInput(${nota.id})" style="background:#fee2e2; border:none; color:red;">X</button>
        `;
        container.appendChild(div);
    });
    renderResultadoPrevia();
};

// 2. Renderiza o Preview do Cálculo (Embaixo dos inputs)
const renderResultadoPrevia = () => {
    const media = calcularMediaPonderada(appState.form.notas);
    const necessaria = calcularNotaNecessaria(appState.form.notas, appState.form.mediaMinima);
    const painel = document.getElementById('resultado-painel');
    const painelPrev = document.getElementById('painel-previsao');

    painel.innerHTML = `<strong>Média Atual: ${media.toFixed(2)}</strong>`;
    
    if (media < appState.form.mediaMinima) {
        painelPrev.style.display = 'block';
        painelPrev.innerHTML = `Falta para passar: <strong>${necessaria.toFixed(1)}</strong> (na prox. prova)`;
    } else {
        painelPrev.style.display = 'none';
    }
};

// 3. Renderiza a Lista de Matérias (Lado Direito)
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
        
        // Cor do status
        let corStatus = m.status === 'Aprovado' ? 'green' : (m.status === 'Recuperação' ? 'orange' : 'red');

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

// 4. Renderiza o DASHBOARD (Os Cards - Sua Tarefa Principal)
const renderDashboard = () => {
    const materias = appState.materiasSalvas;
    
    // Se não tem matérias, reseta os cards
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
    // Card 1
    document.getElementById('dash-best-value').innerText = melhor.media.toFixed(1);
    document.getElementById('dash-best-name').innerText = melhor.nome;
    
    // Card 2
    document.getElementById('dash-worst-value').innerText = pior.media.toFixed(1);
    document.getElementById('dash-worst-name').innerText = pior.nome;
    
    // Card 3
    document.getElementById('dash-rate-value').innerText = `${taxa}%`;
    document.getElementById('dash-rate-detail').innerText = `${aprovados} de ${materias.length} matérias`;
    
    // Card 4
    document.getElementById('count-aprovado').innerText = aprovados;
    document.getElementById('count-recuperacao').innerText = recuperacao;
    document.getElementById('count-reprovado').innerText = reprovados;
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-add-nota').onclick = actions.adicionarNotaInput;
    document.getElementById('btn-salvar-materia').onclick = actions.salvarMateria;
    
    document.getElementById('media-minima').oninput = (e) => 
        actions.atualizarConfigForm('mediaMinima', Number(e.target.value));

    // Renderiza o estado inicial
    renderForm();
    renderBoletim();
    renderDashboard();
});