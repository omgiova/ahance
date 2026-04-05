import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Grid3x3, List, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-x-hidden">
      {/* Background Decor Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Set 1 */}
        <div className="absolute top-[10vh] -left-[10vw] w-[500px] h-[500px] border-2 border-[#e38e4d]/20 rounded-full" />
        <div className="absolute top-[30vh] right-[10vw] w-[200px] h-[200px] border border-[#e38e4d]/30 rounded-full" />
        
        {/* Set 2 */}
        <div className="absolute top-[110vh] left-[20vw] w-[400px] h-[400px] border-2 border-[#e38e4d]/10 rounded-full" />
        <div className="absolute top-[140vh] -right-[5vw] w-[300px] h-[300px] border border-[#e38e4d]/20 rounded-full" />

        {/* Set 3 */}
        <div className="absolute top-[210vh] right-[15vw] w-[500px] h-[500px] border-2 border-[#e38e4d]/15 rounded-full" />
        <div className="absolute top-[240vh] left-[5vw] w-[150px] h-[150px] border border-[#e38e4d]/40 rounded-full" />

        {/* Glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Giovani Amorim
              </h1>
              <p className="text-zinc-400 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Designer & Criativo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'list'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button
                data-testid="new-project-btn"
                onClick={() => navigate('/admin/add-project')}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full px-6 font-medium hover:-translate-y-0.5 transition-transform"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-400">Carregando projetos...</div>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center max-w-md">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-light mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Nenhum projeto ainda
              </h2>
              <p className="text-zinc-400 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Comece criando seu primeiro projeto para mostrar seu trabalho incrível!
              </p>
              <Button
                onClick={() => navigate('/admin/add-project')}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full px-8"
              >
                Criar Primeiro Projeto
              </Button>
            </div>
          </motion.div>
        ) : (
          <div
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20 hover:scale-[1.02] transition-all cursor-pointer"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                {/* Cover Image */}
                {project.cover_image ? (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={`${API}/files/${project.cover_image}`}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center">
                    <Eye className="w-12 h-12 text-zinc-600" />
                  </div>
                )}

                {/* Project Info */}
                <div className="p-6">
                  <h3 className="text-xl font-medium mb-2 text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.category && (
                      <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                        {project.category}
                      </span>
                    )}
                    {project.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-white/5 text-zinc-400 rounded-full border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags?.length > 2 && (
                      <span className="text-xs text-zinc-500">+{project.tags.length - 2}</span>
                    )}
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