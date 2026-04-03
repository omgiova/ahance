import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlockRenderer from '@/components/BlockRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/zeh5zsql_ascii-video-1775235924403.mp4';
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/ccsqrvdt_EB%20Garamond%20%281%29.png';

const RESUME_LINKS = {
  pt: "https://docs.google.com/document/d/10W7c_UReou8PrBh5mENUmPy4BDIwl1IdAfwX3JszphA/export?format=docx",
  en: "https://docs.google.com/document/d/1JVeLJEUSNNVly_va0zm2fPLlJCBSMMBCJuwOAO7tqBw/export?format=docx"
};

export default function Portfolio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);

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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResumeDownload = (lang) => {
    window.open(RESUME_LINKS[lang], '_blank');
    setShowResumeDropdown(false);
  };

  return (
    <div className="min-h-screen bg-[#fffeec]">
      {/* Header Navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#fffeec]/90 backdrop-blur-sm border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-center gap-8">
            <button
              onClick={() => scrollToSection('sobre')}
              className="text-base text-black/70 hover:text-black transition-colors"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection('projetos')}
              className="text-base text-black/70 hover:text-black transition-colors"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Projetos
            </button>
            <div className="relative">
              <button
                onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                className="text-base text-black/70 hover:text-black transition-colors flex items-center gap-1"
                style={{ fontFamily: 'EB Garamond, serif' }}
              >
                Currículo
                <ChevronDown className="w-4 h-4" />
              </button>
              {showResumeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-2 bg-white border border-black/10 rounded-lg shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => handleResumeDownload('pt')}
                    className="block w-full px-6 py-3 text-left text-black hover:bg-black/5 transition-colors"
                    style={{ fontFamily: 'EB Garamond, serif' }}
                  >
                    Português
                  </button>
                  <button
                    onClick={() => handleResumeDownload('en')}
                    className="block w-full px-6 py-3 text-left text-black hover:bg-black/5 transition-colors"
                    style={{ fontFamily: 'EB Garamond, serif' }}
                  >
                    English
                  </button>
                </motion.div>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-24 pb-12 flex justify-center bg-[#fffeec]"
      >
        <img 
          src={LOGO_URL} 
          alt="Giovani Amorim Logo" 
          className="w-64 md:w-80 h-auto"
        />
      </motion.div>

      {/* Hero Section with Video */}
      <section className="relative overflow-hidden">
        {/* Background Video - Full width, auto height */}
        <div className="relative w-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full opacity-60"
            style={{ 
              filter: 'contrast(1.1)',
              display: 'block',
              width: '100%',
              height: 'auto'
            }}
            onLoadedMetadata={(e) => {
              e.target.playbackRate = 0.5;
            }}
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
          {/* Overlay - Reduced opacity */}
          <div className="absolute inset-0 bg-[#fffeec]/25 pointer-events-none" />
        </div>

        {/* Content Overlay on Video */}
        <div className="absolute inset-0 flex flex-col items-center justify-center py-12">
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

      {/* About Section */}
      <section id="sobre" className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 bg-[#e38e4d] rounded-full" />
          <span 
            className="text-sm uppercase tracking-widest text-black/60"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            Sobre
          </span>
        </div>
        <h2 
          className="text-5xl md:text-6xl font-normal text-black mb-8"
          style={{ fontFamily: 'EB Garamond, serif' }}
        >
          Giovani Amorim
        </h2>
        <div className="space-y-6 text-lg text-black/80" style={{ fontFamily: 'EB Garamond, serif' }}>
          <p>
            Designer e desenvolvedor criativo com paixão por transformar ideias em experiências digitais memoráveis. 
            Especializado em design gráfico, branding e desenvolvimento web.
          </p>
          <p>
            Com uma abordagem que une estética e funcionalidade, busco criar trabalhos que não apenas capturam a 
            atenção, mas também comunicam mensagens de forma clara e impactante.
          </p>
          <p>
            Sempre em busca de novos desafios e oportunidades para expandir os limites da criatividade no design digital.
          </p>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projetos" className="max-w-7xl mx-auto px-6 py-20">
        {/* Section Header */}
        <div className="mb-16">
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
            Projetos
          </h2>
        </div>

        {/* Projects */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
              Carregando projetos...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p 
              className="text-lg text-black/60"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Nenhum projeto publicado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-32">
            {projects.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="space-y-8"
              >
                {/* Project Header */}
                <div className="space-y-4">
                  <h3 
                    className="text-4xl md:text-5xl font-normal text-black"
                    style={{ fontFamily: 'EB Garamond, serif' }}
                  >
                    {project.title}
                  </h3>
                  {project.description && (
                    <p 
                      className="text-lg text-black/70 max-w-3xl"
                      style={{ fontFamily: 'EB Garamond, serif' }}
                    >
                      {project.description}
                    </p>
                  )}
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {project.category && (
                      <span 
                        className="text-sm uppercase tracking-widest text-[#e38e4d]"
                        style={{ fontFamily: 'EB Garamond, serif' }}
                      >
                        {project.category}
                      </span>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-3 py-1 bg-white border border-black/10 rounded-full text-black/60"
                            style={{ fontFamily: 'EB Garamond, serif' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Content - Render Blocks */}
                <div className="space-y-8">
                  {project.blocks && project.blocks.length > 0 ? (
                    project.blocks
                      .sort((a, b) => a.order - b.order)
                      .map((block) => (
                        <BlockRenderer key={block.id} block={block} />
                      ))
                  ) : (
                    project.cover_image && (
                      <div className="w-full">
                        <img
                          src={`${API}/files/${project.cover_image}`}
                          alt={project.title}
                          className="w-full h-auto"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Divider */}
                <div className="pt-16 border-t border-black/10" />
              </motion.article>
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
    </div>
  );
}
