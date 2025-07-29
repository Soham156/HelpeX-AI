import { FileText, Loader, Sparkles } from 'lucide-react';
import React, { useState } from 'react'
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('resume', input);

      const response = await axios.post('/api/ai/resume-review', formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (response.data.success) {
        setFile(response.data.content);
        toast.success('Resume review generated successfully!');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to review resume. Please try again.', error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='p-6 text-slate-700'>
      <div className='flex flex-col lg:flex-row gap-6 items-start'>
        <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <Sparkles className='w-6 text-[#00DA83]' />
            <h1 className='text-xl font-semibold'>Resume Review</h1>
          </div>
          <p className='mt-6 text-sm font-medium'>Upload Resume</p>
          <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='application/pdf' className='w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 text-gray-600' required />
          <p className='text-xs text-gray-500 font-light mt-1'>Supports PDF resume only.</p>
          <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
            {
              loading ?
                <>
                  <Loader className='w-5 animate-spin' />
                  Generating...
                </>
                :
                <>
                  <FileText className='w-5' />
                  Review Resume
                </>
            }
          </button>
        </form>
        <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px] flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <FileText className='w-5 h-5 text-[#00DA83]' />
            <h1 className='text-xl font-semibold'>Analysis Results</h1>
          </div>

          <div className='flex-1 mt-4 overflow-y-auto flex flex-col'>
            {
              loading ? (
                <div className='flex flex-col items-center justify-center flex-1 text-gray-400'>
                  <Loader className='w-8 h-8 animate-spin mb-3' />
                  <p className='text-sm'>Generating response...</p>
                  <p className='text-xs mt-1'>This may take a few moments</p>
                </div>
              )
                :
                file ? (
                  <div className='prose prose-sm max-w-none overflow-y-scroll'>
                    <div className='text-sm overflow-y-scroll h-full mt-3 text-slate-700 whitespace-pre-wrap leading-relaxed reset-tw'>
                      <Markdown>{file}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className='flex justify-center items-center flex-1'>
                    <div className='text-sm flex flex-col items-center justify-center gap-5 text-gray-400 text-center'>
                      <FileText className='w-9 h-9' />
                      <p>Enter a resume and click "Review Resume" to get started</p>
                    </div>
                  </div>
                )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewResume