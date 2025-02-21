const prisma = require('../../config/database');
const fs = require('fs').promises;
const path = require('path');

const createResource = async (req, res) => {
  try {
    const { type, title, description, duration, category, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const resource = await prisma.resource.create({
      data: {
        type,
        title,
        description,
        url: `/uploads/${type.toLowerCase()}/${file.filename}`,
        duration: parseInt(duration),
        category,
        tags: tags ? JSON.stringify(tags) : null,
        thumbnail: type === 'VIDEO' ? `/uploads/thumbnails/${file.filename}.jpg` : null
      }
    });
    
    res.status(201).json(resource);
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ message: error.message });
  }
};

const getAllResources = async (req, res) => {
  try {
    const { type, category } = req.query;
    const where = {};
    
    if (type) where.type = type;
    if (category) where.category = category;

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, category, tags } = req.body;
    const file = req.file;

    const existingResource = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updateData = {
      title,
      description,
      duration: parseInt(duration),
      category,
      tags: tags ? JSON.stringify(tags) : null
    };

    if (file) {
      const oldFilePath = path.join(process.cwd(), existingResource.url);
      await fs.unlink(oldFilePath).catch(console.error);

      updateData.url = `/uploads/${existingResource.type.toLowerCase()}/${file.filename}`;
      
      if (existingResource.type === 'VIDEO') {
        updateData.thumbnail = `/uploads/thumbnails/${file.filename}.jpg`;
      }
    }

    const resource = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json(resource);
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(id) }
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const filePath = path.join(process.cwd(), resource.url);
    await fs.unlink(filePath).catch(console.error);

    if (resource.thumbnail) {
      const thumbnailPath = path.join(process.cwd(), resource.thumbnail);
      await fs.unlink(thumbnailPath).catch(console.error);
    }

    await prisma.resource.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource
};