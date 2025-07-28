import { useAuth, useUser } from '@clerk/clerk-react';
import React, { useEffect, useState, useCallback } from 'react'
import { Heart, Download } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  const { getToken } = useAuth();

  const downloadImage = async (imageUrl, prompt) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const safeFileName = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `community-${safeFileName}-${Date.now()}.png`;
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

  const fetchCreations = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/get-published-creations',
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to fetch creations. Please try again later.');
    }
    setLoading(false);
  }, [getToken])

  const imageLikeToggle = async (id) => {
    setCreations(prevCreations =>
      prevCreations.map(creation => {
        if (creation.id === id) {
          const isLiked = creation.likes?.includes(user?.id);
          const updatedLikes = isLiked
            ? creation.likes.filter(likeId => likeId !== user?.id)
            : [...(creation.likes || []), user?.id];

          return { ...creation, likes: updatedLikes };
        }
        return creation;
      })
    );

    try {
      const { data } = await axios.post('/api/user/toggle-like-creation', { id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (!data.success) {
        setCreations(prevCreations =>
          prevCreations.map(creation => {
            if (creation.id === id) {
              const isLiked = creation.likes?.includes(user?.id);
              const revertedLikes = isLiked
                ? creation.likes.filter(likeId => likeId !== user?.id)
                : [...(creation.likes || []), user?.id];

              return { ...creation, likes: revertedLikes };
            }
            return creation;
          })
        );
        toast.error(data.message);
      }
    } catch {
      setCreations(prevCreations =>
        prevCreations.map(creation => {
          if (creation.id === id) {
            const isLiked = creation.likes?.includes(user?.id);
            const revertedLikes = isLiked
              ? creation.likes.filter(likeId => likeId !== user?.id)
              : [...(creation.likes || []), user?.id];

            return { ...creation, likes: revertedLikes };
          }
          return creation;
        })
      );
      toast.error('Failed to update like. Please try again.');
    }
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user, fetchCreations])
  return !loading ? (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      Creations
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
        {creations.map((creation, index) => (
          <div key={index} className='relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/3'>
            <img src={creation.content} alt="" className='w-full h-full object-cover rounded-lg' />

            <div className='absolute top-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(creation.content, creation.prompt);
                }}
                className='bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg'
                title='Download image'
              >
                <Download className='w-4 h-4' />
              </button>
            </div>

            <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg z-10'>
              <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
              <div className='flex gap-1 items-center'>
                <p>{creation.likes?.length || 0}</p>
                <Heart onClick={() => imageLikeToggle(creation.id)} className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes?.includes(user?.id) ? 'fill-red-500 text-red-600' : 'text-white'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className='flex justify-center items-center h-full'>
      <span className='w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin'></span>
    </div>
  )
}

export default Community