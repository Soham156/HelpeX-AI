import React, { useState } from 'react'
import Markdown from 'react-markdown'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

const CreationItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const downloadImage = async (imageUrl, prompt) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);

            const safeFileName = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `dashboard-${safeFileName}-${Date.now()}.png`;
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
    return (
        <div onClick={() => setExpanded(!expanded)} className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer'>
            <div className='flex justify-between items-center gap-4'>
                <div>
                    <h2>{item.prompt}</h2>
                    <p className='text-gray-500'>{item.type} - {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full'>{item.type}</button>
            </div>
            {
                expanded && (
                    <div>
                        {item.type === 'image' ? (
                            <div className='relative inline-block mt-3'>
                                <img src={item.content} alt="image" className='w-full max-w-md rounded-lg' />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImage(item.content, item.prompt);
                                    }}
                                    className='absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg opacity-80 hover:opacity-100'
                                    title='Download image'
                                >
                                    <Download className='w-4 h-4' />
                                </button>
                            </div>
                        ) : (
                            <div className='mt-3 h-full overflow-y-scroll text-sm text-slate-700'>
                                <div className='reset-tw'>
                                    <Markdown>{item.content}</Markdown>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    )
}

export default CreationItem