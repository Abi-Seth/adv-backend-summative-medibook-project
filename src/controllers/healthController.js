function getHealth(req, res) {
  res.json({ message: 'MediBook API is running' });
}

module.exports = { getHealth };
