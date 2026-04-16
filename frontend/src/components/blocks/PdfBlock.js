import { useState, useRef } from 'react';
import { Upload, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


export default function PdfBlock({ block, updateBlock }) {
  const [uploading, setUploading] = useState(false);
  const [sourceMode, setSourceMode] = useState('upload');
  const [externalUrl, setExternalUrl] = useState('');
  const fileInputRef = useRef(null);

  const height = block.settings?.height || '700';
  const zoom = parseInt(block.settings?.zoom || '100', 10);

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
          url: response.data.download_url,
          sourceType: 'upload',
          filename: response.data.original_filename
        }
      });

      toast.success('PDF enviado!');
    } catch (error) {
      console.error('Upload error:', error);
      const detail = error?.response?.data?.detail || error?.message || 'Erro ao enviar PDF';
      toast.error(`Erro ao enviar PDF: ${detail}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExternalUrl = () => {
    if (!externalUrl.trim()) return;
    updateBlock(block.id, {
      content: {
        url: externalUrl.trim(),
        sourceType: 'url',
        filename: 'Documento externo'
      }
    });
    toast.success('URL adicionada!');
  };

  const updateSetting = (key, value) => {
    updateBlock(block.id, { settings: { ...block.settings, [key]: value } });
  };

  return (
    <div className="space-y-4">
      {/* Settings row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase tracking-wider text-zinc-400">Altura</Label>
          <Select value={height} onValueChange={(v) => updateSetting('height', v)}>
            <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
              <SelectItem value="500">500px</SelectItem>
              <SelectItem value="700">700px</SelectItem>
              <SelectItem value="900">900px</SelectItem>
              <SelectItem value="1100">1100px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs uppercase tracking-wider text-zinc-400">Zoom inicial</Label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <button
              type="button"
              onClick={() => updateSetting('zoom', String(Math.max(20, zoom - 10)))}
              className="w-7 h-7 rounded-md hover:bg-white/10 text-zinc-100"
            >
              -
            </button>
            <span className="min-w-[52px] text-center text-sm text-zinc-100">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => updateSetting('zoom', String(Math.min(200, zoom + 10)))}
              className="w-7 h-7 rounded-md hover:bg-white/10 text-zinc-100"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        O PDF agora usa apenas a renderização limpa, com zoom inicial configurável.
      </p>

      {/* Source */}
      {!block.content?.url ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sourceMode === 'upload' ? 'default' : 'ghost'}
              onClick={() => setSourceMode('upload')}
              className={sourceMode === 'upload' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload PDF
            </Button>
            <Button
              size="sm"
              variant={sourceMode === 'url' ? 'default' : 'ghost'}
              onClick={() => setSourceMode('url')}
              className={sourceMode === 'url' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}
            >
              <Link2 className="w-4 h-4 mr-2" /> URL externa
            </Button>
          </div>

          {sourceMode === 'upload' ? (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              {uploading ? (
                <p className="text-zinc-400">Enviando...</p>
              ) : (
                <>
                  <FileText className="w-12 h-12 text-zinc-400" />
                  <p className="text-zinc-400">Clique para fazer upload do PDF</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExternalUrl()}
                placeholder="Cole uma URL direta de PDF"
                className="bg-black/20 border-white/10 text-zinc-50"
              />
              <Button onClick={handleExternalUrl} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
                Adicionar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            {block.content.filename || 'PDF adicionado'}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateBlock(block.id, { content: {} })}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Trocar PDF
          </Button>
        </div>
      )}
    </div>
  );
}
