import { useState, useRef } from 'react';
import { Upload, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ImageBlock({ block, updateBlock, setCoverImage }) {
  const [uploading, setUploading] = useState(false);
  const [width, setWidth] = useState(block.settings?.width || '100');
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateBlock(block.id, {
        content: {
          ...block.content,
          image: response.data.storage_path,
          filename: response.data.original_filename
        }
      });

      // Set as cover image if this is the first image
      if (setCoverImage) {
        setCoverImage(response.data.storage_path);
      }

      toast.success('Imagem enviada!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleWidthChange = (value) => {
    setWidth(value);
    updateBlock(block.id, {
      settings: { ...block.settings, width: value }
    });
  };

  const setAsCover = () => {
    if (block.content.image && setCoverImage) {
      setCoverImage(block.content.image);
      toast.success('Definida como capa!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Width Control */}
      <div className="flex items-center gap-4">
        <Label className="text-xs uppercase tracking-wider text-zinc-400">Largura</Label>
        <Select value={width} onValueChange={handleWidthChange}>
          <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Upload/Display */}
      {!block.content.image ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
        >
          <Upload className="w-12 h-12 text-zinc-400" />
          <p className="text-zinc-400">Clique para fazer upload</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden" style={{ width: `${width}%` }}>
            <img
              src={`${API}/files/${block.content.image}`}
              alt={block.content.filename}
              className="w-full h-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={setAsCover}
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              <Star className="w-4 h-4 mr-2" />
              Definir como capa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-zinc-400"
            >
              Trocar imagem
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}