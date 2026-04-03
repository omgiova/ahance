import React, { useState } from 'react';
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
  const [tagInput, setTagInput] = useState('');
  const [tagTextColor, setTagTextColor] = useState('#000000');
  const [tagBgColor, setTagBgColor] = useState('#ffffff');

  const addTag = () => {
    if (tagInput.trim()) {
      const newTag = {
        name: tagInput.trim(),
        textColor: tagTextColor,
        bgColor: tagBgColor
      };
      
      // Check if tag name already exists
      const exists = selectedTags.some(t => 
        (typeof t === 'string' ? t : t.name) === newTag.name
      );
      
      if (!exists) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput('');
        // Reset colors for next tag
        setTagTextColor('#000000');
        setTagBgColor('#ffffff');
      }
    }
  };

  const removeTag = (tagName) => {
    setSelectedTags(selectedTags.filter(t => 
      (typeof t === 'string' ? t : t.name) !== tagName
    ));
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
          className="text-black/60 hover:text-black"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Cover Image Preview */}
      {coverImage && (
        <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
          <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Imagem de Capa</Label>
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={`${API}/files/${coverImage}`}
              alt="Cover"
              className="w-full h-40 object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-[#e38e4d] text-black text-xs font-normal px-2 py-1 rounded-full" style={{ fontFamily: 'EB Garamond, serif' }}>
              CAPA
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Descrição</Label>
        <Textarea
          data-testid="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva seu projeto..."
          rows={4}
          className="w-full bg-white border-black/20 text-black placeholder:text-black/40 focus-visible:ring-1 focus-visible:ring-[#e38e4d] resize-none"
          style={{ fontFamily: 'EB Garamond, serif' }}
        />
      </div>

      {/* Category */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="category-select" className="bg-white border-black/20 text-black" style={{ fontFamily: 'EB Garamond, serif' }}>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent className="bg-[#fffeec] border-black/20 text-black" style={{ fontFamily: 'EB Garamond, serif' }}>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags with Custom Colors */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Tags Customizáveis</Label>
        <div className="space-y-3">
          {/* Add new tag */}
          <div className="flex gap-2">
            <Input
              data-testid="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Nome da tag"
              className="flex-1 bg-white border-black/20 text-black focus-visible:ring-1 focus-visible:ring-[#e38e4d]"
              style={{ fontFamily: 'EB Garamond, serif' }}
            />
            <Button
              data-testid="add-tag-btn"
              onClick={addTag}
              className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-lg px-4"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              +
            </Button>
          </div>
          
          {/* Color pickers */}
          {tagInput.trim() && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-black/5 rounded-lg">
              <div>
                <label className="text-xs text-black/60 block mb-1" style={{ fontFamily: 'EB Garamond, serif' }}>Cor do texto</label>
                <input
                  type="color"
                  value={tagTextColor}
                  onChange={(e) => setTagTextColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer border border-black/20"
                />
              </div>
              <div>
                <label className="text-xs text-black/60 block mb-1" style={{ fontFamily: 'EB Garamond, serif' }}>Cor de fundo</label>
                <input
                  type="color"
                  value={tagBgColor}
                  onChange={(e) => setTagBgColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer border border-black/20"
                />
              </div>
              {/* Preview */}
              <div className="col-span-2">
                <label className="text-xs text-black/60 block mb-1" style={{ fontFamily: 'EB Garamond, serif' }}>Preview</label>
                <div 
                  className="rounded-full px-3 py-1 text-xs inline-block"
                  style={{
                    fontFamily: 'EB Garamond, serif',
                    backgroundColor: tagBgColor,
                    color: tagTextColor,
                    border: `1px solid ${tagBgColor}`
                  }}
                >
                  {tagInput || 'Sua tag aqui'}
                </div>
              </div>
            </div>
          )}
          
          {/* Tags list */}
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => {
              const tagName = typeof tag === 'string' ? tag : tag.name;
              const textColor = typeof tag === 'string' ? '#000000' : tag.textColor;
              const bgColor = typeof tag === 'string' ? '#ffffff' : tag.bgColor;
              
              return (
                <span
                  key={`${tagName}-${index}`}
                  className="rounded-full px-3 py-1 text-xs flex items-center gap-2"
                  style={{
                    fontFamily: 'EB Garamond, serif',
                    backgroundColor: bgColor,
                    color: textColor,
                    border: `1px solid ${bgColor === '#ffffff' ? 'rgba(0,0,0,0.1)' : bgColor}`
                  }}
                >
                  {tagName}
                  <button 
                    onClick={() => removeTag(tagName)} 
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Ferramentas</Label>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <button
              key={tool}
              data-testid={`tool-${tool.toLowerCase().replace(/\\s+/g, '-')}`}
              onClick={() => toggleTool(tool)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                selectedTools.includes(tool)
                  ? 'bg-[#e38e4d] border-[#e38e4d] text-black'
                  : 'bg-white border-black/20 text-black hover:bg-black/5'
              }`}
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>Visibilidade</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-black" style={{ fontFamily: 'EB Garamond, serif' }}>
            {isPublic ? 'Público' : 'Privado'}
          </span>
          <Switch
            data-testid="visibility-toggle"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            className="data-[state=checked]:bg-[#e38e4d]"
          />
        </div>
      </div>
    </motion.div>
  );
}
