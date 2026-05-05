import { axiosAuthClient } from '../lib/axios';

const pickUrl = (payload) => {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (typeof payload.url === 'string') return payload.url;
    if (typeof payload.secure_url === 'string') return payload.secure_url;
    return '';
};

const uploadService = {
    // Upload 1 ảnh
    uploadSingle: async (file, folder = 'nestora') => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', folder);

            const response = await axiosAuthClient.post('/api/upload/single', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const rawData = response.data?.data;
            const url = pickUrl(rawData);
            if (!url) {
                return {
                    success: false,
                    message: 'Upload ảnh thất bại: Không nhận được URL ảnh hợp lệ',
                    error: response.data,
                };
            }

            return {
                success: true,
                data: {
                    ...(typeof rawData === 'object' ? rawData : {}),
                    url,
                },
                message: response.data.message || 'Upload ảnh thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Upload ảnh thất bại',
                error: error.response?.data,
            };
        }
    },

    // Upload nhiều ảnh
    uploadMultiple: async (files, folder = 'nestora') => {
        try {
            const formData = new FormData();

            // Append multiple files
            Array.from(files).forEach((file) => {
                formData.append('images', file);
            });
            formData.append('folder', folder);

            const response = await axiosAuthClient.post('/api/upload/multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const rawList = Array.isArray(response.data?.data) ? response.data.data : [];
            const normalized = rawList
                .map((item) => {
                    const url = pickUrl(item);
                    if (!url) return null;
                    return {
                        ...(typeof item === 'object' ? item : {}),
                        url,
                    };
                })
                .filter(Boolean);

            if (normalized.length === 0) {
                return {
                    success: false,
                    message: 'Upload ảnh thất bại: Không nhận được URL ảnh hợp lệ',
                    error: response.data,
                };
            }

            return {
                success: true,
                data: normalized,
                message: response.data.message || `Upload ${files.length} ảnh thành công`,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Upload ảnh thất bại',
                error: error.response?.data,
            };
        }
    },

    // Validate file trước khi upload
    validateImage: (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Chỉ chấp nhận file ảnh định dạng jpg, jpeg, png, gif, webp',
            };
        }

        if (file.size > maxSize) {
            return {
                valid: false,
                message: 'Kích thước file không được vượt quá 5MB',
            };
        }

        return { valid: true };
    },

    // Validate nhiều files
    validateMultipleImages: (files) => {
        const maxFiles = 10;

        if (files.length > maxFiles) {
            return {
                valid: false,
                message: `Chỉ được upload tối đa ${maxFiles} ảnh`,
            };
        }

        for (let file of files) {
            const validation = uploadService.validateImage(file);
            if (!validation.valid) {
                return validation;
            }
        }

        return { valid: true };
    },

    // Helper: Convert file to base64 for preview
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    },

    // Helper: Create image preview
    createImagePreview: async (file) => {
        try {
            const base64 = await uploadService.fileToBase64(file);
            return {
                file,
                preview: base64,
                name: file.name,
                size: file.size,
            };
        } catch (error) {
            console.error('Error creating preview:', error);
            return null;
        }
    },
};

export default uploadService;
