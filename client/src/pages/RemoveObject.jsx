import { Loader, Scissors, Sparkles, Download } from 'lucide-react';
import React, { useState } from 'react'
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {

  const [input, setInput] = useState('');
  const [object, setObject] = useState('');
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
      link.download = `object-removed-${Date.now()}.png`;
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

      if (object.trim().split(' ').length > 1) {
        toast.error('Please enter a single object name to remove');
        return;
      }

      const formData = new FormData();
      formData.append('image', input);
      formData.append('object', object);

      const response = await axios.post('/api/ai/remove-image-object', formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (response.data.success) {
        setImage(response.data.content);
        toast.success('Object removed successfully!');
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error('Failed to remove object. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='h-full overflow-y-auto p-6 text-slate-700'>
      <div className='flex flex-col lg:flex-row gap-6 items-start'>
        <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Sparkles className='w-6 text-[#4A7AFF]' />
            <h1 className='text-xl font-semibold'>Object Removal</h1>
          </div>
          <p className='mt-6 text-sm font-medium'>Upload image</p>
          <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='image/*' className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 text-gray-600' required />
          <p className='mt-6 text-sm font-medium'>Describe object name to remove</p>
          <textarea onChange={(e) => setObject(e.target.value)} value={object} rows={4} className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300' placeholder='e.g., watch or spoon, only single object name' required />
          <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
            {
              loading ?
                <>
                  <Loader className='w-5 animate-spin' />
                  Generating...
                </>
                :
                <>
                  <Scissors className='w-5' />
                  Remove object
                </>
            }
          </button>
        </form>
        <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Scissors className='w-5 h-5 text-[#4A7AFF]' />
              <h1 className='text-xl font-semibold'>Processed Image</h1>
            </div>
            {image && (
              <button
                onClick={downloadImage}
                className='flex items-center gap-2 bg-[#8E37EB] hover:bg-[#4A7AFF] text-white px-3 py-1.5 rounded-md text-sm transition-colors'
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
                  <Scissors className='w-9 h-9' />
                  <p>Upload an image and click "Remove Object" to get started</p>
                </div>
              </div>
            )
              : (
                <div className='mt-3 h-full'>
                  <img src={image} alt="image" className='w-full h-full' />
                </div>
              )
          }
        </div>
      </div>
    </div>
  )
}

export default RemoveObject