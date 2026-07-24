/**
 * Lógica do Módulo Minha Loja
 */
export async function initMinhaLoja(supabaseClient) {
    const form = document.getElementById('store-form');
    const saveButton = document.getElementById('save-store-button');
    const feedbackEl = document.getElementById('store-feedback');
    const logoFileInput = document.getElementById('logo_file');
    const logoUrlInput = document.getElementById('logo_url');
    const logoPreview = document.getElementById('logo-preview');
    const logoPlaceholder = document.getElementById('logo-placeholder-text');
    const plansContainer = document.getElementById('plans-container');

    if (!supabaseClient) {
        console.error('Cliente Supabase não fornecido.');
        if (feedbackEl) feedbackEl.textContent = 'Erro de configuração do Supabase.';
        return;
    }

    // 1. Obter sessão ativa
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
        if (feedbackEl) {
            feedbackEl.textContent = 'Sessão inválida. Faça login novamente.';
            feedbackEl.className = 'text-red-500';
        }
        if (saveButton) saveButton.disabled = true;
        return;
    }
    const user = session.user;

    // Função para atualizar a pré-visualização do logotipo
    const updatePreview = (url) => {
        if (url) {
            logoPreview.src = url;
            logoPreview.style.display = 'block';
            logoPlaceholder.style.display = 'none';
        } else {
            logoPreview.style.display = 'none';
            logoPlaceholder.style.display = 'block';
        }
    };

    // 2. Renderiza os planos dinamicamente
    const renderPlans = (plans, currentPlanName) => {
        plansContainer.innerHTML = ''; // Limpa o container

        plans.forEach(plan => {
            const isPro = plan.name.toLowerCase() === 'pro';
            const isChecked = plan.name.toLowerCase() === (currentPlanName || 'pro').toLowerCase();

            const itemsHtml = plan.items
                .split(',')
                .map(item => item.trim())
                .filter(item => item)
                .map(item => `<li>✓ ${item}</li>`).join('');

            const planCard = document.createElement('label');
            planCard.style = `border: 2px solid ${isPro ? '#3b82f6' : '#e2e8f0'}; border-radius: 12px; padding: 20px; cursor: pointer; position: relative; background: ${isPro ? '#f8fafc' : '#fff'}; display: flex; flex-direction: column; justify-content: space-between; ${isPro ? 'box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);' : ''}`;

            planCard.innerHTML = `
                ${isPro ? '<span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: #fff; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 10px; border-radius: 20px; letter-spacing: 0.5px;">Mais Popular</span>' : ''}
                <input type="radio" name="plan" value="${plan.name}" style="position: absolute; top: 16px; right: 16px; accent-color: ${isPro ? '#3b82f6' : '#0F172A'};" ${isChecked ? 'checked' : ''}>
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--brand-dark); margin-bottom: 4px; ${isPro ? 'margin-top: 4px;' : ''}">${plan.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--brand-muted); margin-bottom: 12px;">${plan.description}</p>
                    <div style="font-size: 1.5rem; font-weight: 800; color: ${isPro ? '#3b82f6' : 'var(--brand-dark)'}; margin-bottom: 16px;">
                        ${plan.price.split('/')[0]}<span style="font-size: 0.8rem; font-weight: 400; color: #64748B;">/${plan.price.split('/')[1] || 'mês'}</span>
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: #475569; display: flex; flex-direction: column; gap: 6px;">
                        ${itemsHtml}
                    </ul>
                </div>
            `;
            plansContainer.appendChild(planCard);
        });
    };

    // 3. Carregar dados da loja e dos planos
    const loadInitialData = async () => {
        const storePromise = supabaseClient
            .from('tb_store')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        const plansPromise = supabaseClient
            .from('tb_plans')
            .select('*')
            .order('sort_order', { ascending: true });

        const [{ data: storeData, error: storeError }, { data: plans, error: plansError }] = await Promise.all([storePromise, plansPromise]);

        if (storeError) {
            console.error('Erro ao buscar dados da loja:', storeError);
            if (feedbackEl) {
                feedbackEl.textContent = 'Falha ao carregar dados da loja.';
                feedbackEl.className = 'text-red-500';
            }
        }

        if (plansError) {
            console.error('Erro ao buscar planos:', plansError);
            plansContainer.innerHTML = '<p class="text-red-500">Erro ao carregar planos.</p>';
        } else if (!plans || plans.length === 0) {
            console.warn('Nenhum plano encontrado na tabela "tb_plans".');
            plansContainer.innerHTML = '<p class="text-yellow-600">Nenhum plano de assinatura foi configurado no sistema.</p>';
        } else {
            const currentPlan = storeData ? storeData.plan : 'Pro'; // Default to Pro if no store data
            renderPlans(plans, currentPlan);
        }

        if (storeData) {
            document.getElementById('store_name').value = storeData.store_name || '';
            document.getElementById('slug').value = storeData.slug || '';
            document.getElementById('whatsapp_number').value = storeData.whatsapp_number || storeData.whatsapp || '';
            document.getElementById('description').value = storeData.description || '';
            logoUrlInput.value = storeData.logo_url || '';
            updatePreview(storeData.logo_url);
        }
    };

    await loadInitialData();

    /**
     * Exibe um modal de sucesso.
     * @param {string} title O título do modal.
     * @param {string} message A mensagem a ser exibida no corpo do modal.
     */
    function showSuccessModal(title, message) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.display = 'flex';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div style="text-align: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#13c740" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style="margin-top: 0; color: var(--brand-dark);">${title}</h2>
                <p style="color: var(--brand-muted);">${message}</p>
            </div>
            <div class="modal-actions" style="justify-content: center;">
                <button id="modal-close-btn" class="button-primary">Fechar</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        const closeButton = document.getElementById('modal-close-btn');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
    }

    // 4. Submissão e Salvamento (com Upload de Imagem e Planos)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveButton.disabled = true;
        saveButton.textContent = 'Salvando...';
        if (feedbackEl) feedbackEl.textContent = '';

        let finalLogoUrl = logoUrlInput.value;

        // Se um novo arquivo de imagem foi selecionado, faz o upload para o bucket do Supabase Storage
        if (logoFileInput.files && logoFileInput.files[0]) {
            const file = logoFileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('minhaloja-saas_assets') // CORREÇÃO: Alinhado com o bucket usado em 'produtos.js'
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) {
                console.error('Erro no upload da imagem:', uploadError);
                if (feedbackEl) {
                    feedbackEl.textContent = `Erro no upload: ${uploadError.message}`;
                    feedbackEl.className = 'text-red-500';
                }
                saveButton.disabled = false;
                saveButton.textContent = 'Salvar Alterações';
                return;
            }

            // Obtém a URL pública do arquivo enviado
            const { data: publicUrlData } = supabaseClient.storage
                .from('minhaloja-saas_assets')
                .getPublicUrl(filePath);

            finalLogoUrl = publicUrlData.publicUrl;
            logoUrlInput.value = finalLogoUrl;
        }

        const formData = new FormData(form);
        const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'Pro';

        const storeData = {
            user_id: user.id,
            store_name: formData.get('store_name'),
            slug: formData.get('slug'),
            whatsapp_number: formData.get('whatsapp_number'),
            description: formData.get('description'),
            logo_url: finalLogoUrl,
            plan: selectedPlan, // Salva o plano selecionado na tabela
            updated_at: new Date()
        };

        const { error } = await supabaseClient
            .from('tb_store')
            .upsert(storeData, { onConflict: 'user_id' });

        saveButton.disabled = false;
        saveButton.textContent = 'Salvar Alterações';

        if (error) {
            console.error('Erro ao salvar loja:', error);
            if (feedbackEl) {
                feedbackEl.textContent = `Erro ao salvar: ${error.message}`;
                feedbackEl.className = 'text-red-500';
            }
        } else {
            updatePreview(finalLogoUrl);
            showSuccessModal('Loja Salva!', 'As informações da sua loja foram atualizadas com sucesso.');
        }
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}