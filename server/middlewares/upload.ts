import type { Request } from "express";
import multer from "multer";
import path from "path";

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const multerStorage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const newName = `${name}-${Date.now()}${ext}`;
    cb(null, newName);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [".mp3", ".mp4", ".wav", ".m4a"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only MP3, MP4, WAV, and M4A files are allowed.",
      ),
    );
  }
};

export const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter,
});
