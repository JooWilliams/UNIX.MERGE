# 📄 PDF Merger - Juntar PDFs

Aplicação web simples e moderna para mesclar arquivos PDF e converter imagens em PDF.

## 🚀 Características

- ✨ Interface moderna e intuitiva
- 🧭 Acesso às ferramentas por abas na página principal
- 📁 Suporte para drag & drop de arquivos
- 🔄 Seleção múltipla de PDFs
- 🖼️ Miniatura da primeira página de cada PDF na lista principal
- ↻ Rotação individual das páginas antes da mesclagem
- ↻ Rotação individual das páginas ao separar um PDF
- 📊 Barra de progresso durante o merge
- ✅ Validação de arquivos
- 💾 Download automático do PDF mesclado
- 🖼️ Conversão de uma ou mais imagens em um PDF com várias páginas
- 🔎 Prévia e rotação individual das imagens antes da conversão
- ✂️ Separação de PDF em páginas individuais ou por intervalos personalizados
- 🖼️ Miniaturas das páginas para selecionar visualmente o que será separado
- 🎨 Design responsivo e bonito
- 🌐 Funciona 100% no navegador (sem necessidade de servidor)

## 📋 Como Usar

1. **Abra o arquivo `index.html` no seu navegador**
   - Basta dar duplo clique no arquivo
   - Ou arrastar o arquivo para o navegador

2. **Selecione os arquivos PDF**
   - Clique na área de upload, ou
   - Arraste e solte os arquivos PDF diretamente na área

3. **Organize os arquivos**
   - Os arquivos aparecem em uma grade de duas colunas; arraste ou use as setas para escolher a ordem da mesclagem
   - Clique em um arquivo para visualizar todas as páginas e girar individualmente cada uma em 90°
   - Você pode remover arquivos clicando no botão ✕

4. **Clique em "Juntar PDFs"**
   - O processo de merge será iniciado
   - Uma barra de progresso mostrará o andamento
   - O arquivo mesclado será baixado automaticamente como `merged_document.pdf`

5. **Use as outras ferramentas**
   - Clique na aba "Separar PDF" para selecionar um arquivo, definir as páginas ou intervalos e girar páginas individualmente
   - Clique na aba "Imagem para PDF" para pré-visualizar e girar imagens antes de baixar `imagens.pdf`

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
- Confirme se todos os arquivos selecionados têm conteúdo PDF válido; renomear outro tipo de arquivo para `.pdf` não o converte em PDF

## 📄 Licença

Livre para uso pessoal e comercial.
