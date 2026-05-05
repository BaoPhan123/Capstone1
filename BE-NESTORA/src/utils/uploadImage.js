const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp"
};

const getPublicBaseUrl = () => {
  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  return base.replace(/\/$/, "");
};

const sanitizeFolder = (folder = "nestora") => {
  return String(folder)
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/") || "nestora";
};

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const uploadToLocal = async (file, folder = "nestora") => {
  const safeFolder = sanitizeFolder(folder);
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const targetDir = path.join(uploadsRoot, ...safeFolder.split("/"));

  await fs.promises.mkdir(targetDir, { recursive: true });

  const ext = MIME_EXTENSION_MAP[file.mimetype] || "jpg";
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const fullPath = path.join(targetDir, fileName);
  await fs.promises.writeFile(fullPath, file.buffer);

  const relativePath = `${safeFolder}/${fileName}`;

  return {
    url: `${getPublicBaseUrl()}/uploads/${relativePath}`,
    publicId: `local:${relativePath}`,
    width: null,
    height: null,
    format: ext
  };
};

const uploadToCloudinary = (buffer, folder = "nestora") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

const uploadSingleImage = async (file, folder = "nestora") => {
  try {
    if (!file) {
      throw new Error("Không có file được upload");
    }

    const result = isCloudinaryConfigured()
      ? await uploadToCloudinary(file.buffer, folder)
      : await uploadToLocal(file, folder);

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id || result.publicId,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    if (file) {
      try {
        return await uploadToLocal(file, folder);
      } catch (_) {
        // Re-throw original cloud/local error below
      }
    }
    throw new Error(`Upload ảnh thất bại: ${error.message}`);
  }
};

const uploadMultipleImages = async (files, folder = "nestora") => {
  try {
    if (!files || files.length === 0) {
      throw new Error("Không có file nào được upload");
    }

    const uploadPromises = isCloudinaryConfigured()
      ? files.map(file => uploadToCloudinary(file.buffer, folder))
      : files.map(file => uploadToLocal(file, folder));
    const results = await Promise.all(uploadPromises);

    return results.map(result => ({
      url: result.secure_url || result.url,
      publicId: result.public_id || result.publicId,
      width: result.width,
      height: result.height,
      format: result.format
    }));
  } catch (error) {
    if (files && files.length > 0) {
      try {
        return await Promise.all(files.map((file) => uploadToLocal(file, folder)));
      } catch (_) {
        // Re-throw original cloud/local error below
      }
    }
    throw new Error(`Upload ảnh thất bại: ${error.message}`);
  }
};

const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Không có publicId để xóa");
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      throw new Error("Xóa ảnh thất bại");
    }

    return { success: true, message: "Xóa ảnh thành công" };
  } catch (error) {
    throw new Error(`Xóa ảnh thất bại: ${error.message}`);
  }
};

const deleteMultipleImages = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      throw new Error("Không có publicId nào để xóa");
    }

    const deletePromises = publicIds.map(publicId => cloudinary.uploader.destroy(publicId));
    const results = await Promise.all(deletePromises);

    return {
      success: true,
      message: `Đã xóa ${results.length} ảnh`,
      results
    };
  } catch (error) {
    throw new Error(`Xóa ảnh thất bại: ${error.message}`);
  }
};

const getImageUrl = (publicId, transformations = {}) => {
  try {
    const { width, height, crop = "fill", quality = "auto", format = "auto" } = transformations;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      format,
      secure: true
    });
  } catch (error) {
    throw new Error(`Tạo URL ảnh thất bại: ${error.message}`);
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageUrl
};
