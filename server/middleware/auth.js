const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        req.userId = decoded.userId;
        req.token = token;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = auth;
