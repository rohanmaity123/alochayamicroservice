import { Router } from "express"
import AdminRouter from "./Admin.route"

const Route: Router = Router()

// Admin routes (public auth + protected routes)
Route.use("/admin", AdminRouter)

export default Route