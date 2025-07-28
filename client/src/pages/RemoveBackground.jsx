import React, { useState } from 'react'
import { Eraser, Loader, Sparkles, Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveBackground = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState('');

  const { getToken } = useAuth();

  const downloadImage = async () => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `background-removed-${Date.now()}.png`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      toast.success('Image downloaded successfully!');
    } catch {
      toast.error('Failed to download image');
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('image', input);

      const response = await axios.post('/api/ai/remove-image-background', formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (response.data.success) {
        setImage(response.data.content);
        toast.success('Background removed successfully!');
      } else {
        toast.error(response.data.message);
      }

    } catch (error) {
      toast.error('Failed to remove background. Please try again.', error.message);
    }
    setLoading(false);
  }
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>
      <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#FF4938]' />
          <h1 className='text-xl font-semibold'>Background Removal</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload image</p>
        <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='image/*' className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 text-gray-600' required />
        <p className='text-xs text-gray-500 font-light mt-1'>Supports JPG, PNG, and other image formats</p>
        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          {
            loading ?
              <>
                <Loader className='w-5 animate-spin' />
                Generating...
              </>
              :
              <>
                <Eraser className='w-5' />
                Remove background
              </>
          }
        </button>
      </form>
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Eraser className='w-5 h-5 text-[#FF4938]' />
            <h1 className='text-xl font-semibold'>Processed Image</h1>
          </div>
          {image && (
            <button
              onClick={downloadImage}
              className='flex items-center gap-2 bg-[#FF4938] hover:bg-[#F6AB41] text-white px-3 py-1.5 rounded-md text-sm transition-colors'
            >
              <Download className='w-4 h-4' />
              Download
            </button>
          )}
        </div>
        {
          !image ? (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Eraser className='w-9 h-9' />
                <p>Enter a topic and click "Remove Background" to get started</p>
              </div>
            </div>
          ) : (
            <div className='mt-3 h-full'>
              <img src={image} alt="image" className='w-full h-full' />
            </div>
          )
        }
      </div>
    </div>
  )
}

export default RemoveBackground