import { Router } from 'express'
import * as commentController from './controller/comment.js'
import auth, { allRoles } from './../../middleware/auth.js';

const router = Router()

//get methods
router.get('/:id', auth(allRoles), commentController.commentById)

//posts methods
router.post('/addComment/:postId', auth(allRoles), commentController.addComment)
router.post('/addReply/:commentId', auth(allRoles), commentController.addReply)


//editing methods
router.patch('/:id/update', auth(allRoles), commentController.updateComment)
router.patch('/:id/like', auth(allRoles), commentController.likeComment)


//deleting methods 
router.patch('/:id/softDelete', auth(allRoles), commentController.softDeleteComment)







export default router