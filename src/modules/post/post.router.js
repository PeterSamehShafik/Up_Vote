import { Router } from 'express'
import * as postController from "./controller/post.js"
import auth, { allRoles } from './../../middleware/auth.js';
import myMulter, { fileValidation } from './../../services/multer.js';

const router = Router()

//getting methods
router.get('/all', postController.allPosts)
router.get('/myPosts', auth(allRoles), postController.myPosts)

//posting methods
router.post("/add", auth(allRoles), myMulter(fileValidation.image).single('image'), postController.addPost)

//editing methods
router.patch('/:id/update', auth(allRoles), myMulter(fileValidation.image).single('image'), postController.updatePost)
router.patch('/:id/like', auth(allRoles), postController.likePost)
router.patch('/:id/unlike', auth(allRoles), postController.unlikePost)

//deleting methods
router.delete('/:id/delete', auth(allRoles), postController.deletePost)






export default router