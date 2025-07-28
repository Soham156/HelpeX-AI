import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
    try{
        const authObj = await req.auth();
        const {userId, has} = authObj;
        
        if (!userId) {
            return res.status(401).json({
                success: false, 
                message: 'Authentication failed - no user ID found'
            });
        }
        
        const hasPremiumPlan = await has({plan: 'premium'});
        const user = await clerkClient.users.getUser(userId);

        if(!hasPremiumPlan && user.privateMetadata.free_usage){
            req.free_usage = user.privateMetadata.free_usage
        } else {
            await clerkClient.users.updateUser(userId, {
                privateMetadata: {
                    free_usage: 0
                }
        })
        req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        req.userId = userId;
        
        next()
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}