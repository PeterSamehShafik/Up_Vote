
import userModel from './../../../../DB/models/user.model.js';
import { roles } from './../../../middleware/auth.js';
import cloudinary from './../../../services/cloudinary.js';
import bcrypt from 'bcryptjs';
import { paginate } from './../../../services/pagination.js';

export const getProfile = async (req, res) => {
    try {
        const { id } = req.params
        const user = await userModel.findById(id).select("-password -code -isDeleted -confirmEmail")
        user ? res.status(200).json({ message: "done", user }) : res.status(404).json({ message: "user not found" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const getUsers = async (req, res) => {
    // const users = userModel.find({}).select('-QrCode -password -code -confirmEmail -role -isDeleted -isBlocked').cursor()
    // const results = []
    // for (let user = await users.next(); user != null; user = await users.next()) {
    //     const posts = postModel.find({ createdBy: user._id }).select("-isDeleted").cursor()
    //     const postsResults = []
    //     for (let post = await posts.next(); post != null; post = await posts.next()) {
    //         const comments = await commentModel.find({ postId: post._id }).select("-deletedBy")
    //         const postConvert = post.toObject()
    //         postConvert.comments = comments
    //         postsResults.push(postConvert)
    //     }
    //     const userConvert = user.toObject()
    //     userConvert.posts = postsResults
    //     results.push(userConvert)
    // }
    // res.status(200).json({ message: "done", results })

    try {
        const { page, size } = req.query
        const { limit, skip } = paginate(page, size)

        const users = await userModel.aggregate([
            { $project: { userName: 1, profilePic: 1, posts: 1 } }, // USER View
            { $skip: skip }, { $limit: limit },  // skip and limit for pagination
            {
                $lookup: { // populate on USER posts
                    from: 'posts', localField: '_id', foreignField: 'createdBy', as: 'posts',
                    pipeline: [
                        { $match: { isDeleted: false } },
                        { $project: { postBody: 1, postPic: 1, likes: 1, unlikes: 1, comments: 1 } },//POST view
                        {
                            $lookup: {// populate on POSTS comments
                                from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments',
                                pipeline: [
                                    { $match: { replyDepth: 0 } }, //deletedBy: { $exists: false },
                                    { $project: { deletedBy: 1, commentBody: 1, createdBy: 1, replies: 1, likes: 1 } }, //comment view
                                    {
                                        $lookup: { // populate on COMMENTS replies
                                            from: 'comments', localField: 'replies', foreignField: '_id', as: 'replies',
                                            pipeline: [
                                                { $match: { replyDepth: 1 } }, //deletedBy: { $exists: false },
                                                { $project: { deletedBy: 1, commentBody: 1, createdBy: 1, replies: 1, likes: 1 } }, //REPLIES view
                                                {
                                                    $lookup: {// populate on REPLIES replies
                                                        from: 'comments', localField: 'replies', foreignField: '_id', as: 'replies',
                                                        pipeline: [
                                                            { $match: { replyDepth: 2 } }, //deletedBy: { $exists: false },
                                                            { $project: { deletedBy: 1, commentBody: 1, createdBy: 1, likes: 1 } }, //REPLIES OF REPLIES view
                                                            {
                                                                $lookup: { // populate on REPLIES OF REPLIES createdBy
                                                                    from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy',
                                                                    pipeline: [{ $project: { userName: 1, profilePic: 1 } },]
                                                                }
                                                            },
                                                            {
                                                                $lookup: {// populate on REPLIES OF REPLIES likes
                                                                    from: 'users', localField: 'likes', foreignField: '_id', as: 'likes',
                                                                    pipeline: [{ $project: { userName: 1, profilePic: 1 } }]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    $lookup: {// populate on REPLIES likes
                                                        from: 'users', localField: 'likes', foreignField: '_id', as: 'likes',
                                                        pipeline: [{ $project: { userName: 1, profilePic: 1 } }]
                                                    }
                                                },
                                                {
                                                    $lookup: {//populate on  REPLIES CreatedBY
                                                        from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy',
                                                        pipeline: [{ $project: { userName: 1, profilePic: 1 } }]
                                                    }
                                                },

                                            ]
                                        }
                                    },
                                    {
                                        $lookup: { // populate on COMMENTS  likes 
                                            from: 'users', localField: 'likes', foreignField: '_id', as: 'likes',
                                            pipeline: [{ $project: { userName: 1, profilePic: 1 } }]
                                        }
                                    },
                                    {
                                        $lookup: { //populate on COMMENTS CreatedBY
                                            from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy',
                                            pipeline: [{ $project: { userName: 1, profilePic: 1 } }]
                                        }
                                    },

                                ]
                            }
                        },
                        {
                            $lookup: { // populate on POSTS likes
                                from: 'users', localField: 'likes', foreignField: '_id', as: 'likes',
                                pipeline: [{ $project: { userName: 1, profilePic: 1, } },]
                            }
                        },
                        {
                            $lookup: { // populate on POSTS unlikes
                                from: 'users', localField: 'unlikes', foreignField: '_id', as: 'unlikes',
                                pipeline: [{ $project: { userName: 1, profilePic: 1, } },]
                            }
                        },

                    ]
                },
            },
        ])
        res.status(200).json({ message: "done", users })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const updateProfile = async (req, res) => {
    try {
        const { userName, email, gender, age } = req.body
        const signedUser = await userModel.findByIdAndUpdate(req.user._id, { userName, email, gender, age }, { new: true }).select("userName email  gender age")
        res.status(200).json({ message: "done", updated: { userName, email, gender, age } })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }

}

export const profilePic = async (req, res) => {
    // try {
    const maxSizeInKB = 1000
    if (req.file) {
        const sizeInKB = (req.file.size / 1000)
        if (sizeInKB > maxSizeInKB) {
            res.status(400).json({ message: `file too large (max ${maxSizeInKB}KB)`, fileSizeInKB: `${sizeInKB}KB` })
        } else {
            // const deleteOld = await cloudinary.uploader.destroy(user.profilePic.public_id)
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, { folder: `users/${req.user.userName}-${req.user._id}/profilePic` })
            const updatedUser = await userModel.updateOne({ _id: req.user._id }, { profilePic: { secure_url, public_id } })
            res.status(200).json({ message: "done", ProfilePic: { secure_url, public_id }, fileSizeInKB: `${sizeInKB}KB` })
        }
    } else {
        res.status(400).json({ message: "please upload your picture" })
    }
    // } catch (error) {
    //     res.status(500).json({ message: "Internal server error", error })
    // }
}

export const coverPics = async (req, res) => {
    try {
        let sizeInKB = 0;
        if (req.files?.length > 1) {
            const imagesURL = []
            for (const file of req.files) {
                sizeInKB += file.size
                const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `users/${req.user.userName}-${req.user._id}/coverPics` })
                imagesURL.push({ secure_url, public_id })
            }
            const updatedUser = await userModel.updateOne({ _id: req.user._id }, { coverPics: imagesURL })
            res.status(200).json({ message: "done", imagesURL, filesSizeInKB: `${sizeInKB / 1000}KB` })
        } else {
            res.status(400).json({ message: "please upload more than 1 pic" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const softDelete = async (req, res) => {
    try {
        const { id } = req.params
        const { password } = req.body
        const deletingUser = await userModel.findOne({ _id: id }).select('role isDeleted')
        const signedUser = await userModel.findOne({ _id: req.user._id }).select('role password')
        const match = bcrypt.compareSync(password, signedUser.password)

        if (!deletingUser.isDeleted) {
            if (match) {
                if (JSON.stringify(deletingUser._id) === JSON.stringify(signedUser._id)) {
                    const deleted = await userModel.updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
                    deleted.modifiedCount ? res.status(200).json({ message: "done" }) : res.status(400).json({ message: "User already deleted" })
                } else if (signedUser.role === roles.admin) {
                    if (deletingUser.role !== roles.admin) {
                        const deleted = await userModel.updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
                        deleted.modifiedCount ? res.status(200).json({ message: "done" }) : res.status(400).json({ message: "User already deleted" })
                    } else {
                        res.status(403).json({ message: "admin can't delete another admin" })
                    }
                } else {
                    res.status(400).json({ message: "You can't delete this user" })
                }
            } else {
                res.status(400).json({ message: "In-valid Password" })
            }
        } else {
            res.status(400).json({ message: "User not found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const blockUser = async (req, res) => {
    try {
        const { id } = req.params
        const blockingUser = await userModel.findOne({ _id: id, isDeleted: false, isBlocked: false }).select('role')

        if (blockingUser) {
            if (blockingUser.role !== roles.admin) {
                const blocked = await userModel.updateOne({ _id: id, isBlocked: false }, { isBlocked: true })
                blocked.modifiedCount ? res.status(200).json({ message: "done" }) : res.status(400).json({ message: "User already blocked" })
            } else {
                res.status(403).json({ message: "Admin can't block admin" })
            }
        } else {
            res.status(400).json({ message: "User not found or already blocked" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}


