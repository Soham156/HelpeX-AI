import sql from './../configs/db.js';
import { InferenceClient } from '@huggingface/inference';
import axios from 'axios';
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const client = new InferenceClient(process.env.HF_TOKEN);

export const generateArticle = async (req, res) => {
    try {
        const userId = req.userId;
        const { prompt, length } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: 'Limit reached. Upgrade to premium for more requests.'});
        }

        const lengthMap = {
            'short': 'Write a short article (200-300 words)',
            'medium': 'Write a medium-length article (500-700 words)', 
            'long': 'Write a long, detailed article (1000-1500 words)'
        };

        const fullPrompt = `${lengthMap[length] || lengthMap['short']} about: ${prompt}. 
        Make it engaging, informative, and well-structured with proper headings and paragraphs.`;

        const chatCompletion = await client.chatCompletion({
            provider: "novita",
            model: "meta-llama/Llama-3.2-1B-Instruct",
            messages: [
                {
                    role: "user",
                    content: fullPrompt,
                    max_tokens: 100,
                },
            ],
        });

        const generatedText = chatCompletion.choices[0].message.content;

        await sql`INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${generatedText}, 'article')`;

        return res.json({
            success: true,
            message: 'Article generated successfully',
            article: generatedText,
            usage_count: free_usage + 1
        });

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to generate article. Please try again.',
            error: error.message
        });
    }
}

export const generateBlogTitle = async (req, res) => {
    try {
        const userId = req.userId;
        const { prompt } = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: 'Limit reached. Upgrade to premium for more requests.'});
        }

        const fullPrompt = `about: ${prompt}. 
        Make it short, intact and meaningfull.`;

        const chatCompletion = await client.chatCompletion({
            provider: "novita",
            model: "meta-llama/Llama-3.2-1B-Instruct",
            messages: [
                {
                    role: "user",
                    content: fullPrompt,
                },
            ],
        });

        const generatedText = chatCompletion.choices[0].message.content;

        await sql`INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${generatedText}, 'blog-title')`;

        return res.json({
            success: true,
            message: 'Blog title generated successfully',
            article: generatedText,
            usage_count: free_usage + 1
        });

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to generate title. Please try again.',
            error: error.message
        });
    }
}

export const generateImage = async (req, res) => {
    try {
        const userId = req.userId;
        const { prompt, publish } = req.body;
        const plan = req.plan;

        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium users.'});
        }

        const formData = new FormData();
        formData.append('prompt', prompt);
        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
            headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
            responseType: 'arraybuffer'
        })

        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

        const {secure_url} = await cloudinary.uploader.upload(base64Image)

        await sql`INSERT INTO creations(user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

        return res.json({success: true, content: secure_url});

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to generate image. Please try again.',
            error: error.message
        });
    }
}

export const removeImageBackground = async (req, res) => {
    try {
        const userId = req.userId;
        const image = req.file;
        const plan = req.plan;

        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium users.'});
        }

        

        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [
                {
                    effect:'background_removal',
                    background_removal: 'remove_the_background',
                }
            ]
        })

        await sql`INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

        return res.json({success: true, content: secure_url});

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to remove background. Please try again.',
            error: error.message
        });
    }
}

export const removeImageObject = async (req, res) => {
    try {
        const userId = req.userId;
        const { object } = req.body;
        const image = req.file;
        const plan = req.plan;

        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium users.'});
        }

        const {public_id} = await cloudinary.uploader.upload(image.path)

        const imageUrl = cloudinary.url(public_id, {
            transformation: [{effect: `gen_remove:${object}`}],
            resource_type: 'image'
        });

        await sql`INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

        return res.json({success: true, content: imageUrl});

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to remove object. Please try again.',
            error: error.message
        });
    }
}

export const resumeReview = async (req, res) => {
    try {
        const userId = req.userId;
        const resume = req.file;
        const plan = req.plan;

        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium users.'});
        }

       if(resume.size > 5 * 1024 * 1024) {
        return res.json({success: false, message: 'Resume file size exceeds 5MB limit.'});
       }

       const dataBuffer = fs.readFileSync(resume.path);
       const pdfData = await pdf(dataBuffer);

       const prompt = `Review this resume and provide feedback on its strength, weaknesses, and areas for improvement. Resume content:\n\n${pdfData.text}`;

        const chatCompletion = await client.chatCompletion({
            provider: "novita",
            model: "meta-llama/Llama-3.2-1B-Instruct",
            messages: [
                {
                    role: "user",
                    content: prompt,
                    max_tokens: 1000,
                },
            ],
        });

        const content = chatCompletion.choices[0].message.content;

        await sql`INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

        return res.json({success: true, content: content});

    } catch (error) {
        return res.json({
            success: false, 
            message: 'Failed to review resume. Please try again.',
            error: error.message
        });
    }
}