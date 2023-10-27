// ? SoccerMASS Development Web
const devOrigins = ["http://localhost:8081"];

// ? SoccerMASS Production
const prodOrigins = [
  "https://www.soccermass.com", // "https://.soccermass.com",
];

export const accounts = {
  credentials: true,
  methods: ["GET, POST, PUT, DELETE, OPTIONS"],
  origin: process.env.NODE_ENV === "production" ? prodOrigins : devOrigins,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
