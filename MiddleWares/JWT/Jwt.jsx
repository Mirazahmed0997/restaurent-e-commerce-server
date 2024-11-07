const jwt = require('jsonwebtoken');
const Jwt = () => {
    app.post('/jwt', async (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        // console.log(token)
        res.send({ token })
    })
    return jwt;
};

export default Jwt;