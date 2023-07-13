import { Schema, model } from 'mongoose'


const userSchema = new Schema({
    role: { type: String, default: "user", enum: ["user", "admin", "hr"] },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, default: 'male', enum: ["male", "female"] },
    age: Number,
    profilePic: {
        secure_url: String,
        public_id: String
    },
    coverPics: [{
        secure_url: String,
        public_id: String,
        _id: false
    }],
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    confirmEmail: { type: Boolean, default: false },
    code: { type: String, default: null },
    QrCode: String,
}, {
    timestamps: true
})

// userSchema.pre('save', function (next) {
//     this.password = bcrypt.hashSync(this.password, parseInt(process.env.SALTROUNDS))
//     next();
// });

userSchema.pre("findOneAndUpdate", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        docToUpdate.__v = docToUpdate.__v + 1
        await docToUpdate.save()
    }
})
userSchema.pre("updateOne", async function () {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        docToUpdate.__v = docToUpdate.__v + 1
        await docToUpdate.save()
    }
})


const userModel = model('User', userSchema)

export default userModel