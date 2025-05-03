
const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if(!req.user || !req.user.role) {
                return res.status(401).json({message: 'Unauthorized: No user context found'});
            }

            if(!allowedRoles.includes(req.user.role)) {
                return res.status(401).json({message: 'Restricted Role: Access Denied'})
            }

            next();
        } catch (error) {
            res.status(500).json({message: 'Server Error!'})
        }
    }
}

module.exports = allowRoles;