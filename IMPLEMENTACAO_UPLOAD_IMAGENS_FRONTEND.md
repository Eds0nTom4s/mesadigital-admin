# Implementação de Upload de Imagens no Frontend

**Data:** 23 de Fevereiro de 2026  
**Módulo:** Produtos  
**Funcionalidade:** Upload de imagens para MinIO/S3

---

## 📦 Arquivos Criados/Modificados

### ✅ Novos Arquivos

1. **`src/components/produtos/ImageUpload.vue`**
   - Componente reutilizável de upload de imagens
   - Preview da imagem
   - Validações de tamanho e formato
   - Progress bar
   - Ações: upload, trocar e remover imagem

### ✏️ Arquivos Modificados

1. **`src/services/produtosService.js`**
   - Adicionado `uploadImagem(id, file)`
   - Adicionado `removerImagem(id)`

2. **`src/modules/produtos/ProdutosView.vue`**
   - Importado componente `ImageUpload`
   - Substituído input de URL por componente de upload
   - Adicionados handlers: `handleUploadSuccess`, `handleUploadError`, `handleRemoveSuccess`

---

## 🎨 Componente ImageUpload

### Props

```javascript
{
  modelValue: String,      // URL da imagem atual
  produtoId: Number,       // ID do produto (null se ainda não criado)
  imageAlt: String,        // Texto alternativo
  disabled: Boolean        // Desabilitar upload
}
```

### Events

```javascript
emit('update:modelValue', url)  // URL da nova imagem
emit('upload-success', url)     // Upload completado
emit('upload-error', error)     // Erro no upload
emit('remove-success')          // Remoção completada
```

### Validações Implementadas

✅ **Extensões permitidas:** `.jpg`, `.jpeg`, `.png`, `.webp`  
✅ **Tamanho máximo:** 5 MB  
✅ **Tipo MIME:** `image/*`  
✅ **Validação em tempo real:** antes do upload

### Funcionalidades

- ✅ Preview local imediato após seleção
- ✅ Upload automático se `produtoId` fornecido
- ✅ Progress bar animada
- ✅ Overlay com ações ao hover na imagem
- ✅ Mensagens de validação (sucesso/erro/aviso)
- ✅ Formatação de tamanho de arquivo
- ✅ Fallback para imagem indisponível

---

## 🔄 Fluxo de Upload

### Cenário 1: Criar Novo Produto COM Imagem

```
1. Usuário preenche formulário
2. Usuário seleciona imagem
   → Preview aparece imediatamente
   → Imagem NÃO é enviada ainda (produtoId = null)
3. Usuário clica "Criar Produto"
   → Backend cria produto, retorna ID
4. Frontend obtém ID do produto
5. Frontend faz upload da imagem
   → POST /api/produtos/{id}/imagem
6. Backend retorna URL da imagem no MinIO
7. Frontend atualiza produto com urlImagem
```

### Cenário 2: Editar Produto e Adicionar/Trocar Imagem

```
1. Usuário clica "Editar" em um produto
2. Modal abre com dados do produto
   → ImageUpload mostra imagem atual (se existir)
3. Usuário clica em "Trocar imagem" (overlay)
4. Usuário seleciona nova imagem
   → Upload inicia AUTOMATICAMENTE (produtoId existe)
   → POST /api/produtos/{id}/imagem
5. Backend substitui imagem antiga
6. Frontend recebe nova URL
7. Preview atualiza instantaneamente
```

### Cenário 3: Remover Imagem

```
1. Usuário clica "Remover imagem" (overlay)
2. Confirmação: "Tem certeza?"
3. Frontend chama DELETE /api/produtos/{id}/imagem
4. Backend remove arquivo do MinIO
5. Frontend limpa preview
6. Produto fica sem imagem (placeholder exibido)
```

---

## 🛠️ Endpoints Utilizados

### Upload de Imagem
```http
POST /api/produtos/{id}/imagem
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  imagem: File
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Imagem enviada com sucesso",
  "data": "http://localhost:9000/restaurante-produtos/produtos/bebidas/uuid.jpg?X-Amz..."
}
```

### Remover Imagem
```http
DELETE /api/produtos/{id}/imagem
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Imagem removida com sucesso"
}
```

---

## 🎯 Como Usar

### No Formulário de Produtos

```vue
<template>
  <ImageUpload 
    v-model="form.urlImagem"
    :produto-id="modoEdicao ? produtoEditando?.id : null"
    :image-alt="form.nome || 'Produto'"
    @upload-success="handleUploadSuccess"
    @upload-error="handleUploadError"
    @remove-success="handleRemoveSuccess"
  />
</template>

<script setup>
import ImageUpload from '@/components/produtos/ImageUpload.vue'

const handleUploadSuccess = (imageUrl) => {
  console.log('Upload OK:', imageUrl)
  form.value.urlImagem = imageUrl
  notificationStore.sucesso('Imagem enviada!')
}

const handleUploadError = (error) => {
  console.error('Upload falhou:', error)
  notificationStore.erro('Erro ao enviar imagem')
}

const handleRemoveSuccess = () => {
  console.log('Imagem removida')
  form.value.urlImagem = ''
  notificationStore.sucesso('Imagem removida!')
}
</script>
```

---

## ✅ Checklist de Testes

### Testes Básicos
- [ ] Upload de imagem JPG
- [ ] Upload de imagem PNG
- [ ] Upload de imagem WebP
- [ ] Rejeitar arquivo > 5 MB
- [ ] Rejeitar extensão .gif
- [ ] Preview local funciona
- [ ] Progress bar aparece

### Testes de Fluxo
- [ ] Criar produto sem imagem
- [ ] Criar produto com imagem
- [ ] Editar produto e adicionar imagem
- [ ] Editar produto e trocar imagem
- [ ] Remover imagem de produto
- [ ] Confirmação ao remover imagem

### Testes de Erro
- [ ] Backend offline
- [ ] Token inválido
- [ ] Produto não encontrado
- [ ] MinIO indisponível
- [ ] Timeout de upload

### Testes de UI
- [ ] Overlay aparece ao hover
- [ ] Botões funcionam
- [ ] Mensagens de validação aparecem
- [ ] Preview de imagem quebrada (fallback)
- [ ] Responsividade mobile

---

## 🐛 Troubleshooting

### Problema: "Imagem não aparece após upload"

**Causa:** URL do MinIO pode ter expirado ou CORS não configurado

**Solução:**
1. Verificar `minio.url-expiration-hours` no backend
2. Verificar CORS no MinIO console
3. Testar URL diretamente no navegador

### Problema: "Upload falha com erro 413"

**Causa:** Nginx ou proxy limitando tamanho do body

**Solução:**
```nginx
client_max_body_size 10M;
```

### Problema: "Arquivo muito grande não é rejeitado"

**Causa:** Validação frontend pode ter bug

**Solução:**
1. Verificar constante `MAX_FILE_SIZE = 5 * 1024 * 1024`
2. Backend também valida (segurança em camadas)

### Problema: "Progress bar não funciona"

**Causa:** Simulação de progresso pode não refletir upload real

**Solução:**
- Implementar `onUploadProgress` do axios (futuro)
- Por ora, é apenas visual para UX

---

## 🚀 Melhorias Futuras

### P1 - Alta Prioridade
- [ ] Cropping de imagem antes do upload
- [ ] Compressão automática de imagens grandes
- [ ] Múltiplas imagens por produto (galeria)

### P2 - Média Prioridade
- [ ] Drag & drop de arquivos
- [ ] Preview de múltiplos arquivos
- [ ] Copiar URL da imagem para clipboard
- [ ] Histórico de imagens anteriores

### P3 - Baixa Prioridade
- [ ] Filtros e edição básica (brilho, contraste)
- [ ] Upload de imagem via URL externa
- [ ] Integração com banco de imagens (Unsplash)
- [ ] OCR para detectar texto em imagens

---

## 📚 Referências

- **Backend:** `MINIO_UPLOAD_IMAGENS.txt`
- **Documentação MinIO:** https://min.io/docs
- **Especificação Produtos:** `INSTRUCOES_FRONTEND_PAGINA_PRODUTOS.txt`

---

## ✅ Status

**Implementação:** ✅ **CONCLUÍDA**  
**Testado:** ⚠️ **PENDENTE** (aguardando MinIO rodando)  
**Documentado:** ✅ **SIM**

**Próximo Passo:**
1. Iniciar MinIO: `docker run -d -p 9000:9000 -p 9001:9001 --name minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio server /data --console-address ":9001"`
2. Iniciar backend: `mvn spring-boot:run`
3. Iniciar frontend: `npm run dev`
4. Testar upload completo
5. Verificar imagens no MinIO console: http://localhost:9001

---

**Implementado por:** GitHub Copilot  
**Data:** 23/02/2026  
**Versão:** 1.0.0
