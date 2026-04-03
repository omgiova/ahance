import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Paleta de cores baseada no laranja principal #e38e4d
// 2 tons claros (entre laranja e branco) + laranja principal + 2 tons escuros (entre laranja e preto)
const COLOR_PALETTE = [
  { bg: '#f6dfcf', text: '#674011', label: 'Claro 1' },
  { bg: '#edb78e', text: '#674011', label: 'Claro 2' },
  { bg: '#e38e4d', text: '#ffffff', label: 'Principal' },
  { bg: '#a5672f', text: '#ffffff', label: 'Escuro 1' },
  { bg: '#674011', text: '#ffffff', label: 'Escuro 2' },
];

export default function ProjectSettings({
  description,
  setDescription,
  category,
  setCategory,
  selectedTags,
  setSelectedTags,
  coverImage,
  onClose
}) {
  const [allTags, setAllTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagTextColor, setTagTextColor] = useState('#ffffff');
  const [tagBgColor, setTagBgColor] = useState('#e38e4d');
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    fetchAllTags();
  }, []);

  const fetchAllTags = async () => {
    try {
      const response = await axios.get(`${API}/tags`);
      setAllTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const createGlobalTag = async () => {
    if (!tagInput.trim()) return;

    try {
      const response = await axios.post(`${API}/tags`, {
        name: tagInput.trim(),
        textColor: tagTextColor,
        bgColor: tagBgColor
      });

      setAllTags([...allTags, response.data]);
      setTagInput('');
      setTagTextColor('#000000');
      setTagBgColor('#ffffff');
      toast.success('Tag criada com sucesso!');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Tag já existe!');
      } else {
        toast.error('Erro ao criar tag');
      }
    }
  };

  const deleteGlobalTag = async (tagId) => {
    if (!window.confirm('Deletar esta tag globalmente?')) return;

    try {
      await axios.delete(`${API}/tags/${tagId}`);
      setAllTags(allTags.filter(t => t.id !== tagId));
      // Remove from selected if it was selected
      setSelectedTags(selectedTags.filter(t => 
        (typeof t === 'string' ? t : t.id) !== tagId
      ));
      toast.success('Tag deletada!');
    } catch (error) {
      toast.error('Erro ao deletar tag');
    }
  };

  const toggleTagSelection = (tag) => {
    const isSelected = selectedTags.some(t => 
      (typeof t === 'string' ? t === tag.name : t.id === tag.id)
    );

    if (isSelected) {
      // Remove tag
      setSelectedTags(selectedTags.filter(t => 
        (typeof t === 'string' ? t !== tag.name : t.id !== tag.id)
      ));
    } else {
      // Add tag
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const isTagSelected = (tag) => {
    return selectedTags.some(t => 
      (typeof t === 'string' ? t === tag.name : t.id === tag.id)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="lg:col-span-4 space-y-6"
    >
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
        <Input
          data-testid="category-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Design Gráfico, Ilustração, etc."
          className="bg-white border-black/20 text-black placeholder:text-black/40 focus-visible:ring-1 focus-visible:ring-[#e38e4d]"
          style={{ fontFamily: 'EB Garamond, serif' }}
        />
      </div>

      {/* Tags - Global System */}
      <div className="bg-white/50 border border-black/10 rounded-2xl p-6">
        <Label className="text-xs font-normal uppercase tracking-widest text-black/60 mb-3 block" style={{ fontFamily: 'EB Garamond, serif' }}>
          Tags do Projeto
        </Label>

        {/* Create New Tag */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createGlobalTag()}
              placeholder="Criar nova tag"
              className="flex-1 bg-white border-black/20 text-black focus-visible:ring-1 focus-visible:ring-[#e38e4d]"
              style={{ fontFamily: 'EB Garamond, serif' }}
            />
            <Button
              onClick={createGlobalTag}
              className="bg-[#e38e4d] text-black hover:bg-[#e38e4d]/90 rounded-lg px-4"
              style={{ fontFamily: 'EB Garamond, serif' }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Color palette for new tag */}
          {tagInput.trim() && (
            <div className="p-4 bg-black/5 rounded-lg space-y-4">
              {/* Color Palette Selection */}
              <div>
                <label className="text-xs text-black/60 block mb-2" style={{ fontFamily: 'EB Garamond, serif' }}>
                  Selecione uma cor
                </label>
                <div className="flex gap-2">
                  {COLOR_PALETTE.map((color, index) => {
                    const isSelected = tagBgColor === color.bg && tagTextColor === color.text;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setTagBgColor(color.bg);
                          setTagTextColor(color.text);
                        }}
                        className={`relative w-10 h-10 rounded-lg transition-all ${
                          isSelected ? 'ring-2 ring-black ring-offset-2' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.bg }}
                        title={color.label}
                      >
                        {isSelected && (
                          <Check 
                            className="absolute inset-0 m-auto w-5 h-5" 
                            style={{ color: color.text }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-xs text-black/60 block mb-2" style={{ fontFamily: 'EB Garamond, serif' }}>
                  Preview da tag
                </label>
                <div
                  className="rounded-full px-4 py-1.5 text-sm inline-block font-medium"
                  style={{
                    fontFamily: 'EB Garamond, serif',
                    backgroundColor: tagBgColor,
                    color: tagTextColor
                  }}
                >
                  {tagInput || 'Sua tag aqui'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Available Tags */}
        <div className="border-t border-black/10 pt-4">
          <label className="text-xs text-black/60 block mb-3" style={{ fontFamily: 'EB Garamond, serif' }}>
            Selecione as tags para este projeto:
          </label>
          {loadingTags ? (
            <div className="text-xs text-black/60">Carregando tags...</div>
          ) : allTags.length === 0 ? (
            <div className="text-xs text-black/60">Nenhuma tag criada ainda</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const selected = isTagSelected(tag);
                return (
                  <div key={tag.id} className="relative group">
                    <button
                      onClick={() => toggleTagSelection(tag)}
                      className={`rounded-full px-3 py-1 text-xs flex items-center gap-2 transition-all ${
                        selected ? 'ring-2 ring-[#e38e4d]' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        fontFamily: 'EB Garamond, serif',
                        backgroundColor: tag.bgColor,
                        color: tag.textColor,
                        border: `1px solid ${tag.bgColor === '#ffffff' ? 'rgba(0,0,0,0.1)' : tag.bgColor}`
                      }}
                    >
                      {selected && <span className="text-[10px]">✓</span>}
                      {tag.name}
                    </button>
                    <button
                      onClick={() => deleteGlobalTag(tag.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
