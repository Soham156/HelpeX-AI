import { Edit, Sparkles, Loader } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const WriteArticle = () => {
  const { user, isLoaded } = useUser();

  const articleLength = [
    { length: 'short', text: 'Short (200-300 words)' },
    { length: 'medium', text: 'Medium (500-700 words)' },
    { length: 'long', text: 'Long (1200+ words)' },
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0]);
  const [input, setInput] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-full">
      <Loader className="w-8 h-8 animate-spin" />
    </div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-full">
      <p>Please sign in to generate articles</p>
    </div>;
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)
      const prompt = `write an article about ${input} in ${selectedLength.text}`;

      const { data } = await axios.post('/api/ai/generate-article', { prompt, length: selectedLength.length }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        setGeneratedArticle(data.article);
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false);
  }
  return (
    <div className='p-6 text-slate-700'>
      <div className='flex flex-col lg:flex-row gap-6 items-start'>
        <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Sparkles className='w-6 text-[#4A7AFF]' />
            <h1 className='text-xl font-semibold'>Article Configuration</h1>
          </div>
          <p className='mt-6 text-sm font-medium'>Article Topic</p>
          <input onChange={(e) => setInput(e.target.value)} value={input} type="text" className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300' placeholder='The future of artificial intelligence is...' required />
          <p className='mt-4 text-sm font-medium'>Article Length</p>
          <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
            {articleLength.map((item, index) => (
              <span
                onClick={() => setSelectedLength(item)}
                className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedLength.text === item.text
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 border-gray-300'
                  }`}
                key={index}
              >
                {item.text}
              </span>
            ))}
          </div>
          <br />
          <button
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer ${loading
              ? 'bg-gradient-to-r from-[#1e5ce6] to-[#5ba3f5] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#226BFF] to-[#65ADFF] hover:from-[#1e5ce6] hover:to-[#5ba3f5]'
              }`}
          >
            {loading ? (
              <>
                <Loader className='w-5 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <Edit className='w-5' />
                Generate article
              </>
            )}
          </button>
        </form>

        <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px] flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Edit className='w-5 h-5 text-[#4A7AFF]' />
            <h1 className='text-xl font-semibold'>Generated article</h1>
          </div>

          <div className='flex-1 mt-4 overflow-y-auto flex flex-col'>
            {loading ? (
              <div className='flex flex-col items-center justify-center flex-1 text-gray-400'>
                <Loader className='w-8 h-8 animate-spin mb-3' />
                <p className='text-sm'>Generating your article...</p>
                <p className='text-xs mt-1'>This may take a few moments</p>
              </div>
            ) : generatedArticle ? (
              <div className='prose prose-sm max-w-none'>
                <div className='text-sm overflow-y-scroll h-full mt-3 text-slate-700 whitespace-pre-wrap leading-relaxed reset-tw'>
                  <Markdown>{generatedArticle}</Markdown>
                </div>
              </div>
            ) : (
              <div className='flex justify-center items-center flex-1'>
                <div className='text-sm flex flex-col items-center justify-center gap-5 text-gray-400 text-center'>
                  <Edit className='w-9 h-9' />
                  <p>Enter a topic and click "Generate article" to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WriteArticle