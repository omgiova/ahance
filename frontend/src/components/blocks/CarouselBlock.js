import { useState, useRef } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CarouselBlock({ block, updateBlock }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  // Normaliza itens para suportar tanto o formato antigo (apenas imagens) quanto o novo (mídia mista)
  const items = block.content.items || (block.content.images || []).map(img => ({ type: 'image', url: img }));

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        return {
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: response.data.storage_path,
          sourceType: 'upload'
        };
      });

      const uploadedItems = await Promise.all(uploadPromises);

      updateBlock(block.id, {
        content: {
          ...block.content,
          items: [...items, ...uploadedItems],
          images: undefined
        }
      });

      toast.success(`${files.length} item(ns) enviado(s)!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!videoUrl.trim()) return;
    
    const newItem = {
      type: 'video',
      url: videoUrl.trim(),
      sourceType: 'url'
    };

    updateBlock(block.id, {
      content: {
        ...block.content,
        items: [...items, newItem],
        images: undefined
      }
    });

    setVideoUrl('');
    setShowUrlInput(false);
    toast.success('Vídeo adicionado via URL!');
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    updateBlock(block.id, {
      content: { ...block.content, items: newItems }
    });
    if (currentIndex >= newItems.length) {
      setCurrentIndex(Math.max(0, newItems.length - 1));
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const renderCurrentItem = () => {
    const item = items[currentIndex];
    if (!item) return null;

    const fullUrl = item.sourceType === 'url' ? item.url : `${API}/files/${item.url}`;

    if (item.type === 'video') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {item.sourceType === 'url' ? (
            <ReactPlayer 
              url={fullUrl} 
              width="100%" 
              height="100%" 
              controls 
            />
          ) : (
            <video 
              src={fullUrl} 
              controls 
              className="max-w-full max-h-full object-contain" 
            />
          )}
        </div>
      );
    }

    return (
      <img
        src={fullUrl}
        alt={`Slide ${currentIndex + 1}`}
        className="max-w-full max-h-full object-contain"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Adicionar Mídia'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="border-white/10 text-zinc-400 hover:text-zinc-50"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          URL Vídeo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-black/20 rounded-lg border border-white/5 animate-in slide-in-from-top-2">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Cole o link do YouTube, Vimeo..."
            className="h-8 bg-black/40 border-white/10"
          />
          <Button size="sm" onClick={handleAddUrl} className="bg-amber-500 text-zinc-950">
            Adicionar
          </Button>
        </div>
      )}

      {items.length > 0 ? (
        <div className="relative rounded-2xl overflow-hidden bg-black/20 group">
          <div className="relative h-[600px] flex items-center justify-center">
            {renderCurrentItem()}
            <button
              onClick={() => removeItem(currentIndex)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors opacity-0 group-hover:opacity-100 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {items.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full p-3 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-amber-500 w-10 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-white/30 hover:bg-white/50 w-2'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
        >
          <Upload className="w-12 h-12 text-zinc-400" />
          <p className="text-zinc-400">Clique para adicionar mídias ao carrossel</p>
        </div>
      )}
    </div>
  );
}
