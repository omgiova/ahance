import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
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
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/50 border border-black/10 rounded-2xl p-6 hover:border-[#e38e4d]/50 transition-all"
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
