var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '../../config';
import { User } from '../database/models';
import chalk from "chalk";
export const validateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.header('Authorization');
    console.log(chalk.blue('🔒 token', token));
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(chalk.green('🔓 decoded: ', decoded));
        if (decoded.email) {
            console.log(chalk.yellow('🔍 finding user'));
            const user = yield User.findOne({ email: decoded.email });
            console.log(chalk.cyan('👤 found user: '));
            if ((user === null || user === void 0 ? void 0 : user.loginToken) === String(token)) {
                console.log(chalk.magenta('🔑 token match'));
                req.user = { email: user.email, _id: String(user._id), socketId: user.socketId, fullName: user.fullName };
                req.customSocket = req.app.get("chat-socket");
                next();
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: (user === null || user === void 0 ? void 0 : user.loginToken) ? "yout account has been loged in to some other device" : "please login to user this app"
                });
            }
        }
    }
    catch (error) {
        console.log(chalk.red('❌ error: ', error));
        res.status(400).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
