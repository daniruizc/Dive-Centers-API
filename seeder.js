import fs from 'fs';
import mongoose from 'mongoose';
import colors from 'colors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load models
import DiveCenter from './models/DiveCenter.js';
import Course from './models/Course.js';
import User from './models/User.js';
import Review from './models/Review.js';

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Read JSON files
const diveCenters = JSON.parse(fs.readFileSync(`${__dirname}/_data/diveCenters.json`, 'utf-8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'));

// Import into DB
const importData = async () => {
    try {
        await DiveCenter.create(diveCenters);
        await Course.create(courses);
        await User.create(users);
        await Review.create(reviews);
        console.log('Data imported...'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(error);
    }
}

// Delete data
const deleteData = async () => {
    try {
        await DiveCenter.deleteMany();
        await Course.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data destroyed...'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(error);
    }
}

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}