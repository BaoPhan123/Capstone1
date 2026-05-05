

const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true },
    image: { type: String, required: false },
    slug: { type: String, unique: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
}, {
    timestamps: true
});

NewsSchema.pre('save', function (next) {
    if (!this.slug && this.title) {
        const baseSlug = this.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        this.slug = `${baseSlug}-${Date.now()}`;
    }
    next();
});

module.exports = mongoose.model('News', NewsSchema);