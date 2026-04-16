import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import ReactPlayer from 'react-player';
import { Document, Page, pdfjs } from 'react-pdf';
import LazyLoadWrapper from '@/components/LazyLoadWrapper';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

function buildCloudinaryOptimizedUrl(url, width = 1600) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/f_auto,q_auto') || /\/w_\d+[,/]/.test(url)) return url;

  const safeWidth = Math.max(200, Math.min(Number(width) || 1600, 2400));
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${safeWidth}/`);
}

function getMediaUrl(path, options = {}) {
  if (!path) return null;

  const { optimize = false, width = 1600 } = options;
  const safeWidth = Math.max(200, Math.min(Number(width) || 1600, 2400));

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return optimize ? buildCloudinaryOptimizedUrl(path, safeWidth) : path;
  }

  const query = optimize ? `?w=${safeWidth}` : '';
  return `${API}/files/${path}${query}`;
}

function detectMediaType(item = {}) {
  const rawType = String(item.type || item.contentType || item.mimeType || '').toLowerCase();
  const rawName = String(item.filename || item.name || item.url || '').toLowerCase();

  if (rawType === 'gdrive') return 'gdrive';
  if (rawType === 'pdf' || rawType.includes('pdf') || /\.pdf($|\?)/i.test(rawName)) return 'pdf';
  if (
    rawType === 'video' ||
    rawType.startsWith('video/') ||
    /youtube|youtu\.be|vimeo|drive\.google\.com/i.test(rawName)
  ) {
    return rawName.includes('drive.google.com') ? 'gdrive' : 'video';
  }
  return 'image';
}

export const PdfCanvasViewer = memo(function PdfCanvasViewer({ url, height, initialZoom = 100, showControls = true }) {
  const wrapperRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(800);
  const [zoom, setZoom] = useState((initialZoom || 100) / 100);
  const [isPdfReady, setIsPdfReady] = useState(false);

  useEffect(() => {
    setZoom((initialZoom || 100) / 100);
  }, [initialZoom]);

  useEffect(() => {
    setNumPages(0);
    setIsPdfReady(false);
  }, [url]);

  useLayoutEffect(() => {
    const updateWidth = () => {
      const width = wrapperRef.current?.clientWidth || 800;
      const nextWidth = Math.max(280, Math.min(width, 1000));
      setPageWidth((current) => (Math.abs(current - nextWidth) > 2 ? nextWidth : current));
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(updateWidth);
      });
      if (wrapperRef.current) observer.observe(wrapperRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="w-full bg-transparent">
      {showControls && (
        <div className="flex items-center justify-end gap-2 mb-3">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="px-2.5 py-1.5 rounded-md border border-black/10 hover:bg-black/5 text-black/70"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-black/60 min-w-[52px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="px-2.5 py-1.5 rounded-md border border-black/10 hover:bg-black/5 text-black/70"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      )}

      <div ref={wrapperRef} className="relative w-full overflow-auto bg-transparent" style={{ maxHeight: `${height}px` }}>
        {!isPdfReady && (
          <div className="absolute inset-0 z-10 bg-transparent" />
        )}

        <div className={`transition-opacity duration-300 ${isPdfReady ? 'opacity-100' : 'opacity-0'}`}>
          <Document
            file={url}
            onLoadSuccess={({ numPages: totalPages }) => setNumPages(totalPages)}
            loading={null}
            error={<div className="py-8 text-center text-black/50" />}
            className="flex flex-col items-center gap-6"
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div key={`pdf-page-${index + 1}`} className="bg-white shadow-sm overflow-hidden">
                <Page
                  pageNumber={index + 1}
                  width={pageWidth * zoom}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  canvasBackground="#ffffff"
                  className="bg-white"
                  onRenderSuccess={() => {
                    if (index === 0) setIsPdfReady(true);
                  }}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
});

export default function BlockRenderer({ block }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [cachedPdfUrls, setCachedPdfUrls] = useState([]);

  useEffect(() => {
    if (block.type !== 'carousel') return;

    const items = block.content.items || (block.content.images || []).map(img => ({ type: 'image', url: img }));
    const currentItem = items[currentIndex];

    if (currentItem && detectMediaType(currentItem) === 'pdf' && currentItem.url) {
      setCachedPdfUrls((prev) => (prev.includes(currentItem.url) ? prev : [...prev, currentItem.url]));
    }
  }, [block, currentIndex]);

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
            className={`prose max-w-none text-black/80 ${textFontSize}`}
            style={{ fontFamily: textFontFamily }}
          >
            {block.content.html ? (
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: block.content.html }} />
            ) : (
              <p className="whitespace-pre-wrap">{block.content.text}</p>
            )}
          </div>
        );

      case 'image':
        if (!block.content.image) return null;
        const imageWidth = block.settings?.width || '100';
        const fullImageUrl = getMediaUrl(block.content.image, { optimize: true, width: 1600 });
        return (
          <div className="flex justify-center">
            <div style={{ width: `${imageWidth}%` }}>
              <img
                src={fullImageUrl}
                alt={block.content.filename || 'Project image'}
                loading="lazy"
                decoding="async"
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
              const gridImgUrl = getMediaUrl(image, { optimize: true, width: 1200 });
              return (
                <div key={index} className="overflow-hidden">
                  <img
                    src={gridImgUrl}
                    alt={`Grid image ${index + 1}`}
                    loading="lazy"
                    decoding="async"
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
          const mediaType = detectMediaType(item);

          if (mediaType === 'gdrive') {
            const ratioMap = { landscape: '56.25%', portrait: '177.78%', square: '100%' };
            const paddingTop = ratioMap[item.orientation] || '56.25%';
            const width = item.orientation === 'portrait' ? '394px' : '100%';
            return (
              <LazyLoadWrapper className="w-full h-full flex items-center justify-center" minHeight={420}>
                <div className="w-full h-full flex items-center justify-center">
                  <div style={{ position: 'relative', paddingTop, width, maxWidth: '100%' }}>
                    <iframe
                      src={item.url}
                      loading="lazy"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              </LazyLoadWrapper>
            );
          }

          const fullUrl = mediaType === 'image'
            ? getMediaUrl(item.url, { optimize: true, width: 1600 })
            : getMediaUrl(item.url);

          if (mediaType === 'video') {
            return (
              <LazyLoadWrapper className="w-full h-full flex items-center justify-center" minHeight={420}>
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
                      preload="metadata"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              </LazyLoadWrapper>
            );
          }

          if (mediaType === 'pdf') {
            return (
              <LazyLoadWrapper className="w-full h-full overflow-auto bg-transparent px-4 py-2" minHeight={620}>
                <PdfCanvasViewer
                  url={fullUrl}
                  height={620}
                  initialZoom={parseInt(item.zoom || '100', 10)}
                  showControls={true}
                />
              </LazyLoadWrapper>
            );
          }

          return (
            <img
              src={fullUrl}
              alt={`Slide ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-full object-contain"
              onClick={() => setExpandedImage(fullUrl)}
            />
          );
        };

        return (
          <div className="relative w-full flex flex-col items-center">
            <div className="relative w-full bg-transparent overflow-hidden" style={{ height: '700px', maxHeight: 'calc(100vh - 100px)' }}>
              {carouselItems.map((item, index) => {
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
          <div
            className="relative w-full bg-transparent overflow-hidden"
            style={{ height: '700px', maxHeight: 'calc(100vh - 100px)' }}
          >
            <LazyLoadWrapper className="w-full h-full flex items-center justify-center" minHeight={520}>
              {block.content.type === 'gdrive' ? (() => {
                const ratioMap = { landscape: '56.25%', portrait: '177.78%', square: '100%' };
                const isPortrait = block.content.orientation === 'portrait';
                const isSquare = block.content.orientation === 'square';
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      style={{
                        position: 'relative',
                        width: isPortrait ? '394px' : '100%',
                        maxWidth: '100%',
                        paddingTop: isPortrait ? '177.78%' : isSquare ? '100%' : '56.25%',
                      }}
                    >
                      <iframe
                        src={videoSrc}
                        loading="lazy"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  </div>
                );
              })() : block.content.type === 'url' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
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
                </div>
              ) : (
                <video
                  src={videoSrc}
                  controls
                  preload="metadata"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </LazyLoadWrapper>
          </div>
        );

      case 'embed':
        if (!block.content.url) return null;
        return (
          <LazyLoadWrapper minHeight={260}>
            <div className="relative bg-black">
              <ReactPlayer
                url={block.content.url}
                controls
                width="100%"
                height="auto"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
          </LazyLoadWrapper>
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

        return (
          <LazyLoadWrapper minHeight={pdfHeight}>
            <PdfCanvasViewer
              url={pdfUrl}
              height={pdfHeight}
              initialZoom={parseInt(block.settings?.zoom || '100', 10)}
            />
          </LazyLoadWrapper>
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
