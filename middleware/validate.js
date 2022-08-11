import ErrorResponse from '../utils/errorResponse.js';

export default (schema) => {
    return (req, res, next) => {

        const { error } = schema.validate(req.body);
        if (error) {
            return next(new ErrorResponse(`Validation error: ${error.details[0].message}`, 400));
        }

        next();
    }
}