
import cloudinary from './../../../services/cloudinary.js';
import postModel from './../../../../DB/models/post.model.js';
import commentModel from './../../../../DB/models/comment.model.js';
import { paginate } from './../../../services/pagination.js';

export const addPost = async (req, res) => {
    try {
        const { postBody } = req.body
        const image = req.file //unnecessary

        if (image) {
            var { secure_url, public_id } = await cloudinary.uploader.upload(image.path, { folder: `/users/${req.user.userName}-${req.user._id}/posts` })
        }
        const newPost = await postModel.create({ postBody, postPic: { secure_url, public_id }, createdBy: req.user._id })
        res.status(200).json({ newPost })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })

    }
}

export const updatePost = async (req, res) => {
    try {
        const { postBody } = req.body
        const { id } = req.params
        const post = await postModel.findOne({ _id: id, createdBy: req.user._id, isDeleted: false })

        if (post) {
            const image = req.file //unnecessary
            let updatedPost;
            if (image) {
                if (post.postPic?.public_id) {
                    var oldPicRemoved = await cloudinary.uploader.destroy(post.postPic.public_id)
                }
                var { secure_url, public_id } = await cloudinary.uploader.upload(image.path, { folder: `/users/${req.user.userName}-${req.user._id}/posts` })
                updatedPost = await postModel.findByIdAndUpdate(id, { postBody, postPic: { secure_url, public_id } }, { new: true })
            } else {
                updatedPost = await postModel.findByIdAndUpdate(id, { postBody }, { new: true })
            }
            res.status(200).json({ message: "done", updatedPost, oldPicRemoved })
        } else {
            res.status(404).json({ message: "404 post not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params
        const post = await postModel.findOne({ _id: id, createdBy: req.user._id })

        if (post) {
            const comments = await commentModel.deleteMany({ postId: post._id })
            const deleted = await postModel.findByIdAndDelete(id)
            deleted ? res.status(200).json({ message: "done", commentsDeleted: comments.deletedCount }) : res.status(200).json({ message: "something went wrong" })
        } else {
            res.status(404).json({ message: "404 post not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const likePost = async (req, res) => {
    try {
        const { id } = req.params
        const likedPost = await postModel.findOneAndUpdate({ _id: id, isDeleted: false, likes: { $nin: req.user._id } },
            {
                $push: { likes: req.user._id },
                $pull: { unlikes: req.user._id },
            },
            {
                new: true
            }).select("unlikes likes")
        likedPost ? res.status(200).json({ message: "done", likedPost }) :
            res.status(400).json({ message: "you already liked it" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const unlikePost = async (req, res) => {
    try {
        const { id } = req.params
        const unlikedPost = await postModel.findOneAndUpdate({ _id: id, isDeleted: false, unlikes: { $nin: req.user._id } },
            {
                $push: { unlikes: req.user._id },
                $pull: { likes: req.user._id },
            },
            {
                new: true
            }).select("unlikes likes")
        unlikedPost ? res.status(200).json({ message: "done", unlikedPost }) :
            res.status(400).json({ message: "you already unliked it" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const allPosts = async (req, res) => {
    try {
        const { page, size } = req.query
        const { limit, skip } = paginate(page, size)
        const posts = await postModel.find({ isDeleted: false }).populate([
            {
                path: 'createdBy',
                select: 'profilePic userName'
            },
            {
                path: 'likes',
                select: 'profilePic userName'
            },
            {
                path: 'unlikes',
                select: 'profilePic userName'
            },
        ]).limit(limit).skip(skip).select({isDeleted:0})
        res.status(200).json({ message: "done", posts })
    } catch (error) {
        res.status(500).json({ message: "Internal Server error", error })
    }
}

export const myPosts = async (req, res) => {
    try {
        const { page, size } = req.query
        const { limit, skip } = paginate(page, size)
        const posts = await postModel.find({ createdBy: req.user._id, isDeleted: false }).populate([
            {
                path: 'createdBy',
                select: 'profilePic userName'
            },
            {
                path: 'likes',
                select: 'profilePic userName'
            },
            {
                path: 'unlikes',
                select: 'profilePic userName'
            },
        ]).limit(limit).skip(skip).select({isDeleted:0})
        res.status(200).json({ message: "done", posts })
    } catch (error) {
        res.status(500).json({ message: "Internal Server error", error })
    }
}