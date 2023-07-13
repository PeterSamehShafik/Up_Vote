import mongoose from "mongoose";

const connectDB = async () => {
    return await mongoose.connect(process.env.DBURI)
        .then(res => {
            console.log('DB connected Successfully')
            // console.log(res)
        })
        .catch(err => {
            console.log(`DB failed to connect....${err}`)
        })
}

export default connectDB