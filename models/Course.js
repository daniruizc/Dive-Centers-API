import mongoose from "mongoose";
import { checkIdExists } from './validate.js';
import DiveCenter from './DiveCenter.js';
import User from './User.js';

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    days: {
        type: Number,
        required: [true, 'Please add number of days']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
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
        },
        index: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async (id) => await checkIdExists(id, User),
            message: (props) => `${props.path} not found with id of ${props.value}`
        },
        index: true
    }
});

CourseSchema.index({ diveCenter: 1, user: 1 });

// Static method to get avg of course prices
CourseSchema.statics.getAverageCost = async function (diveCenterId) {

    const obj = await this.aggregate([
        {
            $match: { diveCenter: diveCenterId }
        },
        {
            $group: {
                _id: '$diveCenter',
                averageCost: { $avg: '$price' }
            }
        }
    ]);

    try {
        await this.model('DiveCenter').findByIdAndUpdate(diveCenterId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10
        });
    } catch (error) {
        console.error(error);
    }
}

// Call getAverageCost after save
CourseSchema.post('save', function () {
    this.constructor.getAverageCost(this.diveCenter);
});

// Call getAverageCost before remove
CourseSchema.pre('remove', async function (next) {
    await this.constructor.getAverageCost(this.diveCenter);
    next();
});

export default mongoose.model('Course', CourseSchema);