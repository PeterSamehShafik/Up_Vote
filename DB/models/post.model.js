import { Schema, model, Types } from 'mongoose'

const postSchema = new Schema({
    postBody: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    unlikes: [{ type: Types.ObjectId, ref: "User" }],
    postPic: {
        secure_url: String,
        public_id: String
    },
}, {
    timestamps: true
})

postSchema.pre("findOneAndUpdate", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery())
    if (docToUpdate) {
        docToUpdate.__v++
        await docToUpdate.save()
    }
})
postSchema.pre("updateOne", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        docToUpdate.__v = docToUpdate.__v + 1
        await docToUpdate.save()
    }
})

const postModel = model('Post', postSchema)

export default postModel