/**
 * Lógica do Módulo de Gestão de Produtos
 */
export async function initProdutos(supabaseClient) {
    // Elementos do DOM
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const cancelBtn = document.getElementById('cancel-product-btn');
    const saveButton = document.getElementById('save-product-button');
    const feedbackEl = document.getElementById('product-feedback');
    const modalTitle = document.getElementById('modal-title');
    const listContainer = document.getElementById('products-list-container');
    const loadingFeedback = document.getElementById('products-loading-feedback');
    const imageFileInput = document.getElementById('image_file');
    const imagePreview = document.getElementById('image-preview');
    const addVariationBtn = document.getElementById('add-variation-btn');
    const variationsContainer = document.getElementById('variations-container');

    let currentStoreId = null;

    if (!supabaseClient) {
        loadingFeedback.textContent = 'Erro crítico: Cliente Supabase não encontrado.';
        return;
    }

    // 1. Obter sessão e ID da loja
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
        loadingFeedback.textContent = 'Sessão inválida. Por favor, faça login novamente.';
        return;
    }
    const user = session.user;

    // Busca o store_id correspondente ao user_id
    const { data: storeData, error: storeError } = await supabaseClient
        .from('tb_store')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (storeError || !storeData) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background-color: #fff8e1; border-radius: 8px;">
                <h3 style="color: #f57f17;">Atenção!</h3>
                <p style="color: var(--brand-muted);">Você precisa primeiro configurar as informações da sua loja na seção "Minha Loja" para poder cadastrar produtos.</p>
            </div>`;
        addProductBtn.disabled = true;
        return;
    }
    currentStoreId = storeData.id;

    /**
     * Formata um número para o padrão de moeda BRL (Real).
     * @param {number} value O valor a ser formatado.
     * @returns {string} O valor formatado como R$ XX,XX.
     */
    const formatCurrency = (value) => {
        if (typeof value !== 'number') {
            return 'R$ 0,00';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    /**
     * Carrega e renderiza a lista de produtos da loja.
     */
    const loadProducts = async () => {
        loadingFeedback.textContent = 'Carregando produtos...';

        const { data: products, error } = await supabaseClient
            .from('tb_products')
            .select('*')
            .eq('store_id', currentStoreId)
            .order('created_at', { ascending: false });

        if (error) {
            loadingFeedback.textContent = `Erro ao carregar produtos: ${error.message}`;
            return;
        }

        if (products.length === 0) {
            loadingFeedback.textContent = 'Nenhum produto cadastrado ainda.';
            listContainer.innerHTML = '<p style="text-align: center; color: var(--brand-muted);">Clique em "Novo Produto" para começar.</p>';
            return;
        }

        // Limpa o container e o feedback
        listContainer.innerHTML = '';
        loadingFeedback.style.display = 'none';

        const table = document.createElement('table');
        table.className = 'temp-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Imagem</th>
                    <th>Título</th>
                    <th>Preço</th>
                    <th style="text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${product.image_url || 'https://via.placeholder.com/60'}" alt="${product.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: 500;">${product.title}</td>
                <td>${formatCurrency(product.price)}</td>
                <td class="actions-cell" style="text-align: right;">
                    <button class="edit-btn" data-id="${product.id}" title="Editar Produto" style="background: none; border: none; cursor: pointer; margin-right: 8px;"><i data-lucide="file-pen-line"></i></button>
                    <button class="delete-btn" data-id="${product.id}" title="Excluir Produto" style="background: none; border: none; cursor: pointer;"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbody.appendChild(tr);

            // Event Listeners para Ações
            tr.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(product));
            tr.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(product.id, product.title));
        });

        listContainer.appendChild(table);
        lucide.createIcons();
    };

    /**
     * Adiciona uma nova linha de input para variações no DOM.
     * @param {string} value O valor para preencher o input (usado na edição).
     */
    const addVariationRow = (value = '') => {
        const variationRow = document.createElement('div');
        variationRow.style.display = 'flex';
        variationRow.style.gap = '8px';
        variationRow.style.alignItems = 'center';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'variation-input';
        input.placeholder = 'Ex: Azul';
        input.value = value;
        input.style.flexGrow = '1';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i data-lucide="minus-circle" style="width: 18px; height: 18px; color: #ef4444;"></i>';
        removeBtn.style.background = 'none';
        removeBtn.style.border = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = () => variationRow.remove();

        variationRow.appendChild(input);
        variationRow.appendChild(removeBtn);
        variationsContainer.appendChild(variationRow);
        lucide.createIcons();
    };

    /**
     * Abre o modal para edição, preenchendo o formulário com dados do produto.
     * @param {object} product O objeto do produto a ser editado.
     */
    const openModalForEdit = (product) => {
        productForm.reset();
        variationsContainer.innerHTML = ''; // Limpa variações antigas
        feedbackEl.textContent = '';
        modalTitle.textContent = 'Editar Produto';
        document.getElementById('product_id').value = product.id;
        document.getElementById('title').value = product.title;
        document.getElementById('price').value = product.price;
        document.getElementById('image_url').value = product.image_url || '';

        document.getElementById('description').value = product.description || '';
        // Exibe a imagem atual e o preview
        if (product.image_url) {
            imagePreview.src = product.image_url;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }

        // Recria os inputs de variação
        if (product.items) {
            const items = product.items.split(',').map(item => item.trim());
            items.forEach(item => {
                if (item) addVariationRow(item);
            });
        }

        productModal.style.display = 'flex';
    };

    /**
     * Exclui um produto após confirmação.
     * @param {string} productId O ID do produto a ser excluído.
     * @param {string} productTitle O nome do produto para a mensagem de confirmação.
     */
    const deleteProduct = async (productId, productTitle) => {
        if (confirm(`Tem certeza que deseja excluir o produto "${productTitle}"? Esta ação não pode ser desfeita.`)) {
            const { error } = await supabaseClient
                .from('tb_products')
                .delete()
                .eq('id', productId);

            if (error) {
                alert(`Erro ao excluir produto: ${error.message}`);
            } else {
                // Poderia usar um modal de sucesso mais elegante aqui
                alert('Produto excluído com sucesso!');
                loadProducts();
            }
        }
    };

    // Abre o modal para um novo produto
    addProductBtn.addEventListener('click', () => {
        productForm.reset();
        variationsContainer.innerHTML = '';
        feedbackEl.textContent = '';
        modalTitle.textContent = 'Novo Produto';
        imagePreview.style.display = 'none';
        addVariationRow(); // Adiciona uma linha de variação em branco para começar
        productModal.style.display = 'flex';
    });

    // Fecha o modal
    cancelBtn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    // Adiciona nova linha de variação
    addVariationBtn.addEventListener('click', () => addVariationRow());

    // Preview da imagem ao selecionar um arquivo
    imageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Lógica de submissão do formulário (INSERT/UPDATE)
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveButton.disabled = true;

        const formData = new FormData(productForm);
        const productId = formData.get('product_id');
        const imageFile = imageFileInput.files[0];
        let imageUrl = document.getElementById('image_url').value; // URL existente

        // 1. Se uma nova imagem foi selecionada, faça o upload primeiro
        if (imageFile) {
            saveButton.textContent = 'Enviando imagem...';
            const filePath = `public/${currentStoreId}/${Date.now()}-${imageFile.name}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('minhaloja-saas_assets')
                .upload(filePath, imageFile);

            if (uploadError) {
                feedbackEl.textContent = `Erro no upload: ${uploadError.message}`;
                feedbackEl.style.color = 'red';
                saveButton.disabled = false;
                saveButton.textContent = 'Salvar';
                return;
            }

            // Obtenha a URL pública do arquivo recém-enviado
            const { data: urlData } = supabaseClient.storage
                .from('minhaloja-saas_assets')
                .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
        }

        saveButton.textContent = 'Salvando...';

        // Coleta as variações, remove vazias e junta em uma string
        const variationInputs = variationsContainer.querySelectorAll('.variation-input');
        const items = Array.from(variationInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '')
            .join(', ');

        const productData = {
            store_id: currentStoreId,
            title: formData.get('title'),
            price: parseFloat(formData.get('price')),
            image_url: imageUrl,
            description: formData.get('description'),
            items: items,
        };


        let result;
        if (productId) {
            // UPDATE
            result = await supabaseClient.from('tb_products').update(productData).eq('id', productId);
        } else {
            // INSERT
            result = await supabaseClient.from('tb_products').insert(productData);
        }

        saveButton.disabled = false;
        saveButton.textContent = 'Salvar';

        if (result.error) {
            feedbackEl.textContent = `Erro: ${result.error.message}`;
            feedbackEl.style.color = 'red';
        } else {
            productModal.style.display = 'none';
            loadProducts();
        }
    });

    // Carregamento inicial
    await loadProducts();
    lucide.createIcons();
}