
import mongoose from "mongoose";

import dns from "dns";

dns.setServers(["1.1.1.1"]);

export const connectDB = async () => {
  await mongoose
    .connect(
      process.env.MONGO_URI,
    )
    .then(() => console.log("DB Connected"));
};