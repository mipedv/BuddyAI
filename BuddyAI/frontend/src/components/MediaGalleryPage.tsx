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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => openExternalLink(item.link)}
        >
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            <img
              src={item.thumbnail || item.link}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/media/main.png'; // Fallback image
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
              <ExternalLink className="text-white opacity-0 hover:opacity-100 transition-opacity" size={20} />
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={item.title}>
              {item.title}
            </h3>
            {item.source && (
              <p className="text-xs text-gray-500 mt-1">{item.source}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const VideoGrid = ({ items }: { items: MediaItem[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => openExternalLink(item.link)}
        >
          <div className="aspect-video bg-gray-100 relative overflow-hidden">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/media/thumbnail1.png'; // Fallback thumbnail
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <div className="bg-red-600 rounded-full p-2">
                <Play className="text-white" size={24} fill="white" />
              </div>
            </div>
            {item.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {item.duration}
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2" title={item.title}>
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
            )}
            {item.source && (
              <p className="text-xs text-gray-500 mt-1">{item.source}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Media Gallery
                </h1>
                <p className="text-sm text-gray-600">
                  Showing results for "{query}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search size={16} />
                <span>Images ({images.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'videos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Video size={16} />
                <span>Videos ({videos.length})</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading media content...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchMediaContent(query)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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