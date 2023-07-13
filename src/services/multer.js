import multer from "multer"

export const fileValidation = {
    image: ["image/png", "image/jpeg", "image/gif"],
    pdf: ["application/pdf"]
}

export const HME = (err, req, res, next) => {
    if (err) {
        res.status(400).json({ message: "multer error", err })
    } else {
        next()
    }
}

const myMulter = (customValidation = fileValidation.image) => {

    const storage = multer.diskStorage({})
    function fileFilter(req, file, cb) {
        if (customValidation.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb("In-valid Format", false)
        }
    }
    const upload = multer({ fileFilter, storage })

    return upload
}

export default myMulter