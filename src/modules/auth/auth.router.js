import { Router } from 'express'
import * as authController from './controller/registration.js'

const router = Router()

router.post('/signUp', authController.signUp)
router.post('/signIn', authController.signIn)
router.get('/confirmEmail/:token', authController.confirmEmail)




export default router