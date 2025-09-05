import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { Res } from "../DataTypes/Common.types"
import { ResponseCode } from "./ResponseCode"

export const middleware = (req: Request, res: Response<Res>, next: NextFunction): void => {
	const authorization: string | undefined = req.headers.authorization

	if (!authorization) {
		res.status(ResponseCode.AUTH_ERROR).json({
			status: false,
			message: "No credentials sent!"
		})
		return
	}

	// Check if authorization header starts with "Bearer "
	if (!authorization.startsWith("Bearer ")) {
		res.status(ResponseCode.AUTH_ERROR).json({
			status: false,
			message: "Invalid token format. Use Bearer token."
		})
		return
	}

	// Extract token from "Bearer <token>"
	const token = authorization.substring(7) // Remove "Bearer " prefix

	if (!token) {
		res.status(ResponseCode.AUTH_ERROR).json({
			status: false,
			message: "Token not provided!"
		})
		return
	}

	try {
		const decrypted = jwt.verify(token, process.env.JWT_SECRET ?? "") as JwtPayload
		req.User = {
			_id: decrypted._id,
			email: decrypted.email
		}

		next()
	} catch (error) {
		res.status(ResponseCode.AUTH_ERROR).json({
			status: false,
			message: "Invalid or expired token!"
		})
	}
}