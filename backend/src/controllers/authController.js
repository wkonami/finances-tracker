const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Usuário e senha são obrigatórios'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username,
        deletedAt: null
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Usuário ou senha inválidos'
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Usuário ou senha inválidos'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro interno no servidor'
    });

  }
}

module.exports = {
  login
};