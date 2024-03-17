import multer from "multer";
import { generateImageFilename } from "../utils/product.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, generateImageFilename(file.originalname));
  },
});

export const uploads = multer({ storage });
