import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes/aadhaarRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/aadhaar", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
