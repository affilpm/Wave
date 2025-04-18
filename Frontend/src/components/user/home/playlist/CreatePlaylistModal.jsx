import React, { useState } from 'react';
import { Music, Upload, Globe, Lock } from 'lucide-react';
import Cropper from 'react-easy-crop';
import api from '../../../../api';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';  

const MIN_IMAGE_SIZE = 500;
const TARGET_SIZE = 500;

const CreatePlaylistModal = ({ isOpen, onClose, onCreatePlaylist }) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces dynamically
    setNewPlaylistName(value);
  
    if (value.length < 3 || value.length > 30) {
      setError('Playlist name must be between 3 and 30 characters.');
    } else {
      setError('');
    }
  };
  
  const resetForm = () => {
    setNewPlaylistName('');
    setDescription('');
    setIsPublic(true);
    setCoverPhoto(null);
    setPreviewUrl(null);
    setError('');
    setShowCropper(false);
    setOriginalImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    // Only allow closing if not in loading state
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
          throw new Error('Please upload only JPG, JPEG or PNG images');
        }
        
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size should be less than 5MB');
        }

        // Get image dimensions
        const dimensions = await new Promise((resolve) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ width: img.width, height: img.height });
          };
          
          img.src = objectUrl;
        });

        // Check if image needs resizing
        if (dimensions.width < MIN_IMAGE_SIZE || dimensions.height < MIN_IMAGE_SIZE) {
          const willResize = window.confirm(
            `Image is smaller than ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels. Would you like to automatically resize it? This may affect image quality.`
          );

          if (willResize) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setOriginalImage(e.target.result);
              setShowCropper(true);
            };
            reader.readAsDataURL(file);
          } else {
            throw new Error(`Please select an image at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels`);
          }
        } else {
          // Handle normal sized images
          const reader = new FileReader();
          reader.onload = (e) => {
            setOriginalImage(e.target.result);
            setShowCropper(true);
          };
          reader.readAsDataURL(file);
        }

        setError('');
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !originalImage) return;

    try {
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.src = originalImage;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const uniqueId = uuidv4();  // Generate a unique ID
          const croppedFile = new File([blob], `playlist-cover-${Date.now()}-${uniqueId}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          setCoverPhoto(croppedFile);
          setPreviewUrl(URL.createObjectURL(blob));
          setShowCropper(false);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image. Please try again.');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !description.trim() || !coverPhoto) {
      setError('All fields are required');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', newPlaylistName.trim());
      formData.append('description', description.trim());
      formData.append('is_public', isPublic);
      formData.append('cover_photo', coverPhoto);

      const response = await api.post('/api/playlist/playlists/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newPlaylist = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        is_public: response.data.is_public,
        cover_photo: response.data.cover_photo,
        icon: null,
        image: response.data.cover_photo || "/api/placeholder/40/40",
        songCount: 0,
        type: 'Playlist'
      };

      toast.success('Playlist created successfully!');
      
      // First call onCreatePlaylist to update parent components
      onCreatePlaylist(newPlaylist);
      
      // Then reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
      const errorMessage = error.response?.data?.details || 
                         error.response?.data?.error ||
                         'Failed to create playlist. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // If modal is not open, return null
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center text-center z-50 overflow-y-auto">
      {/* Modal container - full screen on mobile, max-width on larger screens */}
      <div className="bg-gray-900 w-full h-full md:h-auto md:max-w-md md:rounded-lg md:w-full p-4 md:p-6 mx-auto flex flex-col">
        {showCropper && originalImage ? (
          <div className="space-y-4 flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Crop Image</h3>
              <button 
                onClick={() => setShowCropper(false)}
                className="text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cropper container - needs explicit height */}
            <div className="relative h-64 sm:h-80 md:h-64 lg:h-80 flex-1 min-h-[300px]">
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                style={{
                  containerStyle: { height: '100%', width: '100%' },
                  cropAreaStyle: { border: '2px solid #fff' }
                }}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">
                Zoom: {zoom.toFixed(1)}x
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCropper(false)}
                className={`px-4 py-2 text-white hover:bg-gray-800 rounded-md ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Apply
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Playlist</h2>
              <button 
                onClick={handleClose}
                disabled={isLoading}
                className={`text-gray-400 hover:text-white transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-16 h-16 text-gray-600" />
                    )}
                    <label className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <Upload className="w-8 h-8 text-white" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <input
                    type="text"
                    placeholder="My Awesome Playlist"
                    value={newPlaylistName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full bg-gray-800 text-white px-4 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  
                  <textarea
                    placeholder="Add an optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    className={`w-full bg-gray-800 text-white px-4 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none h-20 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-neutral-800 transition-all w-full ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isPublic ? (
                      <>
                        <Globe size={18} />
                        <span>Public playlist</span>
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>Private playlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900 text-red-100 px-4 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-auto pt-4">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className={`px-4 py-2 rounded-full text-white hover:bg-gray-800 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={
                  isLoading || 
                  error ||  // Disable if there's a validation error
                  !newPlaylistName.trim() || 
                  !description.trim() || 
                  !coverPhoto
                }
                className={`px-6 py-2 rounded-full bg-green-500 text-white font-medium transition-colors ${
                  (isLoading || error || !newPlaylistName.trim() || !description.trim() || !coverPhoto)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-400'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlaylistModal;