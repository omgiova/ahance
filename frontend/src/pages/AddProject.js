import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (blocks.length === 0) {
      toast.error('Adicione pelo menos um bloco ao projeto');
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

      await axios.post(`${API}/projects`, projectData);
      toast.success('Projeto publicado com sucesso!');
      
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Erro ao publicar projeto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-light tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Giovani Amorim
            </h1>
            <div className="text-sm text-zinc-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Portfólio / <span className="text-zinc-200">Novo Projeto</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full px-6 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              Configurações
            </Button>
            <Button
              data-testid="publish-btn"
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full px-8 font-medium hover:-translate-y-0.5 transition-transform"
            >
              {isSaving ? 'Publicando...' : 'Publicar Projeto'}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              <input
                data-testid="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Projeto"
                className="w-full bg-transparent border-none text-4xl font-light text-zinc-50 placeholder:text-zinc-600 focus:outline-none"
                style={{ fontFamily: 'Outfit, sans-serif' }}
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