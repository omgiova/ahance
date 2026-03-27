import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SpacerBlock({ block, updateBlock }) {
  const [height, setHeight] = useState(block.settings?.height || '50');

  const handleHeightChange = (value) => {
    setHeight(value);
    updateBlock(block.id, {
      settings: { ...block.settings, height: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label className="text-xs uppercase tracking-wider text-zinc-400">Altura do Espaço</Label>
        <Select value={height} onValueChange={handleHeightChange}>
          <SelectTrigger className="w-32 bg-black/20 border-white/10 text-zinc-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 text-zinc-100">
            <SelectItem value="25">Pequeno (25px)</SelectItem>
            <SelectItem value="50">Médio (50px)</SelectItem>
            <SelectItem value="100">Grande (100px)</SelectItem>
            <SelectItem value="150">Extra Grande (150px)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spacer Preview */}
      <div className="flex items-center justify-center text-zinc-600 text-sm">
        <div
          className="border-2 border-dashed border-white/10 rounded-lg w-full flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          Espaço em branco ({height}px)
        </div>
      </div>
    </div>
  );
}