'use client';

import { useState } from 'react';

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import type { PropertyImage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <p className="text-neutral-500">No images available</p>
      </div>
    );
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const primaryIndex = sortedImages.findIndex((img) => img.is_primary) || 0;

  const [activeIndex, setActiveIndex] = useState(primaryIndex);

  const handlePrev = () => setActiveIndex((i) => (i === 0 ? sortedImages.length - 1 : i - 1));
  const handleNext = () => setActiveIndex((i) => (i === sortedImages.length - 1 ? 0 : i + 1));

  const openLightbox = (idx: number) => {
    setCurrentIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl">
        {/* Main image grid */}
        {sortedImages.length === 1 ? (
          <div
            className="relative h-96 cursor-pointer md:h-[500px]"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={sortedImages[0].url}
              alt={sortedImages[0].caption || title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
            />
            <button className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid h-[400px] gap-1 md:h-[500px] grid-cols-4 grid-rows-2">
            {/* Main large image */}
            <div
              className="relative col-span-3 row-span-2 cursor-pointer overflow-hidden"
              onClick={() => openLightbox(activeIndex)}
            >
              <Image
                src={sortedImages[activeIndex].url}
                alt={sortedImages[activeIndex].caption || title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <button className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80">
                <ZoomIn className="h-4 w-4" />
              </button>
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
                {activeIndex + 1} / {sortedImages.length}
              </div>
            </div>

            {/* Thumbnail column */}
            <div className="col-span-1 flex flex-col gap-1">
              {sortedImages.slice(0, 4).map((img, idx) => (
                <div
                  key={img.id}
                  className={cn(
                    'relative flex-1 cursor-pointer overflow-hidden',
                    idx === 3 && sortedImages.length > 4 ? 'group relative' : ''
                  )}
                  onClick={() => {
                    setActiveIndex(idx);
                    if (idx === 3 && sortedImages.length > 4) {
                      openLightbox(idx);
                    }
                  }}
                >
                  <Image
                    src={img.thumbnail_url || img.url}
                    alt={img.caption || `Image ${idx + 1}`}
                    fill
                    className={cn(
                      'object-cover transition-opacity duration-200',
                      activeIndex === idx ? 'ring-2 ring-primary-500' : 'hover:opacity-80'
                    )}
                    sizes="150px"
                  />
                  {idx === 3 && sortedImages.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                      +{sortedImages.length - 4} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 text-white hover:bg-white/10"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>

          <button
            onClick={() => setCurrentIndex((i) => (i === 0 ? sortedImages.length - 1 : i - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative mx-16 h-[80vh] w-full max-w-5xl">
            <Image
              src={sortedImages[currentIndex].url}
              alt={sortedImages[currentIndex].caption || title}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <button
            onClick={() => setCurrentIndex((i) => (i === sortedImages.length - 1 ? 0 : i + 1))}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white">
            {currentIndex + 1} / {sortedImages.length}
            {sortedImages[currentIndex].caption && (
              <span className="ml-2 text-white/70">— {sortedImages[currentIndex].caption}</span>
            )}
          </div>

          {/* Thumbnails strip */}
          <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-2">
            {sortedImages.slice(
              Math.max(0, currentIndex - 4),
              Math.min(sortedImages.length, currentIndex + 5)
            ).map((img, idx) => {
              const realIdx = Math.max(0, currentIndex - 4) + idx;
              return (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(realIdx)}
                  className={cn(
                    'relative h-12 w-16 overflow-hidden rounded transition-all',
                    realIdx === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                  )}
                >
                  <Image
                    src={img.thumbnail_url || img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
