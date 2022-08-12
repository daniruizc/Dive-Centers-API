import mongoose from 'mongoose';
import slugify from 'slugify';
import geocoder from '../utils/geocoder.js';
import { checkIdExists } from './validate.js';
import User from './User.js';


const DiveCenterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    website: {
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ]
    },
    phone: {
        type: String,
        maxlength: [20, 'Phone number can not be more than 20 characters']
    },
    email: {
        type: String,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    specialties: {
        // Array of strings
        type: [String],
        required: true
    },
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating can not be more than 1']
    },
    averageCost: Number,
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    createdAt: {
        type: Date,
        default: Date.now
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create dive center slug from the name
DiveCenterSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

// Geocode & create location field
DiveCenterSchema.pre('save', async function (next) {
    const loc = await geocoder.geocode(this.address);

    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
    }

    // Do not save address in DB
    this.address = undefined;
    next();
});

// Cascade delete courses when a dive center is deleted
DiveCenterSchema.pre('remove', async function (next) {
    await this.model('Course').deleteMany({ diveCenter: this._id });
    next();
});

// Reverse populate with virtuals
DiveCenterSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'diveCenter',
    justOne: false
});

export default mongoose.model('DiveCenter', DiveCenterSchema);