import mongoose from "mongoose";
import { checkIdExists } from './validate.js';
import DiveCenter from './DiveCenter.js';
import User from './User.js';

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a title or the review'],
        maxlength: 100
    },
    text: {
        type: String,
        required: [true, 'Please add some text']
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'Please add a rating between 1 and 10']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    diveCenter: {
        type: mongoose.Schema.ObjectId,
        ref: 'DiveCenter',
        required: true,
        validate: {
            validator: async (id) => await checkIdExists(id, DiveCenter),
            message: (props) => `${props.path} not found with id of ${props.value}`
        }
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async (id) => await checkIdExists(id, User),
            message: (props) => `${props.path} not found with id of ${props.value}`
        }
    }
});

// Prevent user from submitting more than one reviews per dive center
ReviewSchema.index({ diveCenter: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (diveCenterId) {

    const obj = await this.aggregate([
        {
            $match: { diveCenter: diveCenterId }
        },
        {
            $group: {
                _id: '$diveCenter',
                averageRating: { $avg: '$rating' }
            }
        }
    ]);

    try {
        await this.model('DiveCenter').findByIdAndUpdate(diveCenterId, {
            averageRating: obj[0].averageRating
        });
    } catch (error) {
        console.error(error);
    }
}

// Call getAverageRating after save
ReviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.diveCenter);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', async function (next) {
    await this.constructor.getAverageRating(this.diveCenter);
    next();
});

export default mongoose.model('Review', ReviewSchema);