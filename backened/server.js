import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recommendRoutes from './routes/recommend.js';
dotenv.config();

const app = express();

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

app.use('/api/recommend',recommendRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));