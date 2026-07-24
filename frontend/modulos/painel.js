/**
 * Configuração e inicialização do cliente Supabase.
 */
const supabaseUrl = 'https://gxjwjzicymxufkvphsxp.supabase.co';
const supabaseAnonKey = 'sb_publishable_qpnro1yIOnuBsnrsq8nQ-Q_Ml-TVY1B';

const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Inicialização e verificação de sessão ao carregar o painel
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Valida a sessão ativa no Supabase
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error || !session) {
        console.warn("Sessão inválida ou não encontrada. Redirecionando para o login...");
        window.location.replace('/frontend/modulos/login.html');
        return;
    }

    // 2. Extrai dados do usuário logado via Google OAuth
    const user = session.user;
    const email = user.email || 'lojista@minhaloja.click';

    // Formata o nome amigável com base no e-mail
    const displayName = email
        .split('@')[0]
    // const displayName = email
    //     .split('@')[0]
    //     .replace(/\./g, ' ')
    //     .replace(/\b\w/g, c => c.toUpperCase());


    // 3. Preenche o widget de perfil na sidebar lateral
    const nameEl = document.getElementById('user-name-display');
    const roleEl = document.getElementById('user-role-display');
    const avatarEl = document.getElementById('user-avatar-initial');

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = 'Lojista';
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();

    // Atualiza a tela de boas-vindas inicial
    const welcomeTitle = document.getElementById('panel-welcome-title');
    const welcomeDesc = document.getElementById('panel-welcome-desc');
    if (welcomeTitle) welcomeTitle.textContent = `Bem-vindo ao seu Painel, ${displayName}`;
    if (welcomeDesc) welcomeDesc.textContent = `Conta autenticada: ${email}`;

    // Inicializa os ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Inicializa o efeito de partículas na barra lateral
    initParticles();
});

/**
 * Lógica do botão para colapsar/expandir a Sidebar
 */
const toggleBtn = document.getElementById('sidebarToggle');
const appWrapper = document.querySelector('.app-wrapper');

if (toggleBtn && appWrapper) {
    toggleBtn.addEventListener('click', () => {
        appWrapper.classList.toggle('sidebar-collapsed');
        const isCollapsed = appWrapper.classList.contains('sidebar-collapsed');

        const icon = toggleBtn.querySelector('i[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

/**
 * Botão de Logout / Sair
 */
const logoutBtn = document.getElementById('nav-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await _supabase.auth.signOut();
        window.location.replace('/');
    });
}

/**
 * Inicializador do efeito de constelação de partículas
 */
function initParticles() {
    if (typeof particlesJS === 'undefined') return;

    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#38bdf8" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.3, "random": false },
            "size": { "value": 3, "random": true },
            "line_linked": {
                "enable": true,
                "distance": 130,
                "color": "#38bdf8",
                "opacity": 0.12,
                "width": 1
            },
            "move": { "enable": true, "speed": 1, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "grab" }, "resize": true },
            "modes": { "grab": { "distance": 150, "line_linked": { "opacity": 0.3 } } }
        },
        "retina_detect": true
    });
}

/**
 * ============================================================================
 *   ROTEAMENTO SPA E CARREGAMENTO DE MÓDULOS DINÂMICOS
 * ============================================================================
 */
const contentArea = document.getElementById('content-area');
const navItems = document.querySelectorAll('.nav-item');

/**
 * Carrega o conteúdo de um módulo HTML na área principal.
 * @param {string} moduleName O nome do módulo (ex: 'minhaloja').
 */
const loadModule = async (moduleName) => {
    // Mostra um feedback de carregamento
    contentArea.innerHTML = `<p style="text-align: center; color: var(--brand-muted);">Carregando ${moduleName}...</p>`;

    try {
        const response = await fetch(`/frontend/modulos/${moduleName}.html`);
        if (!response.ok) {
            throw new Error(`Módulo não encontrado: ${response.statusText}`);
        }
        const html = await response.text();
        contentArea.innerHTML = html;

        // Após injetar o HTML, carrega e executa o JS do módulo correspondente.
        try {
            const modulePath = `/frontend/modulos/${moduleName}.js`;
            const module = await import(modulePath);

            // Convenção: Mapeia o nome do módulo para sua função de inicialização.
            const initFunctions = {
                'minhaloja': module.initMinhaLoja,
                'produtos': module.initProdutos
            };

            if (initFunctions[moduleName]) {
                // Passa o cliente Supabase para a função de inicialização do módulo.
                initFunctions[moduleName](_supabase);
            }
        } catch (error) {
            // Permite que módulos existam sem um arquivo .js dedicado.
            console.log(`Nenhum script de inicialização encontrado para o módulo '${moduleName}'.`);
        }

    } catch (error) {
        console.error('Falha ao carregar o módulo:', error);
        contentArea.innerHTML = `<div class="text-center" style="padding: 40px;">
            <h2 style="color: var(--brand-dark);">Erro ao carregar</h2>
            <p style="color: var(--brand-muted);">${error.message}</p>
        </div>`;
    }
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove a classe 'active' de todos os itens
        navItems.forEach(nav => nav.classList.remove('active'));
        // Adiciona a classe 'active' ao item clicado
        item.classList.add('active');

        // Extrai o nome do módulo do href (ex: '#minhaloja' -> 'minhaloja')
        const moduleName = item.getAttribute('href').substring(1);

        loadModule(moduleName);
    });
});