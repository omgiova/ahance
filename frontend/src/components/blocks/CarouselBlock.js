import { useEffect, useState, useRef } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, Link as LinkIcon, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';
import { PdfCanvasViewer } from '@/components/BlockRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CarouselBlock({ block, updateBlock }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragSrcIndex, setDragSrcIndex] = useState(null);
  const [cachedPdfUrls, setCachedPdfUrls] = useState([]);
  const fileInputRef = useRef(null);

  const detectMediaType = (item = {}) => {
    const rawType = String(item.type || item.contentType || item.mimeType || '').toLowerCase();
    const rawName = String(item.filename || item.name || item.url || '').toLowerCase();
    const sourceType = String(item.sourceType || '').toLowerCase();

    if (rawType === 'pdf' || rawType.includes('pdf') || /\.pdf($|\?)/i.test(rawName)) return 'pdf';
    if (
      rawType === 'video' ||
      rawType === 'url' ||
      rawType.startsWith('video/') ||
      sourceType === 'url' ||
      /youtube|youtu\.be|vimeo|\.mp4($|\?)/i.test(rawName)
    ) {
      return 'video';
    }
    return 'image';
  };

  // Normaliza itens para suportar tanto o formato antigo (apenas imagens) quanto o novo (mídia mista)
  const items = (block.content.items || (block.content.images || []).map(img => ({ type: 'image', url: img })))
    .map(item => ({ ...item, type: detectMediaType(item) }));

  useEffect(() => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    if (detectMediaType(currentItem) === 'pdf' && currentItem.url) {
      setCachedPdfUrls((prev) => (prev.includes(currentItem.url) ? prev : [...prev, currentItem.url]));
    }
  }, [items, currentIndex]);

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
          type: detectMediaType({
            type: file.type,
            filename: response.data.original_filename || file.name,
            url: response.data.storage_path
          }),
          url: response.data.storage_path,
          sourceType: 'upload',
          filename: response.data.original_filename || file.name,
          contentType: response.data.content_type || file.type,
          zoom: 100
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
      const detail = error?.response?.data?.detail || error?.message || 'Erro ao enviar arquivos';
      toast.error(`Erro ao enviar arquivos: ${detail}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!videoUrl.trim()) return;

    const rawUrl = videoUrl.trim();
    const isPdfUrl = /\.pdf($|\?)/i.test(rawUrl);
    const newItem = isPdfUrl
      ? {
          type: detectMediaType({ type: 'pdf', url: rawUrl, filename: 'PDF externo' }),
          url: rawUrl,
          sourceType: 'url',
          filename: 'PDF externo',
          contentType: 'application/pdf',
          zoom: 100
        }
      : { type: 'video', url: rawUrl, sourceType: 'url' };

    updateBlock(block.id, {
      content: {
        ...block.content,
        items: [...items, newItem],
        images: undefined
      }
    });

    setVideoUrl('');
    setShowUrlInput(false);
    toast.success(isPdfUrl ? 'PDF adicionado via URL!' : 'Vídeo adicionado via URL!');
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

  const ORIENTATIONS = [
    { value: 'landscape', label: 'Horizontal', ratio: '56.25%' },
    { value: 'portrait',  label: 'Vertical',   ratio: '177.78%' },
    { value: 'square',    label: 'Quadrado',   ratio: '100%' },
  ];

  const updateItemOrientation = (index, orientation) => {
    const newItems = items.map((it, i) => i === index ? { ...it, orientation } : it);
    updateBlock(block.id, { content: { ...block.content, items: newItems } });
  };

  const updateItemZoom = (index, zoom) => {
    const normalizedZoom = Math.max(20, Math.min(250, parseInt(zoom || '100', 10)));
    if (parseInt(items[index]?.zoom || '100', 10) === normalizedZoom) return;

    const newItems = items.map((it, i) => i === index ? { ...it, zoom: normalizedZoom } : it);
    updateBlock(block.id, { content: { ...block.content, items: newItems } });
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    updateBlock(block.id, { content: { ...block.content, items: newItems } });
    setCurrentIndex(toIndex);
  };

  const handleThumbnailDragStart = (e, index) => {
    setDragSrcIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleThumbnailDrop = (e, toIndex) => {
    e.preventDefault();
    if (dragSrcIndex === null || dragSrcIndex === toIndex) { setDragSrcIndex(null); return; }
    const newItems = [...items];
    const [moved] = newItems.splice(dragSrcIndex, 1);
    newItems.splice(toIndex, 0, moved);
    updateBlock(block.id, { content: { ...block.content, items: newItems } });
    setCurrentIndex(toIndex);
    setDragSrcIndex(null);
  };

  const getThumbnailUrl = (item) => {
    if (detectMediaType(item) === 'image' && item.url) {
      return item.url.startsWith('http://') || item.url.startsWith('https://')
        ? item.url
        : `${API}/files/${item.url}`;
    }
    return null;
  };

  const renderCarouselItem = (item, index) => {
    if (!item) return null;

    const mediaType = detectMediaType(item);

    const fullUrl = item.url?.startsWith('http://') || item.url?.startsWith('https://')
      ? item.url
      : `${API}/files/${item.url}`;

    if (mediaType === 'video') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          {item.sourceType === 'url' || /^https?:/i.test(item.url || '') ? (
            <ReactPlayer url={fullUrl} width="100%" height="100%" controls />
          ) : (
            <video src={fullUrl} controls className="max-w-full max-h-full object-contain" />
          )}
        </div>
      );
    }

    if (mediaType === 'pdf') {
      return (
        <div className="w-full h-full bg-transparent overflow-auto p-3">
          <PdfCanvasViewer
            url={fullUrl}
            height={520}
            initialZoom={parseInt(item.zoom || '100', 10)}
            showControls={true}
            onZoomChange={(nextZoom) => updateItemZoom(index, nextZoom)}
          />
        </div>
      );
    }

    return (
      <img
        src={fullUrl}
        alt={`Slide ${index + 1}`}
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
          URL Mídia
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
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
            placeholder="Cole o link do YouTube, Vimeo ou de um PDF..."
            className="h-8 bg-black/40 border-white/10"
          />
          <Button size="sm" onClick={handleAddUrl} className="bg-amber-500 text-zinc-950">
            Adicionar
          </Button>
        </div>
      )}

      {items.length > 0 ? (
        <>
        <div className="relative rounded-2xl overflow-hidden bg-black/20 group">
          <div className="relative h-[600px]">
            {items.map((item, index) => {
              const mediaType = detectMediaType(item);
              const shouldKeepMounted = index === currentIndex || (mediaType === 'pdf' && cachedPdfUrls.includes(item.url));

              if (!shouldKeepMounted) return null;

              return (
                <div
                  key={`${item.url || 'item'}-${index}`}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                    index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                  }`}
                >
                  {renderCarouselItem(item, index)}
                </div>
              );
            })}
            <button
              onClick={() => removeItem(currentIndex)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors opacity-0 group-hover:opacity-100 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Move left/right buttons */}
            {items.length > 1 && (
              <>
                <button
                  onClick={() => moveItem(currentIndex, currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="absolute top-4 left-14 bg-white/20 hover:bg-white/40 disabled:opacity-20 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Mover para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(currentIndex, currentIndex + 1)}
                  disabled={currentIndex === items.length - 1}
                  className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 disabled:opacity-20 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Mover para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
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

            </>
          )}
        </div>

        {/* Thumbnail strip for reordering */}
        {items.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {items.map((item, index) => {
              const thumbUrl = getThumbnailUrl(item);
              const isActive = index === currentIndex;
              const isDragging = dragSrcIndex === index;
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleThumbnailDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleThumbnailDrop(e, index)}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden cursor-grab flex-shrink-0 transition-all ${
                    isActive
                      ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900'
                      : 'ring-1 ring-white/10 hover:ring-white/30'
                  } ${isDragging ? 'opacity-30' : 'opacity-100'}`}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      {detectMediaType(item) === 'pdf' ? (
                        <FileText className="w-5 h-5 text-zinc-300" />
                      ) : (
                        <Video className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-1 text-[10px] text-white/60 leading-none">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        </>
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
