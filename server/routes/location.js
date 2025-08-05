const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/ip-location', async (req, res) => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '위치 조회 실패' });
  }
});

module.exports = router; 