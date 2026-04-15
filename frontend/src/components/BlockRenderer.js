import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ReactPlayer from 'react-player';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API}/files/${path}`;
}

export default function BlockRenderer({ block }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);

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
        const fullImageUrl = getMediaUrl(block.content.image);
        return (
          <div className="flex justify-center">
            <div style={{ width: `${imageWidth}%` }}>
              <img
                src={fullImageUrl}
                alt={block.content.filename || 'Project image'}
                className="w-full h-auto"
                onClick={() => setExpandedImage(fullImageUrl)}
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
            {block.content.images.map((image, index) => {
              const gridImgUrl = getMediaUrl(image);
              return (
                <div key={index} className="overflow-hidden">
                  <img
                    src={gridImgUrl}
                    alt={`Grid image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onClick={() => setExpandedImage(gridImgUrl)}
                  />
                </div>
              );
            })}
          </div>
        );

      case 'carousel':
        const carouselItems = block.content.items || (block.content.images || []).map(img => ({ type: 'image', url: img }));
        if (carouselItems.length === 0) return null;
        
        const renderCarouselItem = (item, index) => {
          if (item.type === 'gdrive') {
            const ratioMap = { landscape: '56.25%', portrait: '177.78%', square: '100%' };
            const paddingTop = ratioMap[item.orientation] || '56.25%';
            const width = item.orientation === 'portrait' ? '394px' : '100%';
            return (
              <div className="w-full h-full flex items-center justify-center">
                <div style={{ position: 'relative', paddingTop, width, maxWidth: '100%' }}>
                  <iframe
                    src={item.url}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            );
          }

          const fullUrl = item.sourceType === 'url' ? item.url : getMediaUrl(item.url);

          if (item.type === 'video') {
            return (
              <div className="w-full h-full flex items-center justify-center">
                {item.sourceType === 'url' ? (
                  <div className="w-full h-full">
                    <ReactPlayer 
                      url={fullUrl} 
                      width="100%" 
                      height="100%" 
                      controls 
                    />
                  </div>
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
              alt={`Slide ${index + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={() => setExpandedImage(fullUrl)}
            />
          );
        };

        return (
          <div className="relative w-full flex flex-col items-center">
            <div className="relative w-full bg-transparent overflow-hidden flex items-center justify-center" style={{ height: '700px', maxHeight: 'calc(100vh - 100px)' }}>
              {renderCarouselItem(carouselItems[currentIndex], currentIndex)}
              
              {carouselItems.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-4 transition-all z-20 shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % carouselItems.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-4 transition-all z-20 shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
                    {carouselItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex
                            ? 'bg-[#e38e4d] w-10 shadow-[0_0_10px_rgba(227,142,77,0.5)]'
                            : 'bg-black/30 hover:bg-black/50 w-2'
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
          ? getMediaUrl(block.content.video)
          : block.content.url;
        
        if (!videoSrc) return null;

        return (
          <div className="relative w-full">
            {block.content.type === 'gdrive' ? (() => {
              const ratioMap = { landscape: '56.25%', portrait: '177.78%', square: '100%' };
              const paddingTop = ratioMap[block.content.orientation] || '56.25%';
              const isPortrait = block.content.orientation === 'portrait';
              const isSquare = block.content.orientation === 'square';
              return (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    position: 'relative',
                    width: isPortrait ? '394px' : '100%',
                    maxWidth: '100%',
                    paddingTop: isPortrait ? '177.78%' : isSquare ? '100%' : '56.25%',
                  }}>
                    <iframe
                      src={videoSrc}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              );
            })() : block.content.type === 'url' ? (
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <ReactPlayer
                  url={videoSrc}
                  controls
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                  config={{
                    youtube: {
                      playerVars: { showinfo: 1 }
                    },
                    vimeo: {
                      playerOptions: { responsive: true }
                    }
                  }}
                />
              </div>
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

      case 'pdf': {
        const pdfUrl = block.content?.url;
        if (!pdfUrl) return null;
        const pdfHeight = parseInt(block.settings?.height || '700', 10);

        // Normaliza Google Drive para preview embeddable
        const gdMatch = pdfUrl.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
        const isGoogleDrivePreview = pdfUrl.includes('drive.google.com') && pdfUrl.includes('/preview');
        const normalizedUrl = gdMatch
          ? `https://drive.google.com/file/d/${gdMatch[1]}/preview`
          : pdfUrl;

        // Usa Google Docs Viewer sempre, exceto se já for um Google Drive /preview
        // (evita download de arquivos Cloudinary raw/upload sem content-type inline)
        const iframeSrc = isGoogleDrivePreview
          ? normalizedUrl
          : `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(normalizedUrl)}`;

        return (
          <iframe
            src={iframeSrc}
            width="100%"
            height={`${pdfHeight}px`}
            title={block.content?.filename || 'PDF'}
            loading="lazy"
            style={{ border: 'none', display: 'block' }}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderBlock()}

      {/* Lightbox Overlay */}
      {expandedImage && createPortal(
        <div 
          className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setExpandedImage(null)}
        >
          <button 
            className="absolute top-8 right-8 bg-[#F6DFCF] text-zinc-400 hover:scale-110 active:scale-95 transition-all p-3 rounded-full shadow-2xl z-[1000000] flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedImage(null);
            }}
          >
            <X className="w-8 h-8 stroke-[1px]" />
          </button>
          <img 
            src={expandedImage} 
            alt="Expanded view" 
            className="max-w-[95%] max-h-[95%] object-contain shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
