# Portfolio Giovani Amorim - PRD

## Problema Original
Criar um site/mobile site no estilo perfil de freelancer para Giovani Amorim (único admin). Design editorial minimalista com funcionalidades completas para adicionar itens ao portfólio.

## Requisitos de Design
- **Fundo**: `#fffeec` (creme)
- **Cor de Destaque**: `#e38e4d` (laranja)
- **Fonte**: EB Garamond
- **Estilo**: Editorial Minimalista

## Funcionalidades Implementadas

### Core
- [x] Homepage pública com vídeo hero, logo e lista de projetos
- [x] Admin dashboard (`/admin`) para gerenciar projetos
- [x] Editor de blocos (`/admin/add-project`, `/admin/edit-project/:id`)
- [x] Tipos de blocos: Texto, Imagem, Grid, Carrossel, Vídeo, Embed, Separador, Espaço

### Sistema de Tags (Atualizado 2026-04-03)
- [x] Tags globais com cores personalizáveis
- [x] Paleta de 5 cores baseada no laranja principal:
  - Claro 1: `#f6dfcf`
  - Claro 2: `#edb78e`
  - Principal: `#e38e4d`
  - Escuro 1: `#a5672f`
  - Escuro 2: `#674011`
- [x] Sincronização completa entre editor e página do portfólio
- [x] Tags exibidas com cores corretas na página pública

### Sidebar do Editor
- [x] Campo de descrição
- [x] Campo de categoria (texto livre)
- [x] Criador de tags com seleção de cores
- [x] Seleção de tags globais existentes
- [x] Preview de imagem de capa

### Publicação
- [x] Botão "Salvar Rascunho"
- [x] Botão "Salvar e Publicar"
- [x] Filtro de projetos publicados na página pública

## Arquitetura

### Frontend
- React + Tailwind CSS + Shadcn UI
- Framer Motion para animações

### Backend
- FastAPI + Motor (MongoDB async)
- Object Storage para arquivos

### Banco de Dados
- `projects`: `{id, title, description, category, blocks[], tags[], published, cover_image}`
- `tags`: `{id, name, bgColor, textColor}`

## API Endpoints
- `GET /api/projects` - Lista projetos
- `POST /api/projects` - Cria projeto
- `PUT /api/projects/:id` - Atualiza projeto
- `DELETE /api/projects/:id` - Deleta projeto
- `GET /api/tags` - Lista tags globais
- `POST /api/tags` - Cria tag global
- `DELETE /api/tags/:id` - Deleta tag global
- `POST /api/upload` - Upload de arquivos
- `GET /api/files/:path` - Download de arquivos

## Backlog

### P1 (Próximas)
- [ ] Analytics/Stats dashboard para projetos
- [ ] Lista de Serviços Freelance com preços
- [ ] Sistema de Contato/Formulário de Inquérito

### P2 (Futuras)
- [ ] Drag-and-drop reordenação na lista de projetos do admin
- [ ] Opções avançadas de texto (5 fontes, tamanhos)
