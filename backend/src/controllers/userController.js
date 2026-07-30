const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');

const SALT_ROUNDS = 10;

async function listUsers(req, res) {

  try {

    const users = await prisma.user.findMany({

      where: {
        deletedAt: null
      },

      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },

      orderBy: {
        username: 'asc'
      }

    });

    return res.json(users);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao listar usuários'
    });

  }

}

async function getUser(req, res) {

  try {

    const id = Number(req.params.id);

    const user = await prisma.user.findFirst({

      where: {
        id,
        deletedAt: null
      },

      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }

    });

    if (!user) {

      return res.status(404).json({
        message: 'Usuário não encontrado'
      });

    }

    return res.json(user);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao buscar usuário'
    });

  }

}

async function createUser(req, res) {

  try {

    const {
      username,
      password,
      role
    } = req.body;

    if (!username || !password) {

      return res.status(400).json({
        message: 'Usuário e senha são obrigatórios'
      });

    }

    const existingUser = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (existingUser) {

      return res.status(400).json({
        message: 'Usuário já existe'
      });

    }

    let newRole = 'USER';

    if (role === 'ADMIN') {

      if (req.user.role !== 'ADMIN') {

        return res.status(403).json({
          message: 'Somente administradores podem criar outro administrador'
        });

      }

      newRole = 'ADMIN';

    }

    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    const user = await prisma.user.create({

      data: {

        username,

        password: hashedPassword,

        role: newRole

      },

      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }

    });

    return res.status(201).json(user);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao criar usuário'
    });

  }

}

async function updateUser(req, res) {

  try {

    const id = Number(req.params.id);

    const {
      username,
      password,
      role
    } = req.body;

    const existingUser = await prisma.user.findFirst({

      where: {
        id,
        deletedAt: null
      }

    });

    if (!existingUser) {

      return res.status(404).json({
        message: 'Usuário não encontrado'
      });

    }

    const data = {};

    if (username) {

      data.username = username;

    }

    if (password) {

      data.password = await bcrypt.hash(
        password,
        SALT_ROUNDS
      );

    }

    if (role) {

      if (
        role === 'ADMIN' &&
        req.user.role !== 'ADMIN'
      ) {

        return res.status(403).json({
          message: 'Somente administradores podem alterar permissões'
        });

      }

      data.role = role;

    }

    const user = await prisma.user.update({

      where: {
        id
      },

      data,

      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }

    });

    return res.json(user);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao atualizar usuário'
    });

  }

}

async function deleteUser(req, res) {

  try {

    const id = Number(req.params.id);

    if (id === req.user.id) {

      return res.status(400).json({
        message: 'Você não pode excluir seu próprio usuário.'
      });

    }

    const existingUser = await prisma.user.findFirst({

      where: {
        id,
        deletedAt: null
      }

    });

    if (!existingUser) {

      return res.status(404).json({
        message: 'Usuário não encontrado'
      });

    }

    await prisma.user.update({

      where: {
        id
      },

      data: {
        deletedAt: new Date()
      }

    });

    return res.json({
      message: 'Usuário arquivado com sucesso'
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Erro ao arquivar usuário'
    });

  }

}

module.exports = {

  listUsers,

  getUser,

  createUser,

  updateUser,

  deleteUser

};