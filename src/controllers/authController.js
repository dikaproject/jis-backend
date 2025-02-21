const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword, 
                name,
                role: "USER",
                profile: {
                    create: {
                        bio: null,
                        age: null,
                        gender: null,
                        avatar: null
                    }
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profile: true
            }
        });

        const token = generateToken(user);
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);
    
    res.json({ 
      user: userWithoutPassword, 
      token 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true
        }
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  module.exports = { register, login, getProfile };