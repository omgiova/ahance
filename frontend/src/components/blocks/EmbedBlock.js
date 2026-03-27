import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';

export default function EmbedBlock({ block, updateBlock }) {
  const [url, setUrl] = useState(block.content.url || '');
  const [tempUrl, setTempUrl] = useState(url);

  const handleSubmit = () => {
    if (tempUrl.trim()) {
      setUrl(tempUrl.trim());
      updateBlock(block.id, {
        content: {
          ...block.content,
          url: tempUrl.trim()
        }
      });
      toast.success('Embed adicionado!');
    }
  };

  return (
    <div className="space-y-4">
      {!url ? (
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-zinc-400">
            URL para Embed (YouTube, Vimeo, Figma, CodePen, etc.)
          </Label>
          <div className="flex gap-2">
            <Input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://..."
              className="bg-black/20 border-white/10 text-zinc-50 focus-visible:ring-1 focus-visible:ring-amber-500"
            />
            <Button
              onClick={handleSubmit}
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            Suporta: YouTube, Vimeo, SoundCloud, Spotify, Figma, CodePen, e mais
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <ReactPlayer
              url={url}
              controls
              width="100%"
              height="400px"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setUrl('');
                setTempUrl('');
                updateBlock(block.id, { content: {} });
              }}
              className="text-zinc-400"
            >
              Trocar embed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}