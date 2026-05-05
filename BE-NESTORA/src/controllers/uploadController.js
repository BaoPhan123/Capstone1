const { uploadSingleImage, uploadMultipleImages } = require("../utils/uploadImage");

exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file để upload"
      });
    }

    const folder = req.body.folder || "nestora";
    const result = await uploadSingleImage(req.file, folder);

    res.json({
      success: true,
      data: result,
      message: "Upload ảnh thành công"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một file để upload"
      });
    }

    const folder = req.body.folder || "nestora";
    const results = await uploadMultipleImages(req.files, folder);

    res.json({
      success: true,
      data: results,
      message: `Upload ${results.length} ảnh thành công`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
