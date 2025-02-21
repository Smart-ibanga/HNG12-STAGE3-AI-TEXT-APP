const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Sample API
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from Netlify Functions!" });
});

module.exports.handler = serverless(app);
