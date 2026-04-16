import { useEffect, useRef, useState } from 'react';

export default function LazyLoadWrapper({
  children,
  className = '',
  minHeight = 200,
  rootMargin = '300px 0px',
  threshold = 0.01,
  once = true,
  placeholder = null,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const node = targetRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return (
    <div
      ref={targetRef}
      className={className}
      style={!isVisible ? { minHeight: `${minHeight}px` } : undefined}
    >
      {isVisible
        ? children
        : placeholder ?? <div aria-hidden="true" className="w-full h-full rounded-[inherit] bg-black/[0.04]" />}
    </div>
  );
}
