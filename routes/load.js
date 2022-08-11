// Route files
import { router as diveCenters } from './diveCenters.js';
import { router as courses } from './courses.js';
import { router as auth } from './auth.js';
import { router as users } from './users.js';
import { router as reviews } from './reviews.js';
import { errorHandler } from '../middleware/error.js';

export default (app) => {

    // Mount routers
    app.use('/api/v1/diveCenters', diveCenters);
    app.use('/api/v1/courses', courses);
    app.use('/api/v1/auth', auth);
    app.use('/api/v1/users', users);
    app.use('/api/v1/reviews', reviews);

    // Mount error handler
    app.use(errorHandler);
}