import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextBlock from '@/components/blocks/TextBlock';
import ImageBlock from '@/components/blocks/ImageBlock';
import GridBlock from '@/components/blocks/GridBlock';
import CarouselBlock from '@/components/blocks/CarouselBlock';
import VideoBlock from '@/components/blocks/VideoBlock';
import EmbedBlock from '@/components/blocks/EmbedBlock';
import SeparatorBlock from '@/components/blocks/SeparatorBlock';
import SpacerBlock from '@/components/blocks/SpacerBlock';

const BLOCK_COMPONENTS = {
  text: TextBlock,
  image: ImageBlock,
  grid: GridBlock,
  carousel: CarouselBlock,
  video: VideoBlock,
  embed: EmbedBlock,
  separator: SeparatorBlock,
  spacer: SpacerBlock
};

export default function SortableBlock({ block, updateBlock, deleteBlock, duplicateBlock, setCoverImage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const BlockComponent = BLOCK_COMPONENTS[block.type];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative"
    >
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden hover:border-white/20 transition-all">
        {/* Block Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-100"
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <span className="text-xs uppercase tracking-wider text-zinc-400">
              {block.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => duplicateBlock(block.id)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteBlock(block.id)}
              className="text-zinc-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Block Content */}
        <div className="p-6">
          {BlockComponent && (
            <BlockComponent
              block={block}
              updateBlock={updateBlock}
              setCoverImage={setCoverImage}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}