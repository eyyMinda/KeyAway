"use client";

import { useState } from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import { Program } from "@/src/types";

interface RelatedProgramsProps {
  programs: Program[];
  currentSlug: string;
}

export default function RelatedPrograms({ programs, currentSlug }: RelatedProgramsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 3;
  const maxIndex = Math.max(0, programs.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (programs.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-neutral-900 to-neutral-800">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">You Might Also Be Interested In</h2>
          <p className="text-xl text-gray-300">Discover more premium software with free CD keys</p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          {programs.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:opacity-50 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:cursor-not-allowed">
                <FaChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:opacity-50 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:cursor-not-allowed">
                <FaChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Programs Grid */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}>
              {programs.map(program => (
                <div key={program.slug.current} className="flex-shrink-0 w-1/3 px-4">
                  <Link href={`/program/${program.slug.current}`} className="block group">
                    <div className="bg-neutral-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-neutral-700 hover:border-primary-400">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        {program.image ? (
                          <IdealImage
                            image={program.image}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-900 to-accent-900 flex items-center justify-center">
                            <div className="text-neutral-500 text-4xl">🎮</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors duration-200">
                          {program.title}
                        </h3>
                        {program.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-4">{program.description}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>CD Keys Available</span>
                          <span className="text-primary-400 font-medium">{program.cdKeys?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {programs.length > itemsPerView && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: maxIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex ? "bg-primary-400 w-8" : "bg-neutral-600 hover:bg-neutral-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
