import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes/aadhaarRoutes";
import Wrouter from "./routes/walletRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/aadhaar", router);
app.use("/api/wallet", Wrouter);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
