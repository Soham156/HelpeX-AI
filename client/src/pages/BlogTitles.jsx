import { Hash, Loader, Sparkles } from 'lucide-react';
import React, { useState } from 'react'
import axios from 'axios';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {
  const blogCategories = ['General', 'Technology', 'Business', 'Health', 'Lifestyle', 'Travel', 'Education', 'Food'];

  const [selectedCategory, setSelectedCategory] = useState('General');
  const [input, setInput] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `Generate a catchy blog title for the keyword ${input} in the category of ${selectedCategory}`;

      const response = await axios.post('/api/ai/generate-blog-title', { prompt },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (response.data.success) {
        setGeneratedTitle(response.data.article);
        toast.success('Blog title generated successfully!');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to generate title. Please try again.', error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='h-full overflow-y-auto p-6 text-slate-700'>
      <div className='flex flex-col lg:flex-row gap-6 items-start'>
        <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Sparkles className='w-6 text-[#8E37EB]' />
            <h1 className='text-xl font-semibold'>AI Title Generator</h1>
          </div>
          <p className='mt-6 text-sm font-medium'>Keyword</p>
          <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300' placeholder='The future of artificial intelligence is...' required />
          <p className='mt-4 text-sm font-medium'>Category</p>
          <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
            {blogCategories.map((item) => (
              <span
                onClick={() => setSelectedCategory(item)}
                className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-500 border-gray-300'
                  }`}
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <br />
          <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
            {loading ? (
              <>
                <Loader className='w-5 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <Hash className='w-5' />
                Generate Blog Title
              </>
            )}
          </button>
        </form>
        <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Hash className='w-5 h-5 text-[#8E37EB]' />
            <h1 className='text-xl font-semibold'>Generated titles</h1>
          </div>
          {loading ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-400'>
              <Loader className='w-8 h-8 animate-spin mb-3' />
              <p className='text-sm'>Generating your title...</p>
              <p className='text-xs mt-1'>This may take a few moments</p>
            </div>
          ) : generatedTitle ? (
            <div className='prose prose-sm max-w-none'>
              <div className='text-sm overflow-y-scroll h-full mt-3 text-slate-700 whitespace-pre-wrap leading-relaxed reset-tw'>
                <Markdown>{generatedTitle}</Markdown>
              </div>
            </div>
          ) : (
            <div className='flex-1 flex justify-center items-center'>
              <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                <Hash className='w-9 h-9' />
                <p>Enter a topic and click "Generate title" to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogTitles