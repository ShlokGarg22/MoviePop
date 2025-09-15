import exprses from 'express';
import dotenv from 'dotenv';
import recommendRoutes from './routes/recommendRoutes.js';
dotenv.config();

const app = exprses();

app.use(exprses.json());

app.use('/api/recommend',recommendRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));