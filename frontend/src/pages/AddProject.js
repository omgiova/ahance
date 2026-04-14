import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
  const [clientLogo, setClientLogo] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects/${id}`);
      const project = response.data;
      setTitle(project.title || '');
      setDescription(project.description || '');
      setCategory(project.category || '');
      setSelectedTags(project.tags || []);
      setSelectedTools(project.tools || []);
      setCoverImage(project.cover_image || null);
      setClientLogo(project.client_logo || null);
      setIsPublic(project.visibility === 'public');
      setBlocks(project.blocks || []);
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      loadProject();
    }
  }, [id, isEditing, loadProject]);

  const handlePublish = async (asDraft = false) => {
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
        published: !asDraft,
        blocks: blocks.map((block, index) => ({
          ...block,
          order: index
        })),
        cover_image: coverImage,
        client_logo: clientLogo
      };

      if (isEditing) {
        // Update existing project
        await axios.put(`${API}/projects/${id}`, projectData);
        toast.success(asDraft ? 'Rascunho salvo!' : 'Projeto atualizado com sucesso!');
      } else {
        // Create new project
        await axios.post(`${API}/projects`, projectData);
        toast.success(asDraft ? 'Rascunho salvo!' : 'Projeto publicado com sucesso!');
      }
      
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      
      // Detailed error message
      let errorMessage = 'Erro ao salvar projeto';
      if (error.response) {
        errorMessage = `Erro ${error.response.status}: ${error.response.data?.detail || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Erro de conexão com o servidor';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        description: 'Verifique o console para mais detalhes'
      });
      
      // Log complete error for debugging
      console.error('Erro completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

          {/* Right Column - Settings Sidebar (sempre visível) */}
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
            clientLogo={clientLogo}
            setClientLogo={setClientLogo}
          />
        </div>
      </div>

      {/* Floating Action Bar - Centralizado */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-black/10 shadow-xl rounded-full px-6 py-3">
          <span className="text-sm text-black/60 pr-3 border-r border-black/10" style={{ fontFamily: 'EB Garamond, serif' }}>
            {blocks.length} bloco(s)
          </span>
          <Button
            onClick={() => handlePublish(true)}
            disabled={isSaving}
            className="rounded-full px-6 py-2 border border-black/20 bg-transparent hover:bg-black/5 text-black"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button
            onClick={() => handlePublish(false)}
            disabled={isSaving}
            className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-full px-8 font-normal"
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            {isSaving ? 'Salvando...' : 'Publicar'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}