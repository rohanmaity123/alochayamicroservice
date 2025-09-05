export type UserLoginRequest = {
    email: string,
    password: string
}

export type UserRegisterRequest = {
    firstName: string
    lastName:string
    email: string
    password: string
    image?: string
    age: number
}

export type UserLoginResponse = {
    token?: string
}

export type UserRegisterResponse = UserLoginResponse

export type AdminLoginRequest = {
    email: string,
    password: string
}

export type AdminRegisterRequest = {
    name: string
    email: string
    password: string
}

export type AdminLoginResponse = {
    token?: string
}

export type AdminRegisterResponse = AdminLoginResponse

export type AdminProfileType = {
    name: string
    email: string
    image: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _id: string
}