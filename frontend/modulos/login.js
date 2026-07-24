/**
 * Configuração e inicialização do cliente Supabase.
 */
const supabaseUrl = 'https://gxjwjzicymxufkvphsxp.supabase.co';
// IMPORTANTE: Substitua pela sua chave pública (anon) do Supabase.
const supabaseAnonKey = 'sb_publishable_qpnro1yIOnuBsnrsq8nQ-Q_Ml-TVY1B';

const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Lógica principal da página de login.
 */
const loginButton = document.getElementById('google-login-btn');
const errorMessageElement = document.getElementById('error-message');

loginButton.addEventListener('click', async () => {
    // Limpa mensagens de erro e desabilita o botão para evitar múltiplos cliques
    errorMessageElement.textContent = '';
    loginButton.disabled = true;
    loginButton.innerHTML = 'Aguarde...';

    // Inicia o fluxo de autenticação OAuth com o Google via Supabase
    const { data, error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // URL para onde o usuário será redirecionado após o login bem-sucedido
            redirectTo: `${window.location.origin}/frontend/modulos/painel.html`
        }
    });

    // Se ocorrer um erro ANTES do redirecionamento, exibe a mensagem
    if (error) {
        console.error('Erro no login com Google:', error.message);
        errorMessageElement.textContent = `Erro: ${error.message}`;
        loginButton.disabled = false;
        loginButton.innerHTML = 'Tentar Novamente';
    }
    // Se não houver erro, o Supabase cuidará do redirecionamento para a página do Google.
});