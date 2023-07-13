import { Schema, model, Types } from 'mongoose'

const commentSchema = new Schema({
    commentBody: { type: String, required: true },
    postId: { type: Types.ObjectId, ref: "Post", required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    deletedBy: { type: Types.ObjectId, ref: "User" },
    replies: [{ type: Types.ObjectId, ref: "Comment" }],
    replyDepth: { type: Number, default: 0, enum: [0, 1, 2] },
    parentComment: { type: Types.ObjectId, ref: "Comment" }
}, {
    timestamps: true
})

commentSchema.pre("findOneAndUpdate", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery())
    if (docToUpdate) {
        docToUpdate.__v++
        await docToUpdate.save()
    }
})
commentSchema.pre("updateOne", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        docToUpdate.__v = docToUpdate.__v + 1
        await docToUpdate.save()
    }
})

const commentModel = model('Comment', commentSchema)

export default commentModel