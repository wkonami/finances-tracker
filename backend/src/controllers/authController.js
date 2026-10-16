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

async function register(req, res) {
  try {
    const {username, password} = req.body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Usuário e senha são obrigatórios.',
      });
    }

    const normalizedUsername = username.trim();

    if (
      normalizedUsername.length < 3 ||
      normalizedUsername > 30
    ) {
      return res.status(400).json({
        message: 'O usuário deve ter entre 3 e 30 caracteres.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'A senha deve conter pelo menos 8 caracteres.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return res.status(201).json({
      message: 'Conta criada com sucesso.',
      user,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Este usuário já está cadastrado.',
      });
    }

    console.error('Erro ao registrar usuário:', error);

    return res.status(500).json({
      message: 'Erro interno ao criar a conta.',
    });
  }
  
}

module.exports = {
  login,
  register,
};