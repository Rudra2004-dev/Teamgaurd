import express from "express";
import healthRoutes from "./routes/health.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";

const application = express();


const PORT = 5000;

application.use(express.json());

application.use("/api/health", healthRoutes);
application.use("/api/users", userRoutes);
application.use("/api/auth", authRoutes);


application.listen(PORT, ()=> {
    console.log(`TeamGuard API is running on http: //localhost: ${PORT}`);
});

