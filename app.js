import dotenv from 'dotenv'
dotenv.config({ path: './config/.env' })

import express from 'express'
import connectDB from './DB/connection.js';
import * as indexRouter from './src/modules/index.router.js'
import PDF_above20_schedule_RUN from './src/services/schedule.js';



const app = express()
const port = 3000
const baseURL = process.env.BASEURL

app.use(express.json())

app.use(`${baseURL}/auth`, indexRouter.authRouter)
app.use(`${baseURL}/user`, indexRouter.userRouter)
app.use(`${baseURL}/post`, indexRouter.postRouter)
app.use(`${baseURL}/comment`, indexRouter.commentRouter)

app.use('*', (req, res) => {
    res.status(404).json({ message: "404 Page not found or in-valid method" })
})

PDF_above20_schedule_RUN // useless but to make sense
connectDB()
app.listen(port, () => {
    console.log(`Server is running on port ${port}.............`)
})