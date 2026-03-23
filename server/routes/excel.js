const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// Endpoint genérico para importar Excel
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Limpiar archivo temporal
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({ data, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar a Excel
router.post('/export', (req, res) => {
  const { data, filename } = req.body;

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export.xlsx'}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


