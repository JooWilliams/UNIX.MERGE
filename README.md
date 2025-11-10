# 📄 PDF Merger - Juntar PDFs

Aplicação web simples e moderna para mesclar múltiplos arquivos PDF em um único documento.

## 🚀 Características

- ✨ Interface moderna e intuitiva
- 📁 Suporte para drag & drop de arquivos
- 🔄 Seleção múltipla de PDFs
- 📊 Barra de progresso durante o merge
- ✅ Validação de arquivos
- 💾 Download automático do PDF mesclado
- 🎨 Design responsivo e bonito
- 🌐 Funciona 100% no navegador (sem necessidade de servidor)

## 📋 Como Usar

1. **Abra o arquivo `mergeDoc.html` no seu navegador**
   - Basta dar duplo clique no arquivo
   - Ou arrastar o arquivo para o navegador

2. **Selecione os arquivos PDF**
   - Clique na área de upload, ou
   - Arraste e solte os arquivos PDF diretamente na área

3. **Organize os arquivos**
   - Os arquivos serão mesclados na ordem em que foram adicionados
   - Você pode remover arquivos clicando no botão ✕

4. **Clique em "Juntar PDFs"**
   - O processo de merge será iniciado
   - Uma barra de progresso mostrará o andamento
   - O arquivo mesclado será baixado automaticamente como `merged_document.pdf`

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura da página
- **CSS3** - Estilização moderna com gradientes e animações
- **JavaScript (ES6+)** - Lógica da aplicação
- **PDF-lib** - Biblioteca para manipulação de PDFs no navegador

## 📝 Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet (para carregar a biblioteca PDF-lib)

## 🔒 Privacidade

Todos os arquivos são processados localmente no seu navegador. Nenhum arquivo é enviado para servidores externos.

## 💡 Dicas

- Você pode adicionar quantos arquivos PDF quiser
- O botão "Juntar PDFs" só fica ativo quando há pelo menos 2 arquivos selecionados
- Use o botão "Limpar Tudo" para remover todos os arquivos de uma vez
- O tamanho do arquivo final depende do tamanho dos PDFs originais

## 🐛 Solução de Problemas

**O merge não funciona:**
- Verifique se você tem conexão com internet (necessária para carregar a biblioteca)
- Certifique-se de que os arquivos são PDFs válidos
- Tente com arquivos PDF menores primeiro

**Erro ao processar PDF:**
- Alguns PDFs protegidos por senha podem não funcionar
- PDFs corrompidos não podem ser mesclados

## 📄 Licença

Livre para uso pessoal e comercial.
