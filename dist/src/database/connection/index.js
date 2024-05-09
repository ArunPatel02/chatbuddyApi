import mongoose from 'mongoose';
import chalk from 'chalk';
import { MONGODB_URI } from '../../../config';
const connectToDatabase = () => {
    if (!MONGODB_URI) {
        throw new Error('The MONGODB_URI is undefined.');
    }
    console.log(MONGODB_URI);
    mongoose.connect(MONGODB_URI)
        .then(() => console.log(chalk.bgGreen.white('🚀 Database Connected Successfully')))
        .catch(err => console.log(chalk.bgRed.white(err)));
};
export default connectToDatabase;
