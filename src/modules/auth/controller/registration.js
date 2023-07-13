
import userModel from '../../../../DB/models/user.model.js';
import sendEmail from '../../../services/email.js';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs';


export const signUp = async (req, res) => {
    try {
        const { userName, email, password, gender, age } = req.body
        const exists = await userModel.findOne({ email }).select("email")
        if (exists) {
            res.status(409).json({ message: "email already exist" })
        } else {
            const hashedPassword = bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS))
            const newUser = await userModel.create({ userName, email, password: hashedPassword, gender, age })
            const shareProfileLink = `${req.protocol}://${req.headers.host}${process.env.BASEURL}/user/profile/${newUser._id}`

            QRCode.toDataURL(shareProfileLink)
                .then(async (url) => await userModel.updateOne({ _id: newUser._id }, { QrCode: url }))
                .catch(err => console.log("couldn't generate QR"))

            if (!newUser) {
                res.status(400).json({ message: "couldn't sign up please try again" })
            } else {
                const token = jwt.sign({ _id: newUser?._id }, process.env.SIGNUPKEY, { expiresIn: '12h' })
                const link = `${req.protocol}://${req.headers.host}${process.env.BASEURL}/auth/confirmEmail/${token}`
                const message = ` 
                                <h1> MyOrg Confirmation </h1>
                                <p> Please follow this <a href=${link}> Link </a> to Confirm your account </p>
                                `
                const isSent = sendEmail(email, "Confirm Email", message)
                isSent ? res.status(201).json({ message: "done", details: "Please confirm your email" }) : res.status(400).json({ message: "something went wrong", emailStatus: isSent })
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const confirmEmail = async (req, res) => {
    try {
        const { token } = req.params
        const decoded = jwt.verify(token, process.env.SIGNUPKEY)
        if (decoded?._id) {
            const isConfirmed = await userModel.updateOne({ _id: decoded._id, confirmEmail: false }, { confirmEmail: true })
            isConfirmed.modifiedCount ? res.status(200).json({ message: "done" }) : res.status(400).json({ message: "in-valid id or already confirmed" })
        } else {
            res.status(400).json({ message: "in-valid payload token" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (user && !user?.isDeleted) {
            const match = bcrypt.compareSync(password, user.password)
            if (match) {
                if (user.confirmEmail) {
                    const token = jwt.sign({ _id: user._id }, process.env.SIGNINKEY, { expiresIn: "12h" })
                    res.status(200).json({ message: "done", token })
                } else {
                    res.status(404).json({ message: "Please confirm your email first" })
                }
            } else {
                res.status(404).json({ message: "In-valid email or password" })

            }
        } else {
            res.status(404).json({ message: "In-valid email or password" })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error })
    }
}