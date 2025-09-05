import { Router } from "express";
import AdminAuthController from "../Controller/Auth/Admin.controller";
import { middleware } from "../Lib/Utils/Middleware";

const AdminRouter: Router = Router();

// Admin authentication routes (no middleware required)
AdminRouter.post("/login", AdminAuthController.login);
AdminRouter.post("/register", AdminAuthController.register);

// Protected admin routes (require authentication)
AdminRouter.use(middleware);
AdminRouter.get("/profile", AdminAuthController.getProfile);

export default AdminRouter;
