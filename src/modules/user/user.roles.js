
import { roles } from './../../middleware/auth.js';


export const userEndpoint = {
    blockUser: [roles.admin]
}
