import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BlockRenderer({ block }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        const textFontSize = {
          'sm': 'text-sm',
          'base': 'text-base',
          'lg': 'text-lg',
          'xl': 'text-xl',
          '2xl': 'text-2xl'
        }[block.settings?.fontSize || 'base'];
        
        const textFontFamily = {
          'serif': 'EB Garamond, serif',
          'sans': 'Arial, sans-serif',
          'mono': 'Courier New, monospace',
          'georgia': 'Georgia, serif',
          'verdana': 'Verdana, sans-serif'
        }[block.settings?.fontFamily || 'serif'];
        
        return (
          <div 
            className={`prose max-w-none text-black/80 ${textFontSize} ${
              block.settings?.bold ? 'font-bold' : ''
            } ${block.settings?.italic ? 'italic' : ''}`}
            style={{ fontFamily: textFontFamily }}
          >
            <p className="whitespace-pre-wrap">{block.content.text}</p>
          </div>
        );

      case 'image':
        if (!block.content.image) return null;
        const imageWidth = block.settings?.width || '100';
        return (
          <div className="flex justify-center">
            <div style={{ width: `${imageWidth}%` }}>
              <img
                src={`${API}/files/${block.content.image}`}
                alt={block.content.filename || 'Project image'}
                className="w-full h-auto"
              />
            </div>
          </div>
        );

      case 'grid':
        if (!block.content.images || block.content.images.length === 0) return null;
        const columns = block.settings?.columns || '2';
        return (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {block.content.images.map((image, index) => (
              <div key={index} className="overflow-hidden">
                <img
                  src={`${API}/files/${image}`}
                  alt={`Grid image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        );

      case 'carousel':
        if (!block.content.images || block.content.images.length === 0) return null;
        const images = block.content.images;
        
        return (
          <div className="relative">
            <div className="relative aspect-[16/9] bg-black/5 overflow-hidden">
              <img
                src={`${API}/files/${images[currentIndex]}`}
                alt={`Slide ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-black" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-black" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? 'bg-[#e38e4d] w-8'
                            : 'bg-black/30 hover:bg-black/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'video':
        const videoSrc = block.content.type === 'upload' && block.content.video
          ? `${API}/files/${block.content.video}`
          : block.content.url;
        
        if (!videoSrc) return null;

        return (
          <div className="relative bg-black">
            {block.content.type === 'url' ? (
              <ReactPlayer
                url={videoSrc}
                controls
                width="100%"
                height="auto"
                style={{ aspectRatio: '16/9' }}
              />
            ) : (
              <video
                src={videoSrc}
                controls
                className="w-full h-auto"
              />
            )}
          </div>
        );

      case 'embed':
        if (!block.content.url) return null;
        return (
          <div className="relative bg-black">
            <ReactPlayer
              url={block.content.url}
              controls
              width="100%"
              height="auto"
              style={{ aspectRatio: '16/9' }}
            />
          </div>
        );

      case 'separator':
        const separatorStyle = block.settings?.style || 'solid';
        const separatorWidth = block.settings?.width || '100';
        return (
          <div className="flex justify-center py-8">
            <div
              className="border-t-2 border-black/20"
              style={{
                width: `${separatorWidth}%`,
                borderStyle: separatorStyle
              }}
            />
          </div>
        );

      case 'spacer':
        const height = block.settings?.height || '50';
        return <div style={{ height: `${height}px` }} />;

      default:
        return null;
    }
  };

  return <div className="w-full">{renderBlock()}</div>;
}
