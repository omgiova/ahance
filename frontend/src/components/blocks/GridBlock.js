import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function GridBlock({ block, updateBlock }) {
  const [columns, setColumns] = useState(block.settings?.columns || '2');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const images = block.content.images || [];

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
        return response.data.storage_path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);

      updateBlock(block.id, {
        content: {
          ...block.content,
          images: [...images, ...uploadedPaths]
        }
      });

      toast.success(`${files.length} imagem(ns) enviada(s)!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagens');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    updateBlock(block.id, {
      content: { ...block.content, images: newImages }
    });
  };

  const handleColumnsChange = (value) => {
    setColumns(value);
    updateBlock(block.id, {
      settings: { ...block.settings, columns: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* Columns Control */}
      <div className="flex items-center gap-4">
        <Label className="text-xs uppercase tracking-wider text-zinc-400">Colunas</Label>
        <Select value={columns} onValueChange={handleColumnsChange}>
          <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Adicionar imagens'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Grid Display */}
      {images.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="relative group rounded-2xl overflow-hidden">
              <img
                src={`${API}/files/${image}`}
                alt={`Grid ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
        >
          <Upload className="w-12 h-12 text-zinc-400" />
          <p className="text-zinc-400">Clique para adicionar imagens ao grid</p>
        </div>
      )}
    </div>
  );
}