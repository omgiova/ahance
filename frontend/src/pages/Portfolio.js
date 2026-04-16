import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlockRenderer from '@/components/BlockRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API}/files/${path}`;
}

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/zeh5zsql_ascii-video-1775235924403.mp4';
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_behance-style/artifacts/ccsqrvdt_EB%20Garamond%20%281%29.png';

const RESUME_LINKS = {
  pt: '/Curr%C3%ADculo%20-%20Giovani%20Amorim.pdf',
  en: '/Giovani%20Amorim%20-%20Resume.pdf'
};

const PORTFOLIO_CACHE_KEY = 'portfolio-published-projects-cache-v1';

export default function Portfolio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedLogo, setExpandedLogo] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(PORTFOLIO_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          setProjects(parsed.projects);
          setTotalProjects(parsed.totalProjects || parsed.projects.length);
          setVisibleCount(5);
          setLoading(false);
        }
      }
    } catch (error) {
      console.warn('Portfolio cache read failed:', error);
    }

    fetchProjects(5);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProjects = async (limit = 5) => {
    try {
      const response = await axios.get(`${API}/projects`, {
        params: {
          published_only: true,
          limit
        }
      });

      const fetchedProjects = response.data || [];
      const total = parseInt(response.headers['x-total-count'] || fetchedProjects.length, 10);

      setProjects(fetchedProjects);
      setTotalProjects(total);
      setVisibleCount(limit);

      localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify({
        projects: fetchedProjects,
        totalProjects: total,
        savedAt: Date.now()
      }));
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
    const url = RESUME_LINKS[lang];
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = lang === 'pt' ? 'Currículo - Giovani Amorim.pdf' : 'Giovani Amorim - Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowResumeDropdown(false);
  };

  const getLuminance = (hex) => {
    const c = (hex || '#000000').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const DECOR_SIZES = [120, 230, 180, 220, 150, 200, 180];
  const visibleProjects = projects;
  const hasMoreProjects = visibleCount < totalProjects;

  return (
    <div className="min-h-screen bg-[#fffeec] relative overflow-x-hidden">
      {/* Header Navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#fffeec]/90 backdrop-blur-sm border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 relative">
          {scrolled && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src="/g.png"
              alt="G"
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'multiply', opacity: 0.9 }}
            />
          )}
          <nav className="flex items-center justify-end gap-8">
              <button
                onClick={() => scrollToSection('sobre')}
                className="text-base text-black/70 hover:text-black transition-colors"
                style={{ fontFamily: 'EB Garamond, serif' }}
              >
                SOBRE
              </button>
              <button
                onClick={() => scrollToSection('projetos')}
                className="text-base text-black/70 hover:text-black transition-colors"
                style={{ fontFamily: 'EB Garamond, serif' }}
              >
                PROJETOS
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                  className="text-base text-black/70 hover:text-black transition-colors flex items-center gap-1"
                  style={{ fontFamily: 'EB Garamond, serif' }}
                >
                  CURRÍCULO
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

      {/* Logo Section - colado com header (56px do header fixo) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 pt-[56px] flex justify-center bg-[#fffeec]"
      >
        <img 
          src={LOGO_URL} 
          alt="Giovani Amorim Logo" 
          className="w-64 md:w-80 h-auto"
        />
      </motion.div>

      {/* Hero Section with Video - colado com logo */}
      <section className="relative overflow-hidden">
        {/* Background Video - Full width, auto height */}
        <div className="relative w-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full opacity-90"
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
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 py-12">
          {/* Main Title - moved up */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="text-center px-6"
          >
            <h1 
              className="text-6xl md:text-7xl font-normal text-black mb-4"
              style={{ fontFamily: 'EB Garamond, serif', lineHeight: '1.1' }}
            >
              redator
            </h1>
            <h2 
              className="text-6xl md:text-7xl font-normal text-black"
              style={{ fontFamily: 'EB Garamond, serif', lineHeight: '1.1' }}
            >
              estrategista de conteúdo
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Infinite Marquee Section */}
      <div className="bg-[#fffeec] py-4 overflow-hidden border-y border-black/5 relative z-10">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
          }
        `}</style>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-3xl md:text-4xl italic text-black font-normal pr-8" style={{ fontFamily: 'EB Garamond, serif' }}>
              <span>criatividade</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>SEO</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>copywriting</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>semiótica</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>revisão</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>automação</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>conteúdo</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>social media</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>estratégia</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>performance</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>tradução</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
              <span>benchmarking</span>
              <div className="w-3 h-3 bg-[#e38e4d] rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="sobre" className="relative max-w-4xl mx-auto px-6 py-20">
        {/* Decorative Circle for About Section */}
        <div 
          className="absolute pointer-events-none rounded-full bg-[#e38e4d]"
          style={{
            width: '250px',
            height: '250px',
            top: '50%',
            right: '-320px',
            transform: 'translateY(-50%)',
            zIndex: 0
          }}
        />
        <div className="relative pl-8 border-l-2 border-[#e38e4d]">
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
            className="text-5xl md:text-3xl font-normal text-black mb-8"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            Mas... quem é Giovani Amorim?
          </h2>
          <div className="space-y-6 text-xl text-black/80" style={{ fontFamily: 'EB Garamond, serif' }}>
            <p>
              Desde 1995, respiro os ares tupiniquins.
            </p>
            <p>
              Desde 2009, sinto o marketing como vocação.
            </p>
            <p>
              Desde 2017, vejo a área com respeito e profissionalismo, sem perder a empolgação, a essência e a motivação que me acompanham desde o início. Minha vibe hoje é construir mensagens autênticas, sejam elas com palavras ou não, que ecoam na memória do público.
            </p>
            <p>
              Com mais de 8 anos no cruzamento entre criatividade, estratégia e tecnologia, desenvolvo e executo campanhas que conectam marcas às pessoas certas por meio do meu conhecimento teórico e minha expertise.
            </p>
            <p>
              Não me limito à redação/ao copywriting, sou um profissional estrategista e atuo com base em métricas de performance, benchmarking, qualidade e objetivos do cliente. Minha trajetória inclui direção criativa multissetorial com alto volume de entregas em agência de marketing 360 e startup proptech, com mais de 100 clientes atendidos e mais de 300 projetos entregues.
            </p>
            <p>
              Ajudei a fundar e coordenar a comunicação de uma proptech que fez mais de R$ 60 milhões em VGV em menos de 3 anos.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projetos" className="relative py-20">
        {/* Background Layer for the entire projects section */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const size = DECOR_SIZES[i % DECOR_SIZES.length];
            return (
              <div 
                key={i}
                className="absolute rounded-full bg-[#e38e4d]"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${i * 600}px`,
                  [i % 2 === 0 ? 'left' : 'right']: 'calc(50vw + 480px)',
                }}
              />
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="relative">
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
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleProjects.map((project, index) => (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative space-y-8"
                  >
                    {/* Project Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-6">
                        <h3 
                          className="text-4xl md:text-5xl font-normal text-black"
                          style={{ fontFamily: 'EB Garamond, serif' }}
                        >
                          {project.title}
                        </h3>
                        {project.client_logo && (
                          <img
                            src={getMediaUrl(project.client_logo)}
                            alt="Logo do cliente"
                            className="w-24 h-24 object-contain cursor-pointer shrink-0"
                            style={{ mixBlendMode: 'multiply' }}
                            onClick={() => setExpandedLogo(getMediaUrl(project.client_logo))}
                          />
                        )}
                      </div>
                      {project.description && (
                        <p 
                          className="text-lg text-black/70"
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
                          <div className="flex items-center gap-2 flex-wrap">
                            {project.tags
                              .filter(tag => typeof tag === 'object' && tag.id && tag.name)
                              .sort((a, b) => getLuminance(a.bgColor || '#e38e4d') - getLuminance(b.bgColor || '#e38e4d'))
                              .map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="text-xs px-3 py-1 rounded-full font-medium"
                                  style={{ 
                                    fontFamily: 'EB Garamond, serif',
                                    backgroundColor: tag.bgColor || '#e38e4d',
                                    color: tag.textColor || '#ffffff'
                                  }}
                                >
                                  {tag.name}
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
                              src={getMediaUrl(project.cover_image)}
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

            {!loading && hasMoreProjects && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={() => fetchProjects(Math.min(visibleCount + 10, totalProjects || visibleCount + 10))}
                  className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-full px-8"
                  style={{ fontFamily: 'EB Garamond, serif' }}
                >
                  VER MAIS
                </Button>
              </div>
            )}
          </div>
        </div>
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

      {/* Client logo lightbox */}
      {expandedLogo && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setExpandedLogo(null)}
        >
          <button
            className="absolute top-8 right-8 bg-[#F6DFCF] text-zinc-400 hover:scale-110 active:scale-95 transition-all p-3 rounded-full shadow-2xl z-[1000000] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); setExpandedLogo(null); }}
          >
            <X className="w-8 h-8 stroke-[1px]" />
          </button>
          <img
            src={expandedLogo}
            alt="Logo do cliente"
            className="max-w-[720px] max-h-[720px] w-auto h-auto object-contain shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
