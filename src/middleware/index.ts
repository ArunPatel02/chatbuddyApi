import jwt, { JwtPayload } from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../../config';
import { User } from '../database/models';
import chalk from "chalk";
import { Socket } from "socket.io";

export interface SecureRequest extends Request {
    user?: {
        email: string;
        fullName: string | undefined;
        _id: string;
        socketId: string | undefined;
    },
    customSocket?: Socket
}

export const validateUser = async (req: SecureRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization');
    console.log(chalk.blue('🔒 token', token));
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        console.log(chalk.green('🔓 decoded: ', decoded));
        if (decoded.email) {
            console.log(chalk.yellow('🔍 finding user'));
            const user = await User.findOne({ email: decoded.email })
            console.log(chalk.cyan('👤 found user: ',));
            if (user?.loginToken === String(token)) {
                console.log(chalk.magenta('🔑 token match'));
                req.user = { email: user.email, _id: String(user._id), socketId: user.socketId, fullName: user.fullName };
                req.customSocket = req.app.get("chat-socket")
                next();
            } else {
                return res.status(401).json({
                    success: false,
                    message: user?.loginToken ? "yout account has been loged in to some other device" : "please login to user this app"
                });
            }
        }

    } catch (error) {
        console.log(chalk.red('❌ error: ', error));
        res.status(400).json({
            success: false,
            message: 'Invalid token'
        });
    }
};