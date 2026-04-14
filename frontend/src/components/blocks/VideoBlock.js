import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VideoBlock({ block, updateBlock }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(block.content.url || '');
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
          video: response.data.storage_path,
          type: 'upload'
        }
      });

      toast.success('Vídeo enviado!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  const parseGoogleDriveUrl = (raw) => {
    try {
      const u = new URL(raw);
      if (!u.host.includes('drive.google.com')) return null;
      // /file/d/{ID}/...
      const match = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
      // ?id={ID}
      const id = u.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    } catch (_) {}
    return null;
  };

  const handleUrlSubmit = () => {
    if (url.trim()) {
      const gdriveEmbed = parseGoogleDriveUrl(url.trim());
      if (gdriveEmbed) {
        updateBlock(block.id, {
          content: { ...block.content, url: gdriveEmbed, type: 'gdrive', orientation: 'landscape' }
        });
        toast.success('Vídeo do Google Drive adicionado!');
      } else {
        updateBlock(block.id, {
          content: { ...block.content, url: url.trim(), type: 'url' }
        });
        toast.success('URL do vídeo adicionada!');
      }
    }
  };

  const ORIENTATIONS = [
    { value: 'landscape', label: 'Horizontal', ratio: '56.25%' },   // 16:9
    { value: 'portrait',  label: 'Vertical',   ratio: '177.78%' },  // 9:16
    { value: 'square',    label: 'Quadrado',   ratio: '100%' },      // 1:1
  ];

  const currentOrientation = block.content.orientation || 'landscape';
  const currentRatio = ORIENTATIONS.find(o => o.value === currentOrientation)?.ratio || '56.25%';

  const videoSrc = block.content.type === 'upload' && block.content.video
    ? `${API}/files/${block.content.video}`
    : block.content.url;

  return (
    <div className="space-y-4">
      {!videoSrc ? (
        <>
          {/* Upload Option */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
          >
            <Upload className="w-12 h-12 text-zinc-400" />
            <p className="text-zinc-400">Clique para fazer upload de vídeo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>

          {/* URL Option */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">ou</span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-zinc-400">URL do vídeo (YouTube, Vimeo, Google Drive, etc.)</Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou link do Google Drive"
                className="bg-black/20 border-white/10 text-zinc-50 focus-visible:ring-1 focus-visible:ring-amber-500"
              />
              <Button
                onClick={handleUrlSubmit}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full flex items-center justify-center bg-black/10 rounded-lg p-4">
            {block.content.type === 'gdrive' ? (
              <div className="w-full" style={{ position: 'relative', paddingTop: currentRatio }}>
                <iframe
                  src={videoSrc}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : block.content.type === 'url' ? (
              <div className="w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <ReactPlayer
                  url={videoSrc}
                  controls
                  width="100%"
                  height="100%"
                  config={{
                    youtube: { playerVars: { showinfo: 1 } },
                    vimeo: { playerOptions: { responsive: true } }
                  }}
                />
              </div>
            ) : (
              <video
                src={videoSrc}
                controls
                style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', width: 'auto', height: 'auto' }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                updateBlock(block.id, { content: {} });
                setUrl('');
              }}
              className="text-zinc-400"
            >
              Trocar vídeo
            </Button>
            {block.content.type === 'gdrive' && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-zinc-500">Formato:</span>
                {ORIENTATIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => updateBlock(block.id, { content: { ...block.content, orientation: o.value } })}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      currentOrientation === o.value
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}