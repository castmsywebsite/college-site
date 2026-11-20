import React, { useState, useEffect } from "react";
import { Camera, X, ChevronLeft, ChevronRight, Play, FileText } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "nss", label: "NSS" },
    { id: "campus", label: "Campus Life" },
    { id: "events", label: "Events" },
    { id: "academics", label: "Academics" },
    { id: "sports", label: "Sports" },
    { id: "cultural", label: "Cultural" },
    { id: "graduation", label: "Graduation" },
  ];

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/gallery");
        if (!response.ok) {
          throw new Error("Failed to load images");
        }
        const images = await response.json();
        setGalleryImages(images);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const filteredImages =
    selectedCategory === "all"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;

    const currentIndex = filteredImages.findIndex(
      (img) => img.id === selectedImage
    );
    let newIndex;

    if (direction === "prev") {
      newIndex =
        currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex =
        currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedImage(filteredImages[newIndex].id);
  };

  const selectedImageData = selectedImage
    ? filteredImages.find((img) => img.id === selectedImage)
    : null;

  const renderMediaItem = (image: GalleryImage, inLightbox = false) => {
    if (image.mimeType?.startsWith("video/")) {
      return (
        <div className={`relative ${inLightbox ? "w-full h-full flex items-center justify-center" : "w-full h-48"}`}>
          <video
            src={image.imageUrl}
            className={inLightbox ? "max-w-full max-h-full" : "w-full h-full object-cover"}
            controls={inLightbox}
            muted={!inLightbox}
          />
          {!inLightbox && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <Play className="w-12 h-12 text-white opacity-80" />
            </div>
          )}
        </div>
      );
    } else if (image.mimeType === "application/pdf") {
      if (inLightbox) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8 rounded-lg">
            <FileText className="w-24 h-24 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-4">{image.title}</h3>
            <a
              href={image.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open PDF Document
            </a>
          </div>
        );
      }
      return (
        <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <FileText className="w-12 h-12 mb-2 text-red-500" />
          <span className="text-sm font-medium">PDF Document</span>
        </div>
      );
    }

    return (
      <img
        src={image.imageUrl}
        alt={image.title}
        className={inLightbox ? "max-w-full max-h-full object-contain" : "w-full h-56 sm:h-64 object-cover object-top group-hover:scale-105 transition-transform duration-300"}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Camera className="h-8 w-8 mr-3" />
                Picture Gallery
              </h1>
              <p className="text-blue-100">
                Explore moments and memories from our vibrant campus life
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading gallery...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Camera className="h-8 w-8 mr-3" />
                Picture Gallery
              </h1>
              <p className="text-blue-100">
                Explore moments and memories from our vibrant campus life
              </p>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Error loading gallery</p>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Camera className="h-8 w-8 mr-3" />
              Picture Gallery
            </h1>
            <p className="text-blue-100">
              Explore moments and memories from our vibrant campus life
            </p>
          </div>

          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => openLightbox(image.id)}
                >
                  {renderMediaItem(image)}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-end">
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="font-semibold text-sm">{image.title}</h3>
                      <p className="text-xs text-gray-200 mt-1">
                        {image.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredImages.length === 0 && (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No items found in this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage && selectedImageData && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>

            <button
              onClick={() => navigateImage("prev")}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <button
              onClick={() => navigateImage("next")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <div className="w-full h-[80vh] flex items-center justify-center">
              {renderMediaItem(selectedImageData, true)}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <h3 className="text-white text-xl font-semibold mb-2">
                {selectedImageData.title}
              </h3>
              <p className="text-gray-300 text-sm">
                {selectedImageData.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySection;
