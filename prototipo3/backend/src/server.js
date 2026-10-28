const express = require('express');
const cors = require('cors');
const { rateLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const osRoutes = require('./routes/osRoutes');
const pecaRoutes = require('./routes/pecaRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const tecnicoRoutes = require('./routes/tecnicoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Configure CORS
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'N Neural API' });
});

// Rate Limiting for Auth Endpoints
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Muitas tentativas de autenticação. Por favor, aguarde alguns minutos.'
});

// Register API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/os', osRoutes);
app.use('/api/pecas', pecaRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/tecnicos', tecnicoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: 'Erro interno no servidor.',
    ...(isProd ? {} : { error: err.message })
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor N Neural executando na porta ${PORT}`);
  });
}

module.exports = app;
