
import commentModel from './../../../../DB/models/comment.model.js';
import postModel from './../../../../DB/models/post.model.js';

export const addComment = async (req, res) => {
    try {
        const { commentBody } = req.body
        const { postId } = req.params
        const comment = await commentModel.create({ commentBody, createdBy: req.user._id, postId })
        res.status(200).json({ message: "done", comment })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const addReply = async (req, res) => {
    try {
        const { commentBody } = req.body
        const { commentId } = req.params
        const parent = await commentModel.findById(commentId)
        let replyDepth = parent.replyDepth + 1
        if (replyDepth > 2) {
            replyDepth = 2 //max reply on reply
            const reply = await commentModel.create(
                { commentBody, createdBy: req.user._id, parentComment: parent.parentComment._id, postId: parent.postId, replyDepth }
            )
            const comment = await commentModel.updateOne({ _id: parent.parentComment._id }, { $push: { replies: reply._id } })
            res.status(200).json({ message: "done", reply })
        } else {
            const reply = await commentModel.create(
                { commentBody, createdBy: req.user._id, parentComment: parent._id, postId: parent.postId, replyDepth }
            )
            const comment = await commentModel.updateOne({ _id: parent._id }, { $push: { replies: reply._id } })
            res.status(200).json({ message: "done", reply })
        }

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const updateComment = async (req, res) => {
    try {
        const { commentBody } = req.body
        const { id } = req.params
        const comment = await commentModel.findOne({ _id: id, createdBy: req.user._id, isDeleted: false })

        if (comment) {
            const updatedComment = await commentModel.findByIdAndUpdate(id, { commentBody }, { new: true }).select('commentBody __v')
            res.status(200).json({ message: "done", updatedComment })
        } else {
            res.status(404).json({ message: "404 post not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const softDeleteComment = async (req, res) => {
    try {
        const { id } = req.params
        const comment = await commentModel.findOne({ _id: id, deletedBy: { $exists: false } })

        if (comment) { //comment owner                                                           //post owner
            const post = await postModel.findOne({ _id: comment.postId })
            const commentOwnerID = JSON.stringify(comment.createdBy),
                signedUserID = JSON.stringify(req.user._id),
                postOwnerID = JSON.stringify(post.createdBy)

            if (commentOwnerID === signedUserID || postOwnerID === signedUserID) {
                const deletedComment = await commentModel.updateOne({ _id: comment._id }, { deletedBy: req.user._id })

                //deleting replies if there's
                const replies = await commentModel.find({ parentComment: comment._id }).select({ replies: 1 })
                let counter = 0;
                for (const reply of replies) {
                    for (let i = 0; i < reply?.replies?.length; i++) {
                        const deletedReplyReply = await commentModel.updateOne({ _id: reply.replies[i], deletedBy: { $exists: false } }, { deletedBy: req.user._id })
                        counter += deletedReplyReply.modifiedCount
                    }
                    const deletedReply = await commentModel.updateOne({ _id: reply._id, deletedBy: { $exists: false } }, { deletedBy: req.user._id })
                    counter += deletedReply.modifiedCount
                }

                deletedComment ? res.status(200).json({ message: "done", repliesDeleted: counter }) : res.status(200).json({ message: "something went wrong" })
            } else {
                res.status(403).json({ message: "you aren't auth to delete this comment" })
            }

        } else {
            res.status(404).json({ message: "404 comment not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const likeComment = async (req, res) => {
    try {
        const { id } = req.params
        const likedComment = await commentModel.findOneAndUpdate({ _id: id, deletedBy: { $exists: false }, likes: { $nin: req.user._id } },
            {
                $push: { likes: req.user._id },
            },
            {
                new: true
            }).select("likes")
        likedComment ? res.status(200).json({ message: "done", likedComment }) :
            res.status(400).json({ message: "you already liked it or not found" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}


export const commentById = async (req, res) => {
    const { id } = req.params
    const comment = await commentModel.find({ _id: id, deletedBy: { $exists: false } }).populate([
        {
            path: "createdBy",
            select: "profilePic userName",

        },
        {
            path: "postId",
            select: "-isDeleted",
            populate: [{
                path: "createdBy",
                select: "profilePic userName",
            }]
        },
        {
            path: "likes",
            select: "profilePic userName",
        },
        {
            path: "parentComment",
            select: "_id",
        },


    ])
    res.status(200).json({ message: "done", comment })
}