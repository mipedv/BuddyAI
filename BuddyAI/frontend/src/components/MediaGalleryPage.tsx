import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Play, Search, Video } from 'lucide-react';
import axios from 'axios';

interface MediaItem {
  title: string;
  link: string;
  thumbnail: string;
  context_link?: string;
  width?: number;
  height?: number;
  source?: string;
  description?: string;
  duration?: string;
}

const MediaGalleryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // Get query from URL params
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || 'solar system';
  const mediaType = searchParams.get('type') || 'images';

  useEffect(() => {
    setActiveTab(mediaType as 'images' | 'videos');
    fetchMediaContent(query);
  }, [query, mediaType]);

  const fetchMediaContent = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both images and videos
      const [imagesResponse, videosResponse] = await Promise.all([
        axios.get(`http://localhost:8000/api/core/search-images/`, {
          params: { query: searchQuery, num_results: 20 }
        }),
        axios.get(`http://localhost:8000/api/core/search-videos/`, {
          params: { query: searchQuery, num_results: 15 }
        })
      ]);

      setImages(imagesResponse.data.images || []);
      setVideos(videosResponse.data.videos || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load media content');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const ImageGrid = ({ items }: { items: MediaItem[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
          onClick={() => openExternalLink(item.link)}
          onMouseEnter={() => setHoveredItem(index)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            <img
              src={item.thumbnail || item.link}
              alt={item.title}
              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/media/main.png'; // Fallback image
              }}
            />
            <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              hoveredItem === index ? 'bg-opacity-30' : 'bg-opacity-0'
            } flex items-center justify-center`}>
              <ExternalLink 
                className={`text-white transform transition-all duration-300 ${
                  hoveredItem === index ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                }`} 
                size={24} 
              />
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-gray-900" title={item.title}>
              {item.title}
            </h3>
            {item.source && (
              <p className="text-xs text-gray-500 mt-1.5 group-hover:text-gray-600">{item.source}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const VideoGrid = ({ items }: { items: MediaItem[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
          onClick={() => openExternalLink(item.link)}
          onMouseEnter={() => setHoveredItem(index)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="aspect-video bg-gray-50 relative overflow-hidden">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/media/thumbnail1.png'; // Fallback thumbnail
              }}
            />
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              hoveredItem === index ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-20'
            }`}>
              <div className={`bg-gray-800 rounded-full p-3 transform transition-all duration-300 ${
                hoveredItem === index ? 'scale-110 bg-opacity-90' : 'scale-100 bg-opacity-75'
              }`}>
                <Play className="text-white" size={28} fill="white" />
              </div>
            </div>
            {item.duration && (
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2.5 py-1.5 rounded-md">
                {item.duration}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-gray-900" title={item.title}>
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2 group-hover:text-gray-700">{item.description}</p>
            )}
            {item.source && (
              <p className="text-xs text-gray-500 mt-2 group-hover:text-gray-600">{item.source}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7F0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E50] to-[#3498DB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center space-x-8">
              <button
                onClick={handleBack}
                className="p-3 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
                aria-label="Go back"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <div className="relative">
                <h1 className="text-3xl font-bold text-white tracking-wide">
                  Media Gallery
                </h1>
                <div className="flex items-center mt-2">
                  <p className="text-base text-white/80">
                    Showing results for 
                  </p>
                  <div className="ml-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                    <span className="font-medium text-white">"{query}"</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-[#F8F7F0] to-[#F0F0F0] border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-10 relative">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-5 px-2 group relative font-medium text-base transition-all duration-300 ${
                activeTab === 'images'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Search 
                  size={18} 
                  className={`transition-colors duration-300 ${
                    activeTab === 'images' 
                      ? 'text-gray-900' 
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`} 
                />
                <span>Images ({images.length})</span>
              </div>
              <div 
                className={`absolute bottom-0 left-0 right-0 h-1 transform origin-center transition-all duration-300 ${
                  activeTab === 'images'
                    ? 'scale-x-100 bg-gray-900'
                    : 'scale-x-0 bg-gray-700 group-hover:scale-x-50'
                }`}
              ></div>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-5 px-2 group relative font-medium text-base transition-all duration-300 ${
                activeTab === 'videos'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Video 
                  size={18} 
                  className={`transition-colors duration-300 ${
                    activeTab === 'videos' 
                      ? 'text-gray-900' 
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`} 
                />
                <span>Videos ({videos.length})</span>
              </div>
              <div 
                className={`absolute bottom-0 left-0 right-0 h-1 transform origin-center transition-all duration-300 ${
                  activeTab === 'videos'
                    ? 'scale-x-100 bg-gray-900'
                    : 'scale-x-0 bg-gray-700 group-hover:scale-x-50'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-gray-800"></div>
            <span className="mt-4 text-gray-600 font-medium">Loading media content...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-gray-800 mb-6 font-medium">{error}</p>
            <button
              onClick={() => fetchMediaContent(query)}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            {activeTab === 'images' && (
              <div>
                {images.length > 0 ? (
                  <ImageGrid items={images} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No images found for "{query}"
                  </div>
                )}
              </div>
            )}
            {activeTab === 'videos' && (
              <div>
                {videos.length > 0 ? (
                  <VideoGrid items={videos} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No videos found for "{query}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGalleryPage; 