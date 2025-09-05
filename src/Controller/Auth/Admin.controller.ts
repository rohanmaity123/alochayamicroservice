import { Request, Response, NextFunction } from "express";
import { InputValidator, asyncHandler, dbError } from "../../Lib/Utils/ErrorHandler";
import AdminModel, { AdminModelType } from "../../Model/Admin.model";
import passwordHash from "password-hash";
import mongoose, { Document } from "mongoose";
import jwt from "jsonwebtoken";
import { Res } from "../../Lib/DataTypes/Common.types";
import { ResponseCode } from "../../Lib/Utils/ResponseCode";
import { AdminLoginRequest, AdminLoginResponse, AdminRegisterRequest, AdminRegisterResponse, AdminProfileType } from "../../Lib/DataTypes/Auth.types";

const createToken = (data: Record<string, any>): string => {
    return jwt.sign(data, process.env.JWT_SECRET ?? "")
}

const register = (req: Request<any, any, AdminRegisterRequest>, res: Response<Res<AdminRegisterResponse>>): void => {
    InputValidator(req.body, {
        email: "required|email",
        password: "required|minLength:6",
        name: "required"
    })
        .then(() => {
            const _id = new mongoose.Types.ObjectId();
            const adminData: AdminModelType<{ _id: mongoose.Types.ObjectId }> = {
                ...req.body,
                password: passwordHash.generate(req.body.password, { saltLength: 10 }),
                token: createToken({ _id, email: req.body.email }),
                isActive: true,
                _id
            };

            const adminModel = new AdminModel(adminData);

            adminModel.save()
                .then(() => {
                    const response: Res<AdminRegisterResponse> = {
                        data: {
                            token: adminData.token ?? ''
                        },
                        status: true,
                        message: "Admin registered successfully"
                    };
                    res.status(ResponseCode.SUCCESS).json(response);
                })
                .catch((error) => {
                    dbError(error, res);
                });
        })
        .catch((error) => {
            res.status(ResponseCode.VALIDATION_ERROR).json({
                status: false,
                message: error
            });
        });
};

const login = (req: Request<any, any, AdminLoginRequest>, res: Response<Res<AdminLoginResponse>>): void => {
    const { email, password } = req.body;

    AdminModel.findOne({ 
        email, 
        isActive: true, 
        isDeleted: { $ne: true } 
    })
        .then((admin) => {
            if (admin && admin.comparePassword && admin.comparePassword(password)) {
                // Update token on login
                const newToken = createToken({ _id: admin._id, email: admin.email });
                admin.token = newToken;
                
                admin.save()
                    .then(() => {
                        const response: Res<AdminLoginResponse> = {
                            data: {
                                token: newToken
                            },
                            status: true,
                            message: "Admin login successful"
                        };
                        res.status(ResponseCode.SUCCESS).json(response);
                    })
                    .catch((error) => {
                        dbError(error, res);
                    });
            } else {
                res.status(ResponseCode.NOT_FOUND_ERROR).json({
                    status: false,
                    message: "Invalid credentials or admin not found"
                });
            }
        })
        .catch((error) => {
            dbError(error, res);
        });
};

const getProfile = asyncHandler(async (req: Request, res: Response<Res<AdminProfileType>>, next: NextFunction) => {
    const adminId = req.User?._id;

    if (!adminId) {
        res.status(ResponseCode.AUTH_ERROR).json({
            status: false,
            message: "Authentication required"
        });
        return;
    }

    const admin = await AdminModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(adminId),
                isActive: true,
                isDeleted: { $ne: true }
            }
        },
        {
            $project: {
                __v: 0,
                token: 0,
                password: 0,
                isDeleted: 0
            }
        }
    ]);

    if (!admin || admin.length === 0) {
        res.status(ResponseCode.NOT_FOUND_ERROR).json({
            status: false,
            message: "Admin profile not found"
        });
        return;
    }

    res.status(ResponseCode.SUCCESS).json({
        status: true,
        data: admin[0],
        message: "Successfully retrieved admin profile"
    });
});

const AdminAuthController = {
    register,
    login,
    getProfile
};

export default AdminAuthController;