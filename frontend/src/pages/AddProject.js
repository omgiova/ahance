import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, X, Upload, Eye, EyeOff, Save } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setUploadedImages(prev => [...prev, response.data]);
        
        // Set first image as cover if no cover set
        if (!coverImage) {
          setCoverImage(response.data);
        }
      }
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    if (coverImage?.id === imageId) {
      setCoverImage(uploadedImages[0] || null);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const toggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter(t => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
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
        published: true
      };

      const response = await axios.post(`${API}/projects`, projectData);
      const projectId = response.data.id;

      // Add images to project
      for (const image of uploadedImages) {
        await axios.post(`${API}/projects/${projectId}/images?storage_path=${encodeURIComponent(image.storage_path)}`);
      }

      // Set cover image
      if (coverImage) {
        await axios.post(`${API}/projects/${projectId}/cover?storage_path=${encodeURIComponent(coverImage.storage_path)}`);
      }

      toast.success('Projeto publicado com sucesso!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSelectedTags([]);
      setSelectedTools([]);
      setUploadedImages([]);
      setCoverImage(null);
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
            <h1 className="text-2xl font-light tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Giovani Amorim
            </h1>
            <div className="text-sm text-zinc-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Portfólio / <span className="text-zinc-200">Adicionar Projeto</span>
            </div>
          </div>
          <Button
            data-testid="publish-btn"
            onClick={handlePublish}
            disabled={isSaving}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full px-8 font-medium hover:-translate-y-0.5 transition-transform"
          >
            {isSaving ? 'Publicando...' : 'Publicar Projeto'}
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Title */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <input
                data-testid="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Projeto"
                className="w-full bg-transparent border-none text-4xl font-light text-zinc-50 placeholder:text-zinc-600 focus:outline-none"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              />
            </div>

            {/* Description */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Descrição</Label>
              <Textarea
                data-testid="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva seu projeto, processo criativo, objetivos..."
                rows={8}
                className="w-full bg-black/20 border-white/10 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500 resize-none"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>

            {/* Upload Zone */}
            <div
              data-testid="upload-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white/5 backdrop-blur-2xl border-2 border-dashed rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ${
                isDragging ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/20'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <ImagePlus className="w-16 h-16 text-zinc-400" />
                <div>
                  <p className="text-xl text-zinc-300 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Arraste arquivos ou clique para fazer upload
                  </p>
                  <p className="text-sm text-zinc-500">Suporta JPG, PNG, WebP, GIF, MP4</p>
                </div>
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={isUploading}
                    className="rounded-full px-6 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                  >
                    {isUploading ? 'Enviando...' : 'Selecionar Arquivos'}
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  >
                    <img
                      src={`${API}/files/${image.storage_path}`}
                      alt={image.original_filename}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {coverImage?.id === image.id && (
                      <div className="absolute bottom-4 left-4 bg-amber-500 text-zinc-950 text-xs font-bold px-2 py-1 rounded-full">
                        CAPA
                      </div>
                    )}
                    {coverImage?.id !== image.id && (
                      <button
                        onClick={() => setCoverImage(image)}
                        className="absolute bottom-4 left-4 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Definir como capa
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column - Settings Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Category */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="category-select" className="bg-black/20 border-white/10 text-zinc-50">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Tags</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  data-testid="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Adicionar tag"
                  className="bg-black/20 border-white/10 text-zinc-50 focus-visible:ring-1 focus-visible:ring-amber-500"
                />
                <Button
                  data-testid="add-tag-btn"
                  onClick={addTag}
                  className="bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-lg"
                >
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-xs bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-2"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Ferramentas</Label>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((tool) => (
                  <button
                    key={tool}
                    data-testid={`tool-${tool.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleTool(tool)}
                    className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                      selectedTools.includes(tool)
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Visibilidade</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublic ? <Eye className="w-4 h-4 text-amber-500" /> : <EyeOff className="w-4 h-4 text-zinc-500" />}
                  <span className="text-sm text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {isPublic ? 'Público' : 'Privado'}
                  </span>
                </div>
                <Switch
                  data-testid="visibility-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}