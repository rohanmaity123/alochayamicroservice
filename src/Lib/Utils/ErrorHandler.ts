import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"
import { Res } from "../DataTypes/Common.types"
import { ResponseCode } from "./ResponseCode"
import { z } from "zod"

// Simple validation function for backwards compatibility
export const InputValidator = (data: any, rules: Record<string, string>): Promise<void> => {
    return new Promise((resolve, reject) => {
        const errors: string[] = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const ruleArray = rule.split('|');
            
            for (const singleRule of ruleArray) {
                if (singleRule === 'required' && (!value || value === '')) {
                    errors.push(`${field} is required`);
                } else if (singleRule === 'email' && value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errors.push(`${field} must be a valid email`);
                    }
                } else if (singleRule.startsWith('minLength:') && value) {
                    const minLength = parseInt(singleRule.split(':')[1]);
                    if (value.length < minLength) {
                        errors.push(`${field} must be at least ${minLength} characters long`);
                    }
                }
            }
        }
        
        if (errors.length > 0) {
            reject(errors[0]);
        } else {
            resolve();
        }
    });
};

export const dbError = (error: any, res: Response<Res<any>>): void => {
	switch (true) {
		case error.code === 11000: {
			const keyPattern = /index: .*?\.(.*?)_.*? dup key:/
			const matches = error.message.match(keyPattern)

			const duplicateField = matches && matches[1] ? matches[1] : "unknown"

			res.status(ResponseCode.DUPLICATE_KEY_ERROR).json({
				status: false,
				message: `Duplicate key error on field: ${duplicateField}`,
				error: error
			})
			break
		}

		case error instanceof mongoose.Error.ValidationError: {
			const errors: Array<string> = []

			for (const field in error.errors) {
				if (Object.prototype.hasOwnProperty.call(error.errors, field)) {
					errors.push(error.errors[field].message)
				}
			}

			res.status(ResponseCode.VALIDATION_ERROR).json({
				status: false,
				error: errors,
				message: errors[0]
			})
			break
		}

		case error instanceof mongoose.Error.CastError: {
			res.status(ResponseCode.BAD_REQUEST).json({
				status: false,
				message: `Invalid ${error.kind}: ${error.value}`,
				error: error
			})
			break
		}

		default: {
			res.status(ResponseCode.SERVER_ERROR).json({
				status: false,
				message: "Internal Server Error",
				error: error
			})
			break
		}
	}
}

/* eslint-disable indent */
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            return await fn(req, res, next);
        } catch (error) {
            console.log('error..................', error);
            // Sentry.captureException(error); // Uncomment if Sentry is installed
            if (error instanceof z.ZodError) {
                return res?.status(ResponseCode.SERVER_ERROR)?.json({
                    message: `\`${
                        String(error.issues[0].path[0])
                    }\` ${error.issues[0].message.toLowerCase()}`,
                    status: false,
                    error: error.issues
                });
            }
            if (error instanceof Error) {
                return res?.status(ResponseCode.SERVER_ERROR)?.json({
                    message: error.message || 'something went wrong',
                    status: false
                });
            }
        }
    };
/* eslint-enable indent */