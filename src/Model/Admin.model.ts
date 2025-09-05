import mongoose, { Document, Schema, Types } from 'mongoose';
import passwordHash from 'password-hash';
import { UserModelType } from './User.model';

export type AdminModelType<T = Record<string, any>> = T & {
    name: string;
    email: string;
    password?: string;
    image?: string;
    token?: string;
    isActive: boolean;
    isDeleted?: boolean;
    comparePassword?: (candidatePassword: string) => boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

const AdminModelSchema = new Schema<AdminModelType<Document>>(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        image: {
            type: String,
            default: 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png'
        },
        token: String,
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Add indexes for better query performance
AdminModelSchema.index({ isActive: 1 });

AdminModelSchema.methods.comparePassword = function (candidatePassword: string): boolean {
    return passwordHash.verify(candidatePassword, this.password);
};

const AdminModel = mongoose.model<AdminModelType<Document>>('admin', AdminModelSchema);
export default AdminModel;
