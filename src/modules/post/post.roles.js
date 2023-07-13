
import { roles } from './../../middleware/auth.js';

export const postEndpoints= {
    testAPI:[roles.admin, roles.hr]
}