import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import aadhaarRouter from "./routes/aadhaarRoutes";
import litRouter from "./routes/litRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/aadhaar", aadhaarRouter);
app.use("/api/lit", litRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
