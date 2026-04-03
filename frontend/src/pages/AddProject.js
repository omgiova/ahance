import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import BlockEditor from '@/components/BlockEditor';
import ProjectSettings from '@/components/ProjectSettings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  'Design Gráfico',
  'Ilustração',
  'Fotografia',
  'Branding',
  'Web Design',
  'UI/UX',
  'Motion Graphics',
  'Arte Digital',
  '3D',
  'Tipografia'
];

const TOOLS = [
  'Photoshop',
  'Illustrator',
  'Figma',
  'After Effects',
  'Premiere Pro',
  'InDesign',
  'Blender',
  'Cinema 4D',
  'Procreate',
  'Sketch'
];

export default function AddProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${id}`);
      const project = response.data;
      
      setTitle(project.title || '');
      setDescription(project.description || '');
      setCategory(project.category || '');
      setSelectedTags(project.tags || []);
      setSelectedTools(project.tools || []);
      setCoverImage(project.cover_image || null);
      setIsPublic(project.visibility === 'public');
      setBlocks(project.blocks || []);
      
      toast.success('Projeto carregado!');
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        title,
        description,
        category,
        tags: selectedTags,
        tools: selectedTools,
        visibility: isPublic ? 'public' : 'private',
        published: true,
        blocks: blocks.map((block, index) => ({
          ...block,
          order: index
        })),
        cover_image: coverImage
      };

      if (isEditing) {
        // Update existing project
        await axios.put(`${API}/projects/${id}`, projectData);
        toast.success('Projeto atualizado com sucesso!');
      } else {
        // Create new project
        await axios.post(`${API}/projects`, projectData);
        toast.success('Projeto publicado com sucesso!');
      }
      
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isEditing ? 'Erro ao atualizar projeto' : 'Erro ao publicar projeto');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffeec] flex items-center justify-center">
        <div className="text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
          Carregando projeto...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffeec] text-black relative">
      {/* Decorative circles */}
      <div className="fixed top-10 right-10 w-32 h-32 bg-[#e38e4d]/20 rounded-full pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-[#e38e4d]/30 rounded-full pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#fffeec]/80 backdrop-blur-sm border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="text-black/60 hover:text-black"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: 'EB Garamond, serif' }}>
              Giovani Amorim
            </h1>
            <div className="text-sm text-black/60" style={{ fontFamily: 'EB Garamond, serif' }}>
              Portfólio / <span className="text-black">{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full px-6 py-2 border border-black/20 bg-transparent hover:bg-black/5 text-black"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              Configurações
            </Button>
            <Button
              data-testid="publish-btn"
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-full px-8 font-normal"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              {isSaving ? 'Salvando...' : (isEditing ? 'Atualizar Projeto' : 'Publicar Projeto')}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 border border-black/10 rounded-2xl p-8"
            >
              <input
                data-testid="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Projeto"
                className="w-full bg-transparent border-none text-5xl font-normal text-black placeholder:text-black/30 focus:outline-none"
                style={{ fontFamily: 'EB Garamond, serif' }}
              />
            </motion.div>

            {/* Block Editor */}
            <BlockEditor 
              blocks={blocks} 
              setBlocks={setBlocks}
              setCoverImage={setCoverImage}
            />
          </div>

          {/* Right Column - Settings Sidebar */}
          <AnimatePresence>
            {showSettings && (
              <ProjectSettings
                description={description}
                setDescription={setDescription}
                category={category}
                setCategory={setCategory}
                categories={CATEGORIES}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                selectedTools={selectedTools}
                setSelectedTools={setSelectedTools}
                tools={TOOLS}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                coverImage={coverImage}
                onClose={() => setShowSettings(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}