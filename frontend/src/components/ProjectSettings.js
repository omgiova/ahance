import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProjectSettings({
  description,
  setDescription,
  category,
  setCategory,
  categories,
  selectedTags,
  setSelectedTags,
  selectedTools,
  setSelectedTools,
  tools,
  isPublic,
  setIsPublic,
  coverImage,
  onClose
}) {
  const [tagInput, setTagInput] = React.useState('');

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="lg:col-span-4 space-y-6"
    >
      {/* Close Button */}
      <div className="flex justify-end">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Cover Image Preview */}
      {coverImage && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Imagem de Capa</Label>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={`${API}/files/${coverImage}`}
              alt="Cover"
              className="w-full h-40 object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-amber-500 text-zinc-950 text-xs font-bold px-2 py-1 rounded-full">
              CAPA
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Descrição</Label>
        <Textarea
          data-testid="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva seu projeto..."
          rows={4}
          className="w-full bg-black/20 border-white/10 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500 resize-none"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        />
      </div>

      {/* Category */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="category-select" className="bg-black/20 border-white/10 text-zinc-50">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
            {categories.map((cat) => (
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
          {tools.map((tool) => (
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
          <span className="text-sm text-zinc-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {isPublic ? 'Público' : 'Privado'}
          </span>
          <Switch
            data-testid="visibility-toggle"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </div>
    </motion.div>
  );
}

import React from 'react';