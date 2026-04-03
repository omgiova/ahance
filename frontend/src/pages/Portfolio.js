import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/zeh5zsql_ascii-video-1775235924403.mp4';
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/ccsqrvdt_EB%20Garamond%20%281%29.png';

export default function Portfolio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data.filter(p => p.published));
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffeec]">
      {/* Logo Section - Before Video */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 py-12 flex justify-center bg-[#fffeec]"
      >
        <img 
          src={LOGO_URL} 
          alt="Giovani Amorim Logo" 
          className="w-64 md:w-80 h-auto"
        />
      </motion.div>

      {/* Hero Section with Video */}
      <section className="relative overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Background Video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full opacity-60"
            style={{ 
              filter: 'contrast(1.1)',
              height: 'auto',
              minWidth: '100%',
              objectFit: 'contain'
            }}
            onLoadedMetadata={(e) => {
              e.target.playbackRate = 0.5;
            }}
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
          {/* Overlay - Reduced opacity */}
          <div className="absolute inset-0 bg-[#fffeec]/25" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center py-12">
          {/* Main Title in center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="text-center px-6"
          >
            <h1 
              className="text-7xl md:text-9xl font-normal text-black mb-6"
              style={{ fontFamily: 'EB Garamond, serif', lineHeight: '1.1' }}
            >
              criatividade
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-[#e38e4d] rounded-full" />
              <p 
                className="text-2xl md:text-3xl text-black/80"
                style={{ fontFamily: 'EB Garamond, serif' }}
              >
                design & tecnologia
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        {/* Section Header */}
        <div className="mb-16 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full" />
              <span 
                className="text-sm uppercase tracking-widest text-black/60"
                style={{ fontFamily: 'EB Garamond, serif' }}
              >
                Portfólio
              </span>
            </div>
            <h2 
              className="text-5xl md:text-6xl font-normal text-black"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Projetos Selecionados
            </h2>
          </div>
          <Button
            onClick={() => navigate('/admin/add-project')}
            className="hidden md:flex items-center gap-2 bg-black text-[#fffeec] hover:bg-black/90 rounded-full px-8 py-6 text-lg"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            Novo Projeto
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Projects */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
              Carregando projetos...
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
              className="text-3xl font-normal mb-4 text-black"
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
              className="bg-black text-[#fffeec] hover:bg-black/90 rounded-full px-8 py-6 text-lg"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Criar Projeto
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                {/* Project Image */}
                <div className="relative aspect-[4/3] mb-6 overflow-hidden bg-black/5">
                  {project.cover_image ? (
                    <img
                      src={`${API}/files/${project.cover_image}`}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 bg-[#e38e4d]/30 rounded-full" />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                </div>

                {/* Project Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 
                      className="text-3xl font-normal mb-2 text-black group-hover:text-[#e38e4d] transition-colors"
                      style={{ fontFamily: 'EB Garamond, serif' }}
                    >
                      {project.title}
                    </h3>
                    {project.description && (
                      <p 
                        className="text-base text-black/60 line-clamp-2 mb-3"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.description}
                      </p>
                    )}
                    {project.category && (
                      <span 
                        className="inline-block text-sm uppercase tracking-widest text-[#e38e4d]"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.category}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-black/40 group-hover:text-[#e38e4d] group-hover:translate-x-2 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p 
            className="text-sm text-black/60"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            © 2026 Giovani Amorim. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Mobile FAB */}
      <Button
        onClick={() => navigate('/admin/add-project')}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 rounded-full bg-[#e38e4d] hover:bg-[#e38e4d]/90 shadow-2xl flex items-center justify-center"
      >
        <Plus className="w-6 h-6 text-black" />
      </Button>
    </div>
  );
}