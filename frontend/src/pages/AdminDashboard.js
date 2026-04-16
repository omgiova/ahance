import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Search, ArrowUp, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ORDER_SAVE_PREFIX = 'admin-project-order-save-slot-';
const SAVE_SLOT_STYLES = {
  1: { bg: '#f6dfcf', text: '#674011', border: '#edb78e' },
  2: { bg: '#e38e4d', text: '#ffffff', border: '#a5672f' },
  3: { bg: '#674011', text: '#ffffff', border: '#a5672f' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [savedOrders, setSavedOrders] = useState({ 1: null, 2: null, 3: null });

  useEffect(() => {
    fetchProjects();
    loadSavedOrders();
  }, []);

  const loadSavedOrders = () => {
    const nextSavedOrders = { 1: null, 2: null, 3: null };

    [1, 2, 3].forEach((slot) => {
      try {
        const raw = localStorage.getItem(`${ORDER_SAVE_PREFIX}${slot}`);
        nextSavedOrders[slot] = raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.warn(`Não foi possível ler o SAVE ${slot}:`, error);
        nextSavedOrders[slot] = null;
      }
    });

    setSavedOrders(nextSavedOrders);
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      console.log('Projetos carregados:', response.data);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const persistProjectOrder = async (orderedProjects, successMessage) => {
    setProjects(orderedProjects);

    try {
      await axios.put(`${API}/projects/reorder`, {
        project_ids: orderedProjects.map((p) => p.id)
      });
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Erro ao reordenar');
      fetchProjects();
      return false;
    }
  };

  const handleSaveSlot = (slot) => {
    const payload = {
      ids: projects.map((p) => p.id),
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(`${ORDER_SAVE_PREFIX}${slot}`, JSON.stringify(payload));
    loadSavedOrders();
    toast.success(`SAVE ${slot} salvo!`);
  };

  const handleRestoreSlot = async (slot) => {
    const saved = savedOrders[slot];
    if (!saved?.ids?.length) {
      toast.error(`SAVE ${slot} ainda está vazio.`);
      return;
    }

    const savedIdSet = new Set(saved.ids);
    const restoredProjects = [
      ...saved.ids.map((id) => projects.find((p) => p.id === id)).filter(Boolean),
      ...projects.filter((p) => !savedIdSet.has(p.id))
    ];

    const ok = await persistProjectOrder(restoredProjects, `SAVE ${slot} restaurado!`);
    if (ok) {
      loadSavedOrders();
    }
  };

  const handleDragStart = (e, projectId) => {
    setDraggedId(projectId);
    // Set drag data to avoid browser blocking
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.height / 2;
    const offset = e.clientY - rect.top;
    
    if (offset < midpoint) {
      setDropIndex(index);
    } else {
      setDropIndex(index + 1);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropIndex(null);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (draggedId === null || dropIndex === null) return;

    const draggedIndex = projects.findIndex(p => p.id === draggedId);
    const newProjects = [...projects];
    
    newProjects.splice(draggedIndex, 1);
    let targetIndex = dropIndex;
    if (draggedIndex < dropIndex) {
      targetIndex--;
    }
    newProjects.splice(targetIndex, 0, projects[draggedIndex]);

    setDraggedId(null);
    setDropIndex(null);

    await persistProjectOrder(newProjects, 'Ordem atualizada!');
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropIndex(null);
  };

  // Calculate display order while dragging, then apply search filter
  const baseProjects = draggedId !== null && dropIndex !== null 
    ? (() => {
        const temp = projects.filter(p => p.id !== draggedId);
        const draggedProject = projects.find(p => p.id === draggedId);
        let insertIndex = dropIndex;
        const draggedIndex = projects.findIndex(p => p.id === draggedId);
        if (draggedIndex < dropIndex) {
          insertIndex--;
        }
        temp.splice(insertIndex, 0, draggedProject);
        return temp;
      })()
    : projects;

  const displayProjects = search.trim()
    ? baseProjects.filter(p => p.title?.toLowerCase().includes(search.trim().toLowerCase()))
    : baseProjects;

  const handleSendToTop = async (projectId) => {
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex <= 0) return;

    const reorderedProjects = [
      projects[projectIndex],
      ...projects.filter((p) => p.id !== projectId)
    ];

    const ok = await persistProjectOrder(reorderedProjects, 'Projeto enviado ao topo!');
    if (ok) {
      fetchProjects();
    }
  };

  const handleDelete = async (projectId, projectTitle) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${projectTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/projects/${projectId}`);
      toast.success('Projeto deletado com sucesso!');
      fetchProjects();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar projeto');
    }
  };

  return (
    <div className="min-h-screen bg-[#fffeec]">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#fffeec]/90 backdrop-blur-sm border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-black/60 hover:text-black"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-normal" style={{ fontFamily: 'EB Garamond, serif' }}>
              Painel Administrativo
            </h1>
          </div>
          <Button
            onClick={() => navigate('/admin/add-project')}
            className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-full px-6"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 
            className="text-4xl font-normal text-black mb-2"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            Gerenciar Projetos
          </h2>
          <p 
            className="text-lg text-black/60"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            Total de projetos: {projects.length}
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome..."
                className="w-full h-11 pl-9 pr-4 text-sm bg-white border border-black/10 rounded-full text-black placeholder:text-black/40 focus:outline-none focus:border-[#e38e4d] transition-colors"
                style={{ fontFamily: 'EB Garamond, serif' }}
              />
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[1, 2, 3].map((slot) => {
                const slotStyle = SAVE_SLOT_STYLES[slot];

                return (
                  <div
                    key={slot}
                    className="flex items-center gap-1 border rounded-full px-2 py-1 h-11"
                    style={{
                      backgroundColor: slotStyle.bg,
                      color: slotStyle.text,
                      borderColor: slotStyle.border,
                    }}
                  >
                    <span
                      className="text-sm px-2"
                      style={{ fontFamily: 'EB Garamond, serif', color: slotStyle.text }}
                    >
                      SAVE {slot}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveSlot(slot)}
                      className="h-8 w-8 p-0 rounded-full hover:bg-black/10"
                      style={{ color: slotStyle.text }}
                      title={`Salvar SAVE ${slot}`}
                      aria-label={`Salvar SAVE ${slot}`}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <span style={{ color: slotStyle.text, opacity: 0.35 }}>|</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRestoreSlot(slot)}
                      disabled={!savedOrders[slot]?.ids?.length}
                      className="h-8 w-8 p-0 rounded-full hover:bg-black/10 disabled:opacity-30"
                      style={{ color: slotStyle.text }}
                      title={`Restaurar SAVE ${slot}`}
                      aria-label={`Restaurar SAVE ${slot}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
              Carregando...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-[#e38e4d]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-[#e38e4d]" />
            </div>
            <h3 
              className="text-2xl font-normal mb-4 text-black"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Nenhum projeto ainda
            </h3>
            <p 
              className="text-lg text-black/60 mb-8"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Comece criando seu primeiro projeto
            </p>
            <Button
              onClick={() => navigate('/admin/add-project')}
              className="bg-black text-[#fffeec] hover:bg-black/90 rounded-full px-8"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Criar Projeto
            </Button>
          </motion.div>
        ) : (
          <div 
            className="grid grid-cols-1 gap-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            {displayProjects.map((project, index) => (
              <motion.div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: draggedId === project.id ? 0.5 : 1,
                  y: 0
                }}
                transition={{ 
                  duration: draggedId !== null ? 0.2 : 0.5,
                  delay: draggedId !== null ? 0 : index * 0.05
                }}
                className={`bg-white/50 border border-black/10 rounded-2xl p-6 hover:border-[#e38e4d]/50 transition-all cursor-move mb-4 ${
                  draggedId === project.id ? 'border-[#e38e4d]/70 shadow-lg' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Project Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="text-2xl font-normal text-black"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          project.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>

                    {project.description && (
                      <p 
                        className="text-base text-black/60 mb-3 line-clamp-2"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      {project.category && (
                        <span 
                          className="text-sm uppercase tracking-widest text-[#e38e4d]"
                          style={{ fontFamily: 'EB Garamond, serif' }}
                        >
                          {project.category}
                        </span>
                      )}
                      {project.blocks && (
                        <span 
                          className="text-sm text-black/50"
                          style={{ fontFamily: 'EB Garamond, serif' }}
                        >
                          {project.blocks.length} bloco(s)
                        </span>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <span 
                          className="text-sm text-black/50"
                          style={{ fontFamily: 'EB Garamond, serif' }}
                        >
                          {project.tags.length} tag(s)
                        </span>
                      )}
                      <span 
                        className="text-sm text-black/40"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        Pos: {project.position}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/')}
                      className="text-black/60 hover:text-black"
                      title="Visualizar no site"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendToTop(project.id)}
                      disabled={projects[0]?.id === project.id}
                      className="text-black/60 hover:text-[#e38e4d] disabled:opacity-30"
                      title="Mandar ao topo"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/edit-project/${project.id}`)}
                      className="text-black/60 hover:text-[#e38e4d]"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id, project.title)}
                      className="text-black/60 hover:text-red-600"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
