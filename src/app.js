const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/health', healthRoutes);
app.use('/patients', require('./routes/patientRoutes'));
app.use('/doctors', require('./routes/doctorRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));
app.use('/waitlist', require('./routes/waitlistRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/feedback', require('./routes/feedbackRoutes'));
app.use('/admin/queues', require('./routes/queueRoutes'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
