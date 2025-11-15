import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import presenceRoutes from './modules/presence/presence.routes';
import facebookRoutes from './modules/facebook/facebook.routes';
import chatRouter from './modules/chat/chat.routes';
import ticketRoutes from './modules/ticket/ticket.routes';
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
]

export const app = express();
app.use(cors({
  origin: function (origin, cb) {
    
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,                       
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', presenceRoutes)
app.use('/api/facebook', facebookRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/tickets', ticketRoutes);

const PORT = Number(process.env.PORT ?? 4000);

