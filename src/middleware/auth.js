import jwt from 'jsonwebtoken'
import userModel from './../../DB/models/user.model.js';

export const roles = {
    admin: "admin",
    user: "user",
    hr: "hr"
}
export const allRoles = [roles.admin, roles.user, roles.hr]

const auth = (accessRoles = []) => {
    return async (req, res, next) => {
        try {
            const { authorization } = req.headers
            if (authorization.startsWith(process.env.BEARERKEY)) {
                const decoded = jwt.verify(authorization.split(process.env.BEARERKEY)[1], process.env.SIGNINKEY)
                if (decoded?._id) {
                    const user = await userModel.findOne({ _id: decoded._id, $and: [{ isDeleted: false }, { isBlocked: false }, { confirmEmail: true }] }).select("role userName")
                    if (user) {
                        if (accessRoles.includes(user.role)) {
                            req.user = user
                            next()
                        } else {
                            res.status(403).json({ message: "you don't have the permission" })
                        }
                    } else {
                        res.status(401).json({ message: "This user was deleted or blocked or not confirmed yet, please contact the administrator" })
                    }
                } else {
                    res.status(401).json({ message: "authorization error (payload)" })
                }
            } else {
                res.status(401).json({ message: "authorization error (bearerKey)" })
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error in auth", error })
        }
    }
}



export default auth