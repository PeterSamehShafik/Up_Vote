import { Router } from 'express'
import * as userController from './controller/user.js'
import auth, { allRoles } from './../../middleware/auth.js';
import { userEndpoint } from './user.roles.js';
import myMulter, { fileValidation, HME } from './../../services/multer.js';
const router = Router()

//get methods
router.get('/profile/:id', userController.getProfile)
router.get('/all', userController.getUsers)


//updating methods
router.patch('/updateProfile', auth(allRoles), userController.updateProfile)
router.patch('/profilePic', auth(allRoles), myMulter(fileValidation.image).single('image'), HME, userController.profilePic)
router.patch('/coverPics', auth(allRoles), myMulter(fileValidation.image).array('image', 5), HME, userController.coverPics)

//deleting and blocking methods
router.patch('/softDelete/:id', auth(allRoles), userController.softDelete)
router.patch('/block/:id', auth(userEndpoint.blockUser), userController.blockUser)






export default router